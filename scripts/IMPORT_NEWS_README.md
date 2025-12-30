# Інструкція з імпорту news статей

## Перед імпортом

1. Встановіть залежності:
```bash
pip install -r requirements.txt
```

2. Створіть міграції та застосуйте їх:
```bash
python manage.py makemigrations
python manage.py migrate
```

3. Оновіть функцію `get_all_news_urls()` в `scripts/import_news.py`:
   - Додайте всі URL статей зі старого сайту
   - Або створіть автоматичний скрапінг архіву `/news/`

## Виконання імпорту

### Варіант 1: Через Django shell
```bash
python manage.py shell < scripts/import_news.py
```

### Варіант 2: Прямий запуск
```bash
python scripts/import_news.py
```

### Варіант 3: Інтерактивний режим
```bash
python manage.py shell
>>> exec(open('scripts/import_news.py').read())
```

## Що робить скрипт

1. **Парсинг статей**: Завантажує UK та RU версії кожної статті
2. **Завантаження зображень**: Завантажує всі зображення локально в `media/news/images/`
3. **Очищення HTML**: Видаляє WordPress класи та inline styles
4. **Оновлення URL**: Замінює зовнішні URL зображень на локальні
5. **Валідація**: Перевіряє конфлікти slug з city/program slugs
6. **Збереження**: Створює NewsArticle об'єкти в базі даних

## Після імпорту

1. Перевірте статті в адмін-панелі: `/admin/core/newsarticle/`
2. Перевірте що всі зображення завантажені: `media/news/images/`
3. Перевірте що URL працюють: `/news/{slug}/`
4. Перевірте sitemap: `/sitemap.xml`

## Troubleshooting

### Помилка "ModuleNotFoundError: No module named 'bs4'"
```bash
pip install beautifulsoup4
```

### Помилка "ModuleNotFoundError: No module named 'requests'"
```bash
pip install requests
```

### Зображення не завантажуються
- Перевірте що `MEDIA_ROOT` та `MEDIA_URL` налаштовані в settings
- Перевірте права доступу до директорії `media/`
- Перевірте що зображення доступні на старому сайті

### Конфлікти slug
- Скрипт попереджає про конфлікти
- Можна пропустити статтю або змінити slug вручну після імпорту





