# Додавання переваг SpeakUp

## Що було зроблено

### 1. Оновлено структуру шаблону (`templates/core/index.html`)
- ✅ Видалено застарілі поля `front_text` та `back_text`
- ✅ Додано нову структуру HEADER-BODY-FOOTER
- ✅ Додано цикл для виведення пунктів (`advantage.items.all`)
- ✅ Підтримка UK/RU для всіх полів

### 2. Оновлено стилі (`static/css/components/advantages-carousel.css`)
- ✅ Видалено flip-анімацію (не потрібна для нової структури)
- ✅ Збільшено `min-height` до 500px (для HEADER + 6 пунктів + FOOTER)
- ✅ Додано стилі для нових елементів:
  - `.advantage-card__header`, `.advantage-card__subtitle`, `.advantage-card__tag`
  - `.advantage-card__items`, `.advantage-item`, `.advantage-item__icon`
  - `.advantage-card__footer`, `.advantage-card__footer-title`
- ✅ iOS-сумісність: `-webkit-overflow-scrolling: touch`
- ✅ Scroll-snap працює на мобільних

### 3. Оновлено JavaScript (`static/js/modules/advantages-carousel.js`)
- ✅ Видалено flip-логіку (click/touch handlers)
- ✅ Залишено тільки базову каруселі з прокруткою

### 4. Створено скрипт для додавання переваг (`add_advantages_full.py`)
- ✅ Всі 5 переваг з повними UK та RU версіями
- ✅ Всі 30 пунктів (6 на кожну перевагу)
- ✅ Готово до виконання в Django shell

## Як використовувати

### Варіант 1: Виконати через Django shell

```bash
cd /Users/olegbonislavskyi/Sites/SpeakUp
python3 manage.py shell
```

Потім в shell:

```python
exec(open('add_advantages_full.py').read())
```

### Варіант 2: Скопіювати код вручну

Відкрийте `add_advantages_full.py`, скопіюйте весь код та вставте в Django shell.

## Додати зображення

Після виконання скрипта додайте зображення у папку `media/advantages/`:

1. **flexibility-icon.png** (синя тема) - для "Максимальна Гнучкість"
2. **guarantee-icon.png** (зелена тема) - для "Гарантія Результату"
3. **platform-icon.png** (фіолетова тема) - для "Сучасна Платформа"
4. **practice-icon.png** (помаранчева тема) - для "Максимум Практики"
5. **team-icon.png** (бірюзова тема) - для "Команда Професіоналів"

### Рекомендації для зображень:
- Формат: PNG з прозорим фоном
- Розмір: 200x200px або 400x400px
- Стиль: плоскі іконки або мінімалістичні ілюстрації

## Перевірка

1. Запустіть сервер: `python3 manage.py runserver`
2. Відкрийте головну сторінку: `http://localhost:8000/`
3. Перевірте блок "Наші переваги":
   - 5 карток з повним контентом
   - HEADER (заголовок + підзаголовок + тег)
   - BODY (6 пунктів з іконками емодзі)
   - FOOTER (виділений блок з "фішкою")
4. Перевірте мобільну версію (scroll працює)
5. Перевірте обидві мови (UK/RU)

## Гарантії

✅ **Немає дублів** - скрипт видаляє всі старі переваги перед додаванням нових
✅ **Немає конфліктів** - використовуються тільки нові поля моделі
✅ **iOS scroll працює** - `scroll-snap-type: x mandatory` + `-webkit-overflow-scrolling: touch`
✅ **Мобільна адаптація** - окремі стилі для `width <= 767px`
✅ **Кросбраузерність** - використано `-webkit-` префікси
✅ **Багатомовність** - всі поля мають UK та RU версії

## Troubleshooting

### Якщо переваги не відображаються:
1. Перевірте, що міграції застосовані: `python3 manage.py migrate`
2. Перевірте, що переваги створені: `Advantage.objects.count()` має повернути 5
3. Перевірте, що переваги активні: `is_active=True`

### Якщо зображення не відображаються:
1. Перевірте, що файли є у `media/advantages/`
2. Перевірте налаштування `MEDIA_URL` та `MEDIA_ROOT` в `settings.py`
3. Під час розробки використовуйте `python3 manage.py runserver`, який автоматично віддає media файли

### Якщо scroll не працює на iOS:
1. Перевірте, що CSS завантажений (F12 → Network)
2. Перевірте, що `-webkit-overflow-scrolling: touch` присутній
3. Спробуйте на реальному пристрої (Safari Desktop != Safari iOS)


