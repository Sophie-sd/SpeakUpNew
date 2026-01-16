"""
Асинхронне логування редіректів без блокування HTTP відповіді.
Використовує threading для запису в фоновому режимі.
"""
import logging
import threading
import json
from datetime import datetime
from pathlib import Path
from django.conf import settings

logger = logging.getLogger(__name__)


class AsyncRedirectLogger:
    """
    Асинхронне логування редіректів БЕЗ блокування HTTP відповіді.
    Використовує threading для запису в фоновому режимі.
    """

    def __init__(self):
        self.log_dir = Path(settings.BASE_DIR) / 'logs'
        self.log_dir.mkdir(exist_ok=True)
        self.log_file = self.log_dir / 'redirects.log'

    def log_redirect(self, request, old_url: str, new_url: str, redirect_type: str):
        """
        Логує редірект асинхронно в окремому thread.
        НЕ блокує HTTP відповідь.

        Args:
            request: Django request object
            old_url: Старий URL (звідки редірект)
            new_url: Новий URL (куди редірект)
            redirect_type: Тип редіректу ('static' або 'news')
        """
        if not getattr(settings, 'GTM_TRACKING_ENABLED', False):
            return

        # Збираємо дані (швидко, < 1ms)
        data = {
            'timestamp': datetime.utcnow().isoformat(),
            'old_url': old_url,
            'new_url': new_url,
            'redirect_type': redirect_type,
            'user_agent': request.META.get('HTTP_USER_AGENT', '')[:200],
            'referrer': request.META.get('HTTP_REFERER', '')[:200],
            'ip': self._get_client_ip(request),
        }

        # Записуємо в окремому thread (НЕ блокує)
        thread = threading.Thread(
            target=self._write_log,
            args=(data,),
            daemon=True  # Не блокує shutdown
        )
        thread.start()
        # Одразу повертаємось, не чекаємо завершення

    def _write_log(self, data: dict):
        """Записує лог у файл (виконується в окремому thread)."""
        try:
            with open(self.log_file, 'a', encoding='utf-8') as f:
                f.write(json.dumps(data) + '\n')
        except Exception as e:
            logger.error(f'Redirect logging error: {e}')

    def _get_client_ip(self, request) -> str:
        """Отримує IP клієнта."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', '')


# Singleton
redirect_logger = AsyncRedirectLogger()
