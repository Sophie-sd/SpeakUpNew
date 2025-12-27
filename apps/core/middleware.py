"""
Middleware для обробки 301 редиректів зі старих URL.
"""
from django.shortcuts import redirect
from django.http import Http404
from .models import NewsArticle


class NewsRedirectMiddleware:
    """
    Middleware для автоматичних 301 редиректів зі старих news URL.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Перевірка чи це старий news URL
        path = request.path

        # Якщо це news URL, перевіряємо чи є редирект
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
                # 301 редирект на новий URL
                new_url = article.get_absolute_url()
                return redirect(new_url, permanent=True)

        response = self.get_response(request)
        return response


