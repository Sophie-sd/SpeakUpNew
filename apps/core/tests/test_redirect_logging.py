"""
Тести для GTM redirect logging функціоналу.
"""
import time
import json
from pathlib import Path
from django.test import TestCase, RequestFactory, override_settings
from django.conf import settings
from apps.core.utils.redirect_logger import AsyncRedirectLogger


class RedirectLoggerTest(TestCase):
    """Тести для AsyncRedirectLogger"""

    def setUp(self):
        self.factory = RequestFactory()
        self.logger = AsyncRedirectLogger()
        self.log_file = Path(settings.BASE_DIR) / 'logs' / 'redirects.log'

        # Очищаємо лог файл перед кожним тестом
        if self.log_file.exists():
            self.log_file.unlink()

    def tearDown(self):
        # Очищаємо лог файл після тесту
        if self.log_file.exists():
            self.log_file.unlink()

    @override_settings(GTM_TRACKING_ENABLED=True)
    def test_logging_does_not_block(self):
        """Перевіряє що логування не блокує редірект."""
        request = self.factory.get('/old-url/')

        start = time.time()
        self.logger.log_redirect(
            request=request,
            old_url='/old/',
            new_url='/new/',
            redirect_type='test'
        )
        duration = time.time() - start

        # Має бути < 10ms (без ожидания запису в файл)
        self.assertLess(duration, 0.01, f'Logging blocks redirect! Duration: {duration*1000}ms')

    @override_settings(GTM_TRACKING_ENABLED=True)
    def test_logging_creates_file(self):
        """Перевіряє що логування створює файл логів."""
        request = self.factory.get('/old-url/', HTTP_USER_AGENT='Mozilla/5.0', HTTP_REFERER='https://example.com')

        self.logger.log_redirect(
            request=request,
            old_url='/old/',
            new_url='/new/',
            redirect_type='test'
        )

        # Чекаємо трохи щоб thread встиг записати
        time.sleep(0.5)

        # Перевіряємо що файл існує
        self.assertTrue(self.log_file.exists(), 'Log file was not created')

        # Читаємо файл
        with open(self.log_file, 'r') as f:
            lines = f.readlines()

        self.assertEqual(len(lines), 1, 'Log file should have 1 entry')

        # Парсимо JSON
        data = json.loads(lines[0])
        self.assertEqual(data['old_url'], '/old/')
        self.assertEqual(data['new_url'], '/new/')
        self.assertEqual(data['redirect_type'], 'test')

    @override_settings(GTM_TRACKING_ENABLED=False)
    def test_logging_disabled(self):
        """Перевіряє що логування можна вимкнути через GTM_TRACKING_ENABLED."""
        request = self.factory.get('/old-url/')

        self.logger.log_redirect(
            request=request,
            old_url='/old/',
            new_url='/new/',
            redirect_type='test'
        )

        time.sleep(0.5)

        # Файл не повинен бути створений
        self.assertFalse(self.log_file.exists(), 'Log file should not be created when tracking disabled')

    def test_ip_extraction(self):
        """Перевіряє що IP адреса витягується коректно."""
        # Тест з X-Forwarded-For
        request = self.factory.get('/old-url/', HTTP_X_FORWARDED_FOR='192.168.1.1, 10.0.0.1')
        ip = self.logger._get_client_ip(request)
        self.assertEqual(ip, '192.168.1.1')

        # Тест з REMOTE_ADDR
        request = self.factory.get('/old-url/')
        request.META['REMOTE_ADDR'] = '127.0.0.1'
        ip = self.logger._get_client_ip(request)
        self.assertEqual(ip, '127.0.0.1')

    @override_settings(GTM_TRACKING_ENABLED=True)
    def test_user_agent_truncation(self):
        """Перевіряє що User-Agent обрізається до 200 символів."""
        long_user_agent = 'A' * 300
        request = self.factory.get('/old-url/', HTTP_USER_AGENT=long_user_agent)

        self.logger.log_redirect(
            request=request,
            old_url='/old/',
            new_url='/new/',
            redirect_type='test'
        )

        time.sleep(0.5)

        with open(self.log_file, 'r') as f:
            lines = f.readlines()

        data = json.loads(lines[0])
        self.assertEqual(len(data['user_agent']), 200)
