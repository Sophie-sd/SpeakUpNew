from django.db import models
from django.utils import timezone
from django.urls import reverse
from django.utils.translation import get_language


class BaseModel(models.Model):
    """Base model with common fields."""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class NewsArticle(BaseModel):
    """
    Модель для статей блогу новин.
    Підтримує окремі slug для UK та RU версій для збереження SEO.
    """
    # Slug для кожної мови (КРИТИЧНО для SEO - UK та RU мають різні slug!)
    slug_uk = models.SlugField(unique=True, max_length=200, db_index=True)
    slug_ru = models.SlugField(unique=True, max_length=200, null=True, blank=True, db_index=True)

    # Заголовки
    title_uk = models.CharField(max_length=200)
    title_ru = models.CharField(max_length=200, blank=True)

    # Контент (HTML) - повний HTML зі старого сайту
    content_uk = models.TextField()
    content_ru = models.TextField(blank=True)

    # SEO мета-дані
    meta_description_uk = models.TextField(max_length=500)
    meta_description_ru = models.TextField(max_length=500, blank=True)

    # Зображення
    featured_image = models.ImageField(upload_to='news/images/', null=True, blank=True)

    # Дати
    published_at = models.DateTimeField(default=timezone.now, db_index=True)

    # Для 301 редиректів (якщо URL змінився)
    old_url_uk = models.CharField(max_length=500, blank=True)
    old_url_ru = models.CharField(max_length=500, blank=True)

    # Статус
    is_published = models.BooleanField(default=True, db_index=True)

    class Meta:
        ordering = ['-published_at']
        indexes = [
            models.Index(fields=['slug_uk', 'is_published']),
            models.Index(fields=['slug_ru', 'is_published']),
            models.Index(fields=['published_at', 'is_published']),
        ]

    def __str__(self):
        return self.title_uk

    def get_absolute_url(self):
        """
        Генерує URL залежно від поточної мови.
        Використовує slug_ru для RU мови, інакше slug_uk.
        """
        lang = get_language()
        slug = self.slug_ru if lang == 'ru' and self.slug_ru else self.slug_uk
        return reverse('core:news_detail', kwargs={'slug': slug})

