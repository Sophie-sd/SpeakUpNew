#!/usr/bin/env python
"""
Скрипт для імпорту news статей зі старого сайту speak-up.com.ua.
Виконується: python manage.py shell < scripts/import_news.py
Або: python manage.py runscript import_news (якщо використовується django-extensions)
"""
import os
import sys
import django
from datetime import datetime
from urllib.parse import urlparse, urljoin
import requests
from bs4 import BeautifulSoup

# Налаштування Django
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'SpeakUp.settings.develop')
django.setup()

from apps.core.models import NewsArticle
from apps.core.utils import (
    clean_wordpress_html,
    extract_images_from_html,
    download_and_save_image,
    update_html_image_urls
)
from apps.core.seo_config import PROGRAMS, LOCATIONS, CITIES

# Конфігурація
OLD_SITE_BASE_URL = 'https://speak-up.com.ua'
NEW_SITE_BASE_URL = 'https://speak-up.com.ua'  # Після міграції домену
IMAGE_UPLOAD_PATH = 'news/images'


def get_all_news_urls():
    """
    Отримує список всіх URL статей зі старого сайту.
    Спочатку намагається прочитати з файлу, якщо немає - використовує вбудований список.
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    urls_file = os.path.join(script_dir, 'all_news_urls.txt')

    if os.path.exists(urls_file):
        print(f"📖 Читаю URL з файлу: {urls_file}")
        with open(urls_file, 'r') as f:
            urls = [line.strip() for line in f if line.strip()]
        print(f"   Знайдено {len(urls)} URL в файлі")
        return urls
    else:
        print("⚠️  Файл all_news_urls.txt не знайдено. Використовую вбудований список.")
        return [
            '/news/anglijska-v-it-porady-yak-prokachaty-anglijsku-programistu/',
            '/news/czifri-ta-chisla-na-anglijskij-movi-navchitisya-rahuvati-legko-z-speak-up/',
            '/news/degrees-of-comparison-of-adjectives/',
            '/news/fraz-na-anglyjskom-dlya-obshhenyya-v-otele/',
            '/news/kolory-v-anglijskij-movi-osnovni-nazvy-prykmetnyky-idiomy-ta-vidtinky/',
            '/news/kuhonne-pryladdya-ta-stolovi-prybory-anglijskoyu/',
            '/news/mnozhyna-imennykiv-v-anglijskij-movi-yak-utvoryuyetsya-ta-yaki-ye-vynyatky/',
            '/news/nepravylni-diyeslova-v-anglijskij-movi-irregular-verbs/',
            '/news/pisni-na-zanyattyah-anglijskoyi-movy/',
            '/news/vse-pro-past-simple-yak-utvoryuyetsya-pravyla-vzhyvannya-pryklady/',
            '/news/yak-vyvchyty-anglijskyj-alfavit/',
            '/news/zapalyuyemo-bazhannya-vyvchaty-anglijsku/',
        ]


def parse_article(url_path, lang='uk'):
    """
    Парсить статтю зі старого сайту.

    Args:
        url_path: Шлях до статті (наприклад /news/slug/)
        lang: Мова ('uk' або 'ru')

    Returns:
        Словник з даними статті
    """
    # Формуємо повний URL
    if lang == 'ru':
        full_url = f"{OLD_SITE_BASE_URL}/ru{url_path}"
    else:
        full_url = f"{OLD_SITE_BASE_URL}{url_path}"

    print(f"Парсинг: {full_url}")

    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        response = requests.get(full_url, timeout=30, headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        # Витягуємо дані
        title = soup.find('h1')
        title_text = title.get_text(strip=True) if title else ''

        # Meta description
        meta_desc = soup.find('meta', {'name': 'description'})
        meta_description = meta_desc.get('content', '') if meta_desc else ''

        # Canonical URL
        canonical = soup.find('link', {'rel': 'canonical'})
        canonical_url = canonical.get('href', '') if canonical else full_url

        # Контент
        content_div = soup.find('div', class_='entry-content') or soup.find('div', class_='post-content') or soup.find('article')
        if not content_div:
            # Fallback: шукаємо основний контент
            for div in soup.find_all('div', class_=lambda x: x and 'content' in ' '.join(x).lower() if x else False):
                content_div = div
                break

        if content_div:
            content_html = str(content_div)
        else:
            content_html = ''

        # Дата публікації
        from django.utils import timezone as tz
        date_elem = soup.find('div', class_='entry-date') or soup.find('time') or soup.find('div', class_='date')
        published_date = None
        if date_elem:
            date_text = date_elem.get_text(strip=True)
            # Парсинг дати (формат може бути різний)
            try:
                published_date = tz.make_aware(datetime.strptime(date_text, '%d.%m.%Y'))
            except:
                pass

        # Featured image
        featured_img = soup.find('img', class_=lambda x: x and 'wp-post-image' in ' '.join(x) if x else False)
        if not featured_img:
            featured_img = soup.find('div', class_='post-thumbnail')
            if featured_img:
                featured_img = featured_img.find('img')
        if not featured_img:
            featured_img = soup.find('article').find('img') if soup.find('article') else None

        featured_image_url = featured_img.get('src', '') if featured_img else ''

        # Slug з URL
        slug = url_path.split('/news/')[1].rstrip('/') if '/news/' in url_path else ''

        return {
            'title': title_text,
            'slug': slug,
            'content_html': content_html,
            'meta_description': meta_description,
            'canonical_url': canonical_url,
            'published_date': published_date or tz.now(),
            'featured_image_url': featured_image_url,
            'old_url': url_path,
        }
    except Exception as e:
        print(f"Помилка парсингу {full_url}: {e}")
        return None


def check_slug_conflicts(slug_uk, slug_ru=None):
    """
    Перевіряє чи slug не конфліктує з існуючими city/program slugs.

    Returns:
        Tuple (є_конфлікт, повідомлення)
    """
    conflicts = []

    # Перевірка з містами
    if slug_uk in CITIES:
        conflicts.append(f"Конфлікт з містом: {slug_uk}")

    # Перевірка з програмами
    if slug_uk in PROGRAMS:
        conflicts.append(f"Конфлікт з програмою: {slug_uk}")

    # Перевірка з локаціями
    if slug_uk in LOCATIONS:
        conflicts.append(f"Конфлікт з локацією: {slug_uk}")

    if slug_ru:
        if slug_ru in CITIES:
            conflicts.append(f"Конфлікт RU slug з містом: {slug_ru}")
        if slug_ru in PROGRAMS:
            conflicts.append(f"Конфлікт RU slug з програмою: {slug_ru}")
        if slug_ru in LOCATIONS:
            conflicts.append(f"Конфлікт RU slug з локацією: {slug_ru}")

    return len(conflicts) > 0, conflicts


def import_article(url_path):
    """
    Імпортує одну статтю (UK та RU версії).

    Args:
        url_path: Шлях до статті (наприклад /news/slug/)
    """
    print(f"\n{'='*60}")
    print(f"Імпорт статті: {url_path}")
    print(f"{'='*60}")

    # Парсинг UK версії
    uk_data = parse_article(url_path, lang='uk')
    if not uk_data:
        print(f"❌ Не вдалося отримати UK версію")
        return False

    # Парсинг RU версії
    ru_data = parse_article(url_path, lang='ru')

    # Перевірка конфліктів slug
    has_conflict, conflicts = check_slug_conflicts(uk_data['slug'], ru_data['slug'] if ru_data else None)
    if has_conflict:
        print(f"⚠️  УВАГА: Конфлікти slug: {', '.join(conflicts)}")
        response = input("Продовжити? (y/n): ")
        if response.lower() != 'y':
            return False

    # Перевірка чи стаття вже існує
    existing = NewsArticle.objects.filter(slug_uk=uk_data['slug']).first()
    if existing:
        print(f"⚠️  Стаття з slug_uk='{uk_data['slug']}' вже існує. Пропускаємо.")
        return False

    # Завантаження та обробка зображень
    print("📥 Завантаження зображень...")
    image_mapping = {}

    # Featured image
    if uk_data.get('featured_image_url'):
        local_path, success = download_and_save_image(
            uk_data['featured_image_url'],
            IMAGE_UPLOAD_PATH
        )
        if success:
            image_mapping[uk_data['featured_image_url']] = local_path
            uk_data['featured_image'] = local_path

    # Зображення з контенту
    all_images = extract_images_from_html(uk_data['content_html'], OLD_SITE_BASE_URL)
    for img_info in all_images:
        original_src = img_info['original_src']
        webp_src = img_info['src']

        # Спробувати завантажити оригінальне зображення
        if original_src not in image_mapping:
            local_path, success = download_and_save_image(
                original_src,
                IMAGE_UPLOAD_PATH
            )
            if success:
                # Додати всі варіанти URL в маппінг
                image_mapping[original_src] = local_path
                image_mapping[webp_src] = local_path  # webp версія теж вказує на локальний файл

                # Додати варіанти з розмірами (якщо є в srcset)
                # Наприклад: image-300x200.jpg -> local_path
                import re
                base_url = original_src.split('?')[0]
                for variant in [original_src, webp_src]:
                    # Знайти всі варіанти з розмірами
                    size_pattern = r'(\d+)x(\d+)'
                    if re.search(size_pattern, variant):
                        # Додати базовий варіант без розмірів
                        base_variant = re.sub(r'-\d+x\d+', '', variant)
                        image_mapping[base_variant] = local_path

    # Очищення та оновлення HTML
    print("🧹 Очищення HTML...")
    uk_data['content_html'] = clean_wordpress_html(uk_data['content_html'])
    uk_data['content_html'] = update_html_image_urls(uk_data['content_html'], image_mapping)

    if ru_data:
        ru_data['content_html'] = clean_wordpress_html(ru_data['content_html'])
        ru_data['content_html'] = update_html_image_urls(ru_data['content_html'], image_mapping)

    # Створення об'єкта NewsArticle
    article = NewsArticle(
        slug_uk=uk_data['slug'],
        slug_ru=ru_data['slug'] if ru_data else None,
        title_uk=uk_data['title'],
        title_ru=ru_data['title'] if ru_data else '',
        content_uk=uk_data['content_html'],
        content_ru=ru_data['content_html'] if ru_data else '',
        meta_description_uk=uk_data['meta_description'],
        meta_description_ru=ru_data['meta_description'] if ru_data else '',
        published_at=uk_data['published_date'],
        old_url_uk=uk_data['old_url'],
        old_url_ru=ru_data['old_url'] if ru_data else '',
        is_published=True,
    )

    if uk_data.get('featured_image'):
        article.featured_image = uk_data['featured_image']

    article.save()

    print(f"✅ Статтю успішно імпортовано: {article.title_uk}")
    print(f"   UK URL: {article.get_absolute_url()}")
    if article.slug_ru:
        print(f"   RU URL: /ru{article.get_absolute_url()}")

    return True


def main():
    """Головна функція імпорту."""
    print("🚀 Початок імпорту news статей зі старого сайту")
    print(f"   Старий сайт: {OLD_SITE_BASE_URL}")
    print(f"   Новий сайт: {NEW_SITE_BASE_URL}")
    print()

    # Отримати список URL
    news_urls = get_all_news_urls()

    if not news_urls:
        print("❌ Список URL порожній. Додайте URL статей в функцію get_all_news_urls()")
        return

    # Перевірити які статті вже імпортовані
    from apps.core.models import NewsArticle
    existing_slugs = set(NewsArticle.objects.values_list('slug_uk', flat=True))

    # Фільтруємо URL - пропускаємо вже імпортовані
    urls_to_import = []
    for url_path in news_urls:
        slug = url_path.split('/news/')[1].rstrip('/') if '/news/' in url_path else ''
        if slug and slug not in existing_slugs:
            urls_to_import.append(url_path)

    print(f"📋 Всього статей: {len(news_urls)}")
    print(f"   Вже імпортовано: {len(news_urls) - len(urls_to_import)}")
    print(f"   Потрібно імпортувати: {len(urls_to_import)}")
    print()

    if not urls_to_import:
        print("✅ Всі статті вже імпортовані!")
        return

    imported = 0
    failed = 0
    skipped = 0

    # Імпортуємо по одній статті з затримкою
    import time
    for i, url_path in enumerate(urls_to_import, 1):
        print(f"\n[{i}/{len(urls_to_import)}] ", end='')
        try:
            result = import_article(url_path)
            if result:
                imported += 1
            else:
                skipped += 1
        except Exception as e:
            print(f"❌ КРИТИЧНА ПОМИЛКА імпорту {url_path}: {e}")
            import traceback
            traceback.print_exc()
            failed += 1

        # Затримка між імпортами (щоб не перевантажити сервер)
        if i < len(urls_to_import):
            time.sleep(2)  # 2 секунди між статтями

        # Проміжний звіт кожні 10 статей
        if i % 10 == 0:
            print(f"\n📊 Проміжний звіт: імпортовано {imported}, пропущено {skipped}, помилок {failed}")

    print()
    print(f"{'='*60}")
    print(f"✅ Імпорт завершено!")
    print(f"   Успішно імпортовано: {imported}")
    print(f"   Пропущено: {skipped}")
    print(f"   Помилок: {failed}")
    print(f"   Всього в базі: {NewsArticle.objects.count()}")
    print(f"{'='*60}")


if __name__ == '__main__':
    main()

