from django.contrib import admin
from django.utils import timezone
from django.contrib import messages
from .models import (
    NewsArticle, Achievement, Advantage, CourseCategory, Course,
    Testimonial, FAQ, ConsultationRequest
)


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


# ============================================================================
# Homepage Content Admins
# ============================================================================

@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ['number', 'suffix', 'label_uk', 'order', 'is_active']
    list_filter = ['is_active']
    search_fields = ['label_uk', 'label_ru']
    list_editable = ['order', 'is_active']


@admin.register(Advantage)
class AdvantageAdmin(admin.ModelAdmin):
    list_display = ['title_uk', 'order', 'is_active']
    list_filter = ['is_active']
    search_fields = ['title_uk', 'title_ru']
    list_editable = ['order', 'is_active']


@admin.register(CourseCategory)
class CourseCategoryAdmin(admin.ModelAdmin):
    list_display = ['name_uk', 'slug', 'order']
    search_fields = ['name_uk', 'name_ru']
    prepopulated_fields = {'slug': ('name_uk',)}
    list_editable = ['order']


class CourseInline(admin.TabularInline):
    model = Course
    extra = 1
    fields = ['title_uk', 'slug', 'order', 'is_active']
    prepopulated_fields = {'slug': ('title_uk',)}


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['title_uk', 'category', 'order', 'is_active']
    list_filter = ['category', 'is_active']
    search_fields = ['title_uk', 'title_ru']
    prepopulated_fields = {'slug': ('title_uk',)}
    list_editable = ['order', 'is_active']
    fieldsets = (
        ('Основна інформація', {
            'fields': ('category', 'title_uk', 'title_ru', 'slug', 'order', 'is_active')
        }),
        ('Опис', {
            'fields': ('short_desc_uk', 'short_desc_ru')
        }),
        ('Детальний контент', {
            'fields': ('detail_content_uk', 'detail_content_ru')
        }),
    )


@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ['name', 'text_preview', 'rating', 'is_published', 'created_at']
    list_filter = ['is_published', 'rating', 'created_at']
    search_fields = ['name', 'text']
    readonly_fields = ['created_at', 'updated_at', 'moderated_at', 'moderated_by']
    actions = ['publish_testimonials', 'reject_testimonials']

    fieldsets = (
        ('Відгук', {
            'fields': ('name', 'text', 'rating')
        }),
        ('Модерація', {
            'fields': ('is_published', 'moderated_at', 'moderated_by')
        }),
        ('Системна інформація', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def text_preview(self, obj):
        return obj.text[:50] + '...' if len(obj.text) > 50 else obj.text
    text_preview.short_description = 'Текст'

    def publish_testimonials(self, request, queryset):
        updated = queryset.update(
            is_published=True,
            moderated_at=timezone.now(),
            moderated_by=request.user
        )
        self.message_user(request, f'{updated} відгуків опубліковано.', messages.SUCCESS)
    publish_testimonials.short_description = 'Опублікувати вибрані відгуки'

    def reject_testimonials(self, request, queryset):
        updated = queryset.update(
            is_published=False,
            moderated_at=timezone.now(),
            moderated_by=request.user
        )
        self.message_user(request, f'{updated} відгуків відхилено.', messages.SUCCESS)
    reject_testimonials.short_description = 'Відхилити вибрані відгуки'


@admin.register(FAQ)
class FAQAdmin(admin.ModelAdmin):
    list_display = ['question_uk', 'order', 'is_active']
    list_filter = ['is_active']
    search_fields = ['question_uk', 'question_ru']
    list_editable = ['order', 'is_active']


@admin.register(ConsultationRequest)
class ConsultationRequestAdmin(admin.ModelAdmin):
    list_display = ['phone', 'prefers_messenger', 'messenger_choice', 'created_at']
    list_filter = ['prefers_messenger', 'messenger_choice', 'created_at']
    search_fields = ['phone']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'

    fieldsets = (
        ('Контактна інформація', {
            'fields': ('phone', 'prefers_messenger', 'messenger_choice')
        }),
        ('UTM Tracking', {
            'fields': ('utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'),
            'classes': ('collapse',)
        }),
        ('Додаткова інформація', {
            'fields': ('fbclid', 'gclid', 'referrer', 'ip_address'),
            'classes': ('collapse',)
        }),
        ('Системна інформація', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

