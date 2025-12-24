from django.contrib.sitemaps import Sitemap
from django.urls import reverse
from django.core.cache import cache
from .seo_config import SITEMAP_URLS
from .models import NewsArticle

class SpeakUpSitemap(Sitemap):
    """
    Sitemap для всіх 54 сторінок x 2 мови = 108 URL.
    З кешуванням для performance.
    """

    def items(self):
        """Повертає всі URL з seo_config."""
        return SITEMAP_URLS

    def location(self, item):
        """Генерує URL для кожного item."""
        url_name = item[0]

        # Якщо є slug (4-й елемент tuple)
        if len(item) >= 4:
            slug = item[3]
            cache_key = f'sitemap_url:{url_name}:{slug}'

            cached = cache.get(cache_key)
            if cached:
                return cached

            # Для city_page використовується 'city', для інших 'slug'
            if url_name == 'core:city_page':
                url = reverse(url_name, kwargs={'city': slug})
            else:
                url = reverse(url_name, kwargs={'slug': slug})

            cache.set(cache_key, url, 3600)
            return url
        else:
            # Простий URL без параметрів
            cache_key = f'sitemap_url:{url_name}'

            cached = cache.get(cache_key)
            if cached:
                return cached

            url = reverse(url_name)
            cache.set(cache_key, url, 3600)
            return url

    def priority(self, item):
        return item[1]

    def changefreq(self, item):
        return item[2]


class NewsSitemap(Sitemap):
    """
    Sitemap для news статей.
    Динамічно генерується з бази даних.
    """
    changefreq = 'weekly'
    priority = 0.7

    def items(self):
        """Повертає всі опубліковані статті."""
        return NewsArticle.objects.filter(is_published=True)

    def location(self, article):
        """Генерує URL для статті залежно від мови."""
        # Для sitemap використовуємо UK slug як базовий
        # Hreflang буде оброблятися окремо
        return reverse('core:news_detail', kwargs={'slug': article.slug_uk})

    def lastmod(self, article):
        """Остання дата модифікації."""
        return article.updated_at

