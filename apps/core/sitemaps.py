from django.contrib.sitemaps import Sitemap
from django.urls import reverse
from django.utils.translation import activate, get_language
from .seo_config import SITEMAP_URLS
from .models import NewsArticle

class SpeakUpSitemap(Sitemap):
    """
    Sitemap для всіх сторінок в обох мовах (UK + RU).

    Структура items(): кожний item складається з:
    - original_item: данні з SITEMAP_URLS
    - lang: 'uk' або 'ru'
    """

    def items(self):
        """
        Повертає всі URL з обома мовними версіями.
        Для кожного оригінального item створюємо два записи (UK та RU).
        """
        items_with_langs = []
        for original_item in SITEMAP_URLS:
            # Додаємо українську версію
            items_with_langs.append({
                'original': original_item,
                'lang': 'uk'
            })
            # Додаємо російську версію
            items_with_langs.append({
                'original': original_item,
                'lang': 'ru'
            })
        return items_with_langs

    def location(self, item):
        """Генерує URL для кожного item (с мовним префіксом для RU)."""
        original_item = item['original']
        lang = item['lang']
        url_name = original_item[0]

        # Активуємо мову для reverse()
        activate(lang)

        try:
            # Якщо є slug (4-й елемент tuple)
            if len(original_item) >= 4:
                slug = original_item[3]

                # Для city_page використовується 'city', для інших 'slug'
                if url_name == 'core:city_page':
                    url = reverse(url_name, kwargs={'city': slug})
                else:
                    url = reverse(url_name, kwargs={'slug': slug})

                return url
            else:
                # Простий URL без параметрів
                url = reverse(url_name)
                return url
        finally:
            # Повертаємо попередню мову
            activate(get_language())

    def priority(self, item):
        """Повертає пріоритет з оригінального item."""
        return item['original'][1]

    def changefreq(self, item):
        """Повертає частоту оновлення з оригінального item."""
        return item['original'][2]


class NewsSitemap(Sitemap):
    """
    Sitemap для news статей в обох мовах (UK + RU).
    Динамічно генерується з бази даних.

    Для кожної статті створюємо два записи:
    - UK версія (без мовного префіксу)
    - RU версія (з /ru/ префіксом, якщо slug_ru існує)
    """
    changefreq = 'weekly'
    priority = 0.7

    def items(self):
        """
        Повертає всі опубліковані статті з мовними варіантами.
        Структура: [{'article': article, 'lang': 'uk'}, {'article': article, 'lang': 'ru'}, ...]
        """
        articles = NewsArticle.objects.filter(is_published=True)
        items_with_langs = []

        for article in articles:
            # Завжди додаємо UK версію
            items_with_langs.append({
                'article': article,
                'lang': 'uk'
            })

            # Додаємо RU версію тільки якщо slug_ru існує
            if article.slug_ru:
                items_with_langs.append({
                    'article': article,
                    'lang': 'ru'
                })

        return items_with_langs

    def location(self, item):
        """
        Генерує URL для статті залежно від мови.
        Автоматично добавляє /ru/ префікс для російської версії.
        """
        article = item['article']
        lang = item['lang']

        # Активуємо мову для reverse()
        activate(lang)

        try:
            # Вибираємо правильний slug залежно від мови
            if lang == 'ru' and article.slug_ru:
                slug = article.slug_ru
            else:
                slug = article.slug_uk

            return reverse('core:news_detail', kwargs={'slug': slug})
        finally:
            # Повертаємо попередню мову
            activate(get_language())

    def lastmod(self, item):
        """Остання дата модифікації статті."""
        return item['article'].updated_at

