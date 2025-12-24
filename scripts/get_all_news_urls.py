#!/usr/bin/env python
"""
Скрипт для отримання всіх URL статей зі старого сайту.
"""
import requests
from bs4 import BeautifulSoup
import time

BASE_URL = 'https://speak-up.com.ua/news'
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def get_all_news_urls():
    """Отримує всі URL статей з усіх сторінок."""
    all_urls = []
    page = 1

    while True:
        if page == 1:
            url = f"{BASE_URL}/"
        else:
            url = f"{BASE_URL}/page/{page}/"

        print(f"Отримання сторінки {page}...")

        try:
            response = requests.get(url, headers=HEADERS, timeout=30)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')

            # Знайти всі посилання на статті
            page_urls = []
            for link in soup.find_all('a', href=True):
                href = link.get('href', '')
                # Фільтруємо тільки статті (не архів, не пагінацію)
                if '/news/' in href and href not in ['/news/', '/news'] and '/page/' not in href:
                    # Нормалізуємо URL
                    if href.startswith('/'):
                        full_url = f"https://speak-up.com.ua{href}"
                    elif href.startswith('http'):
                        full_url = href
                    else:
                        continue

                    # Перевірка чи це стаття (має slug після /news/)
                    path = full_url.replace('https://speak-up.com.ua', '').replace('http://speak-up.com.ua', '')
                    if path.startswith('/news/') and path != '/news/' and len(path.split('/')) >= 3:
                        if full_url not in page_urls:
                            page_urls.append(full_url)

            if not page_urls:
                print(f"На сторінці {page} не знайдено статей. Зупиняємося.")
                break

            print(f"  Знайдено {len(page_urls)} статей на сторінці {page}")
            all_urls.extend(page_urls)

            # Перевірити чи є наступна сторінка
            next_page = soup.find('a', class_=lambda x: x and 'next' in ' '.join(x).lower() if x else False)
            if not next_page:
                # Спробувати знайти пагінацію
                pagination = soup.find_all('a', href=lambda x: x and f'/page/{page + 1}/' in x)
                if not pagination:
                    print(f"Наступної сторінки немає. Всього знайдено {len(all_urls)} статей.")
                    break

            page += 1
            time.sleep(1)  # Затримка між запитами

        except Exception as e:
            print(f"Помилка на сторінці {page}: {e}")
            break

    # Видалити дублікати та відсортувати
    unique_urls = list(set(all_urls))
    unique_urls.sort()

    # Витягти тільки шляхи (без домену)
    paths = []
    for url in unique_urls:
        path = url.replace('https://speak-up.com.ua', '').replace('http://speak-up.com.ua', '')
        if path not in paths:
            paths.append(path)

    return paths

if __name__ == '__main__':
    print("🚀 Отримання всіх URL статей зі старого сайту...")
    urls = get_all_news_urls()
    print(f"\n✅ Знайдено {len(urls)} унікальних статей")
    print("\nПерші 10 URL:")
    for url in urls[:10]:
        print(f"  {url}")
    print(f"\n... та ще {len(urls) - 10} статей")

    # Зберегти в файл
    with open('scripts/all_news_urls.txt', 'w') as f:
        for url in urls:
            f.write(f"{url}\n")
    print(f"\n💾 URL збережено в scripts/all_news_urls.txt")

