"""
URL configuration for SpeakUp project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf.urls.i18n import i18n_patterns
from django.views.generic import TemplateView
from django.contrib.sitemaps.views import sitemap
from apps.core.sitemaps import SpeakUpSitemap, NewsSitemap
from django.conf import settings
from django.conf.urls.static import static

# Sitemap config
sitemaps = {
    'static': SpeakUpSitemap,
    'news': NewsSitemap,
}

# Non-i18n URLs (без мовного префіксу)
urlpatterns = [
    path('admin/', admin.site.urls),
    path('robots.txt', TemplateView.as_view(
        template_name='robots.txt',
        content_type='text/plain',
        extra_context={'debug': settings.DEBUG}
    ), name='robots_txt'),
    path('sitemap.xml', sitemap, {'sitemaps': sitemaps}, name='sitemap'),
]

# i18n URLs (UK без префіксу, RU з /ru/)
urlpatterns += i18n_patterns(
    path('', include('apps.core.urls')),
    prefix_default_language=False,  # UK без префіксу
)

# Static/media files для DEBUG
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

