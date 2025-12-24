from django.utils.translation import get_language
from django.urls import translate_url
from django.core.cache import cache
from django.conf import settings

def seo_context(request):
    """
    Додає SEO мета-дані у всі templates.
    Кешується на 1 годину для performance.
    """
    current_lang = get_language()
    cache_key = f'seo_ctx:{request.path}:{current_lang}'

    # Спробувати взяти з кешу
    cached = cache.get(cache_key)
    if cached:
        return cached

    # Генерувати canonical URL
    canonical_url = request.build_absolute_uri(request.path)

    # Генерувати hreflang URLs
    hreflang_urls = []
    for lang_code in ['uk', 'ru']:
        try:
            translated_path = translate_url(request.path, lang_code)
            hreflang_urls.append({
                'lang': lang_code,
                'url': request.build_absolute_uri(translated_path)
            })
        except Exception:
            # Fallback якщо URL не перекладається
            hreflang_urls.append({
                'lang': lang_code,
                'url': canonical_url
            })

    # Генерувати абсолютний URL для OG image
    default_og_image = request.build_absolute_uri(settings.DEFAULT_OG_IMAGE)

    result = {
        'canonical_url': canonical_url,
        'hreflang_urls': hreflang_urls,
        'current_language': current_lang,
        'default_og_image': default_og_image,
        'google_site_verification': getattr(settings, 'GOOGLE_SITE_VERIFICATION', ''),
        'facebook_domain_verification': getattr(settings, 'FACEBOOK_DOMAIN_VERIFICATION', ''),
    }

    # Закешувати на 1 годину
    cache.set(cache_key, result, 3600)

    return result

