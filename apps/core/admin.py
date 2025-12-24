from django.contrib import admin
from .models import NewsArticle


@admin.register(NewsArticle)
class NewsArticleAdmin(admin.ModelAdmin):
    """Admin для управління news статтями."""
    list_display = ['title_uk', 'slug_uk', 'slug_ru', 'published_at', 'is_published']
    list_filter = ['is_published', 'published_at', 'created_at']
    search_fields = ['title_uk', 'title_ru', 'slug_uk', 'slug_ru']
    prepopulated_fields = {'slug_uk': ('title_uk',), 'slug_ru': ('title_ru',)}
    date_hierarchy = 'published_at'
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Основна інформація', {
            'fields': ('title_uk', 'title_ru', 'slug_uk', 'slug_ru', 'is_published')
        }),
        ('Контент', {
            'fields': ('content_uk', 'content_ru')
        }),
        ('SEO', {
            'fields': ('meta_description_uk', 'meta_description_ru', 'featured_image')
        }),
        ('Дата публікації', {
            'fields': ('published_at',)
        }),
        ('Редиректи (для міграції)', {
            'fields': ('old_url_uk', 'old_url_ru'),
            'classes': ('collapse',)
        }),
        ('Системна інформація', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

