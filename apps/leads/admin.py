from django.contrib import admin
from .models import TrialLesson, RunningLineText


@admin.register(TrialLesson)
class TrialLessonAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'test_status', 'created_at', 'utm_source']
    list_filter = ['test_status', 'created_at', 'utm_source', 'email_sent']
    search_fields = ['name', 'phone', 'utm_campaign']
    readonly_fields = ['created_at', 'ip_address', 'fbclid', 'gclid', 'referrer']

    fieldsets = (
        ('Основна інформація', {
            'fields': ('name', 'phone', 'created_at', 'ip_address')
        }),
        ('Тест', {
            'fields': ('test_status', 'test_results')
        }),
        ('UTM параметри', {
            'fields': ('utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'),
            'classes': ('collapse',)
        }),
        ('Реклама', {
            'fields': ('fbclid', 'gclid', 'referrer'),
            'classes': ('collapse',)
        }),
        ('Нотифікації', {
            'fields': ('email_sent', 'telegram_sent', 'notified_at')
        }),
    )


@admin.register(RunningLineText)
class RunningLineTextAdmin(admin.ModelAdmin):
    list_display = ['text', 'is_active', 'order']
    list_editable = ['is_active', 'order']


