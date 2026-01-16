"""
Management command для обробки redirect logs і відправки в GTM.
"""
import json
import requests
import time
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings


class Command(BaseCommand):
    help = 'Обробляє redirect logs і відправляє в GTM'

    def handle(self, *args, **options):
        log_file = Path(settings.BASE_DIR) / 'logs' / 'redirects.log'
        processed_dir = Path(settings.BASE_DIR) / 'logs' / 'processed'

        # Створюємо папку для оброблених логів
        processed_dir.mkdir(exist_ok=True)

        if not log_file.exists():
            self.stdout.write('No redirects to process')
            return

        # Читаємо лог
        try:
            with open(log_file, 'r', encoding='utf-8') as f:
                lines = f.readlines()
        except Exception as e:
            self.stderr.write(f'Error reading log file: {e}')
            return

        if not lines:
            self.stdout.write('Log file is empty')
            return

        # Відправляємо в GTM (можна батчами)
        success_count = 0
        error_count = 0

        for line in lines:
            try:
                data = json.loads(line.strip())
                if self._send_to_gtm(data):
                    success_count += 1
                else:
                    error_count += 1
                time.sleep(0.05)  # Rate limiting
            except json.JSONDecodeError as e:
                self.stderr.write(f'Invalid JSON in log: {e}')
                error_count += 1
            except Exception as e:
                self.stderr.write(f'Error processing redirect: {e}')
                error_count += 1

        # Архівуємо оброблені логи
        try:
            timestamp = time.strftime('%Y%m%d_%H%M%S')
            processed_file = processed_dir / f'redirects_{timestamp}.log'

            with open(processed_file, 'w', encoding='utf-8') as f:
                f.writelines(lines)

            # Очищаємо основний лог
            log_file.unlink()

            self.stdout.write(
                self.style.SUCCESS(
                    f'Processed {len(lines)} redirects '
                    f'(Success: {success_count}, Errors: {error_count})'
                )
            )
        except Exception as e:
            self.stderr.write(f'Error archiving logs: {e}')

    def _send_to_gtm(self, data: dict) -> bool:
        """
        Відправляє event в GTM.
        Returns: True if successful, False otherwise
        """
        if not getattr(settings, 'GTM_SERVER_CONTAINER_URL', ''):
            return False

        try:
            # GA4 Measurement Protocol
            payload = {
                'client_id': 'server_side',
                'events': [{
                    'name': 'page_view',
                    'params': {
                        'page_location': data.get('old_url', ''),
                        'redirect_to': data.get('new_url', ''),
                        'redirect_type': data.get('redirect_type', 'unknown'),
                    }
                }]
            }

            response = requests.post(
                f'{settings.GTM_SERVER_CONTAINER_URL}/g/collect',
                params={
                    'measurement_id': getattr(settings, 'GTM_MEASUREMENT_ID', ''),
                    'api_secret': getattr(settings, 'GTM_API_SECRET', ''),
                },
                json=payload,
                timeout=5
            )

            return response.status_code in [200, 204]
        except requests.Timeout:
            return False
        except Exception as e:
            return False
