"""
Middleware для обробки 301 редиректів зі старих URL.
"""
from django.shortcuts import redirect
from django.http import Http404
from .models import NewsArticle
from .redirects import REDIRECTS


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




