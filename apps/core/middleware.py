"""
Middleware для обробки 301 редиректів зі старих URL.
"""
from django.shortcuts import redirect
from django.http import Http404, HttpResponse, HttpResponseBadRequest
from django.conf import settings
from .models import NewsArticle
from .redirects import REDIRECTS


class AllowedHostsMiddleware:
    """
    Middleware для обробки ALLOWED_HOSTS.
    Автоматично дозволяє всі хости, якщо ALLOWED_HOSTS не налаштований або містить '*'.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def process_request(self, request):
        """
        process_request викликається ДО SecurityMiddleware.process_request,
        що дозволяє нам модифікувати ALLOWED_HOSTS перед перевіркою.
        """
        allowed_hosts = getattr(settings, 'ALLOWED_HOSTS', [])

        # Якщо ALLOWED_HOSTS порожній або містить '*', дозволяємо всі хости
        allow_all = not allowed_hosts or '*' in allowed_hosts

        if allow_all:
            try:
                host = request.get_host().split(':')[0]  # Без порту
                # Додаємо хост до ALLOWED_HOSTS динамічно
                if host not in settings.ALLOWED_HOSTS:
                    settings.ALLOWED_HOSTS.append(host)
            except Exception:
                # Якщо не можемо отримати хост, не блокуємо запит
                pass

        return None  # None означає "продовжити обробку"

    def __call__(self, request):
        response = self.get_response(request)
        return response


class HealthCheckMiddleware:
    """
    Middleware для обробки healthcheck запитів від Render.
    Обробляє запити до / та /healthz до перевірки ALLOWED_HOSTS.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path
        user_agent = request.META.get('HTTP_USER_AGENT', '')

        # Перевірка чи це healthcheck від Render
        is_render_healthcheck = (
            user_agent.startswith('Render/') or
            user_agent.startswith('Go-http-client/') or
            request.META.get('REMOTE_ADDR', '').startswith('10.228.')
        )

        # Обробка healthcheck запитів
        if is_render_healthcheck and (path == '/' or path == '/healthz'):
            return HttpResponse('OK', content_type='text/plain', status=200)

        response = self.get_response(request)
        return response


class GoogleAdsBotMiddleware:
    """
    Middleware для обробки запитів від Google Ads ботів.

    Визначає запити від Google Ads ботів за User-Agent та передає їх
    без редиректу SECURE_SSL_REDIRECT, щоб уникнути редирект-петель
    або помилок 404.

    Google Ads боти можуть надсилати нестандартні заголовки, які
    викликають конфлікти з SecurityMiddleware.
    """

    # Google Ads bot User-Agent patterns
    GOOGLE_ADS_BOT_PATTERNS: list[str] = [
        'AdsBot-Google',
        'Mediapartners-Google',
        'Google-Ads-Markup-Crawler',
        'Googlebot-Mobile',  # Mobile crawler
    ]

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request) -> HttpResponse:
        user_agent: str = request.META.get('HTTP_USER_AGENT', '')

        # Перевіряємо чи це Google Ads бот
        is_google_ads_bot: bool = any(
            pattern in user_agent for pattern in self.GOOGLE_ADS_BOT_PATTERNS
        )

        # Встановлюємо атрибут на request для інших компонентів
        request._google_ads_bot = is_google_ads_bot

        response: HttpResponse = self.get_response(request)
        return response


class NewsRedirectMiddleware:
    """
    Middleware для автоматичних 301 редиректів зі старих news URL та інших старих URL.
    Обробляє trailing slashes автоматично.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path
        # Нормалізуємо шлях для перевірки (без trailing slash, крім кореня)
        path_normalized = path.rstrip('/') if path != '/' else '/'

        # Перевірка статичних редиректів (спочатку точне співпадіння)
        if path in REDIRECTS:
            new_url = REDIRECTS[path]
            return redirect(new_url, permanent=True)

        # Перевірка нормалізованого шляху (для обробки trailing slash)
        if path_normalized in REDIRECTS and path_normalized != path:
            new_url = REDIRECTS[path_normalized]
            return redirect(new_url, permanent=True)

        # Перевірка чи це старий news URL
        # Перевіряємо обидва варіанти (з trailing slash та без)
        news_paths_to_check = [path, path_normalized] if path != path_normalized else [path]

        for check_path in news_paths_to_check:
            if check_path.startswith('/news/') and check_path != '/news/':
                # Шукаємо статтю за old_url_uk або old_url_ru
                article = NewsArticle.objects.filter(
                    old_url_uk=check_path
                ).first()

                if not article:
                    article = NewsArticle.objects.filter(
                        old_url_ru=check_path
                    ).first()

                if article:
                    # 301 редирект на новий URL ТІЛЬКИ якщо URL відрізняється
                    new_url = article.get_absolute_url()
                    if new_url != path:
                        return redirect(new_url, permanent=True)

        response = self.get_response(request)
        return response


class WordPressBlockMiddleware:
    """
    Middleware для блокування WordPress шляхів з 410 Gone.
    410 Gone каже пошуковим системам, що ресурси назавжди видалені.
    Це прискорює видалення старих WordPress URL з індексів.

    Порядок обробки:
    1. Якщо URL починається з WordPress префіксу → 410 Gone
    2. Якщо URL містить *.php після /wp- → 410 Gone
    3. Інакше → дозволити подальшу обробку
    """
    # WordPress шляхи для блокування
    WORDPRESS_PATHS = [
        '/wp-content/',
        '/wp-admin/',
        '/wp-includes/',
        '/wp-json/',
        '/wp-login.php',
        '/wp-cron.php',
        '/xmlrpc.php',
        '/readme.html',
        '/license.txt',
        '/wp-config.php',
        '/wp-trackback.php',
        '/wp-signup.php',
        '/wp-activate.php',
        '/wp-mail.php',
        '/wp-links-opml.php',
        '/wp-comments-post.php',
        '/wp-settings.php',
    ]

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path

        # Перевірка чи шлях починається з будь-якого WordPress префіксу
        if any(path.startswith(wp_path) for wp_path in self.WORDPRESS_PATHS):
            # 410 Gone - ресурс назавжди видалено
            return HttpResponse(
                'This WordPress resource has been permanently removed. The site now runs on Django.',
                status=410,
                content_type='text/plain'
            )

        # Також блокуємо загальний паттерн /wp-*.php
        if path.startswith('/wp-') and path.endswith('.php'):
            return HttpResponse(
                'This WordPress resource has been permanently removed.',
                status=410,
                content_type='text/plain'
            )

        response = self.get_response(request)
        return response
