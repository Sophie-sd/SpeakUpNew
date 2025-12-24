"""
Utility functions for core app.
"""
import re
import requests
from typing import Any, Dict, List, Tuple
from urllib.parse import urlparse, urljoin
from bs4 import BeautifulSoup
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage


def clean_wordpress_html(html_content: str) -> str:
    """
    Очищає HTML від WordPress-специфічних класів та inline styles.
    Зберігає структуру та семантику.

    Args:
        html_content: HTML контент з WordPress

    Returns:
        Очищений HTML контент
    """
    if not html_content:
        return html_content

    soup = BeautifulSoup(html_content, 'html.parser')

    # Видалити WordPress-специфічні класи
    wordpress_classes = [
        'wp-image-', 'aligncenter', 'alignleft', 'alignright',
        'size-full', 'size-medium', 'size-large', 'size-thumbnail',
        'wp-block-', 'has-', 'is-'
    ]

    for element in soup.find_all(True):
        # Видалити WordPress класи
        if element.get('class'):
            classes = element.get('class', [])
            cleaned_classes = [
                cls for cls in classes
                if not any(wp_cls in cls for wp_cls in wordpress_classes)
            ]
            if cleaned_classes:
                element['class'] = cleaned_classes
            else:
                del element['class']

        # Видалити inline styles (font-weight: 400 тощо)
        if element.get('style'):
            style = element.get('style', '')
            # Видалити font-weight: 400 та подібні
            style = re.sub(r'font-weight:\s*400;?\s*', '', style)
            style = re.sub(r'font-weight:\s*normal;?\s*', '', style)
            if style.strip():
                element['style'] = style.strip()
            else:
                del element['style']

    # Зберегти srcset та sizes для responsive images
    # (вони вже є в HTML, просто не видаляємо їх)

    return str(soup)


def extract_images_from_html(html_content: str, base_url: str = '') -> List[Dict[str, str]]:
    """
    Витягує всі зображення з HTML контенту.

    Args:
        html_content: HTML контент
        base_url: Базовий URL для відносних посилань

    Returns:
        Список словників з інформацією про зображення
    """
    if not html_content:
        return []

    soup = BeautifulSoup(html_content, 'html.parser')
    images = []

    for img in soup.find_all('img'):
        src = img.get('src', '')
        if not src:
            continue

        # Конвертувати відносні URL в абсолютні
        if base_url and not src.startswith('http'):
            src = urljoin(base_url, src)

        # Отримати оригінальне зображення (без webp-express)
        # webp-express додає .webp в кінець, потрібно видалити
        original_src = src.replace('.webp', '').split('?')[0]

        images.append({
            'src': src,
            'original_src': original_src,
            'alt': img.get('alt', ''),
            'width': img.get('width', ''),
            'height': img.get('height', ''),
        })

    return images


def download_and_save_image(image_url: str, upload_path: str) -> Tuple[str, bool]:
    """
    Завантажує зображення з URL та зберігає локально.

    Args:
        image_url: URL зображення
        upload_path: Шлях для збереження (відносно MEDIA_ROOT)

    Returns:
        Tuple (локальний URL, успіх)
    """
    try:
        # Завантажити зображення
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        response = requests.get(image_url, timeout=30, allow_redirects=True, headers=headers)
        response.raise_for_status()

        # Отримати ім'я файлу з URL
        parsed_url = urlparse(image_url)
        filename = parsed_url.path.split('/')[-1]
        if not filename or '.' not in filename:
            filename = 'image.jpg'

        # Зберегти файл
        full_path = default_storage.save(
            f'{upload_path}/{filename}',
            ContentFile(response.content)
        )

        return full_path, True
    except Exception as e:
        print(f"Помилка завантаження зображення {image_url}: {e}")
        return '', False


def update_html_image_urls(html_content: str, image_mapping: Dict[str, str]) -> str:
    """
    Оновлює URL зображень в HTML на локальні.
    Оновлює src, srcset та всі варіанти URL.

    Args:
        html_content: HTML контент
        image_mapping: Словник {старий_url: новий_url}

    Returns:
        HTML з оновленими URL
    """
    if not html_content or not image_mapping:
        return html_content

    soup = BeautifulSoup(html_content, 'html.parser')

    for img in soup.find_all('img'):
        old_src = img.get('src', '')

        # Знайти відповідний новий URL (перевіряємо різні варіанти)
        new_src = None
        for old_url, new_url in image_mapping.items():
            # Перевірка точного збігу
            if old_src == old_url:
                new_src = new_url
                break
            # Перевірка webp варіантів
            if old_src.replace('.webp', '') == old_url.replace('.webp', ''):
                new_src = new_url
                break
            # Перевірка з розмірами (наприклад, image-300x200.jpg)
            if old_url in old_src or old_src.split('?')[0] == old_url.split('?')[0]:
                new_src = new_url
                break

        if new_src:
            img['src'] = new_src
            # Оновити також srcset якщо є
            if img.get('srcset'):
                srcset = img.get('srcset', '')
                for old_url, new_url in image_mapping.items():
                    # Замінити всі варіанти старого URL в srcset
                    srcset = srcset.replace(old_url, new_url)
                    # Також замінити webp варіанти
                    srcset = srcset.replace(old_url.replace('.webp', ''), new_url)
                    srcset = srcset.replace(old_url + '.webp', new_url)
                img['srcset'] = srcset

    # Також оновити посилання в тексті (якщо є)
    html_str = str(soup)
    for old_url, new_url in image_mapping.items():
        html_str = html_str.replace(old_url, new_url)
        # Також замінити webp варіанти
        html_str = html_str.replace(old_url.replace('.webp', ''), new_url)
        html_str = html_str.replace(old_url + '.webp', new_url)

    return html_str

