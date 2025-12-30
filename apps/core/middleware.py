"""
Middleware для обробки 301 редиректів зі старих URL.
"""
from django.shortcuts import redirect
from django.http import Http404, HttpResponse
from .models import NewsArticle
from .redirects import REDIRECTS


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


class NewsRedirectMiddleware:
    """
    Middleware для автоматичних 301 редиректів зі старих news URL та інших старих URL.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path

        # Перевірка статичних редиректів
        if path in REDIRECTS:
            new_url = REDIRECTS[path]
            return redirect(new_url, permanent=True)

        # Перевірка чи це старий news URL
        if path.startswith('/news/') and path != '/news/':
            # Шукаємо статтю за old_url_uk або old_url_ru
            article = NewsArticle.objects.filter(
                old_url_uk=path
            ).first()

            if not article:
                article = NewsArticle.objects.filter(
                    old_url_ru=path
                ).first()

            if article:
                # 301 редирект на новий URL ТІЛЬКИ якщо URL відрізняється
                new_url = article.get_absolute_url()
                if new_url != path:
                    return redirect(new_url, permanent=True)

        response = self.get_response(request)
        return response




