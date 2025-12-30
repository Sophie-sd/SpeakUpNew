# Архітектура меню та адаптацій

## Структура файлів

### HTML шаблони
- `templates/components/header.html` - хедер з логотипом та формою
- `templates/components/navigation.html` - навігація та бургер-меню

### CSS стилі
- `static/css/components/header.css` - всі стилі для хедера, навігації та адаптацій

### JavaScript модулі
- `static/js/modules/burger-menu.js` - логіка бургер-меню
- `static/js/app-init.js` - ініціалізація модулів

---

## Десктопне меню (≥768px)

### Структура
```html
<header class="header">
  <div class="header__logo">SpeakUp</div>
  <form class="trial-form trial-form--desktop">...</form>
</header>

<nav class="header__nav">
  <ul class="header__menu">
    <li><a href="...">Головна</a></li>
    <li class="header__menu-item--mobile-hidden">...</li>
  </ul>
</nav>
```

### Особливості
- **Хедер**: горизонтальний flex з логотипом та формою
- **Навігація**: горизонтальне меню знизу екрану (Telegram-style)
- **Форма**: видима в хедері, горизонтальна
- **Бургер-меню**: приховано (`display: none`)

### CSS класи
- `.header` - основний контейнер хедера
- `.trial-form--desktop` - форма для десктопу
- `.header__nav` - навігація знизу
- `.header__menu` - список пунктів меню
- `.header__link` - посилання в меню

---

## Мобільне меню (≤767px)

### Структура
```html
<div class="mobile-nav-container">
  <nav class="header__nav">...</nav>
  <button class="burger-menu" data-burger-toggle>...</button>
</div>

<div class="burger-menu__overlay" data-burger-overlay></div>
<nav class="burger-menu__dropdown" data-burger-menu>...</nav>
```

### Особливості
- **Хедер**: вертикальний flex, форма прихована
- **Навігація**: grid з меню та бургер-кнопкою
- **Бургер-меню**: видиме, кругле, знизу справа
- **Dropdown**: випадаюче меню з додатковими пунктами
- **Overlay**: затемнений фон при відкритому меню

### Приховані пункти
Пункти з класом `.header__menu-item--mobile-hidden` приховані в основному меню та показуються в бургер-меню:
- Корпоративним клієнтам
- Блог
- FAQ

### CSS класи
- `.mobile-nav-container` - контейнер для мобільної навігації
- `.burger-menu` - кнопка бургер-меню
- `.burger-menu__dropdown` - випадаюче меню
- `.burger-menu__overlay` - затемнений фон
- `.burger-menu__overlay--active` - активний стан overlay
- `.burger-menu__dropdown--active` - активний стан dropdown

---

## Адаптації (Media Queries)

### Breakpoint: `width <= 767px`

**Хедер:**
```css
.header {
  flex-direction: column; /* Вертикальна орієнтація */
}
```

**Форма:**
```css
.trial-form--desktop {
  display: none; /* Прихована */
}

.trial-form__trigger--mobile {
  display: flex; /* Показується кнопка */
}
```

**Навігація:**
```css
.mobile-nav-container {
  display: grid;
  grid-template-columns: 1fr auto; /* Меню + бургер */
}
```

**Бургер-меню:**
```css
.burger-menu {
  display: flex; /* Показується */
}
```

---

## JavaScript логіка

### BurgerMenu клас (`burger-menu.js`)

**Ініціалізація:**
- Знаходить елементи за data-атрибутами
- Додає обробники подій
- Керує станом відкриття/закриття

**Методи:**
- `toggle()` - перемикає стан меню
- `open()` - відкриває меню
  - Блокує скрол body
  - Зберігає позицію скролу (для iOS Safari)
  - Додає активні класи
- `close()` - закриває меню
  - Відновлює скрол body
  - Прибирає активні класи

**Події:**
- Клік на кнопку бургер-меню
- Клік на overlay
- Клік на посилання в меню
- Натискання Escape

**iOS Safari оптимізація:**
- Подвійний `requestAnimationFrame` для коректної роботи
- Збереження позиції скролу перед блокуванням

---

## Data-атрибути

- `data-burger-toggle` - кнопка відкриття/закриття
- `data-burger-overlay` - затемнений фон
- `data-burger-menu` - випадаюче меню

---

## Z-index шарів

```css
--z-menu-overlay: 999;    /* Overlay */
--z-menu: 1000;          /* Dropdown меню */
--z-menu-button: 1001;   /* Кнопка бургер */
```

---

## Accessibility (A11y)

- `aria-expanded` - стан відкриття меню
- `aria-hidden` - прихованість елементів
- `aria-label` - опис кнопки
- Клавіатурна навігація (Escape для закриття)

---

## Стилізація

### Glassmorphism
- Хедер: білий з прозорістю
- Навігація: темний з прозорістю
- Backdrop-filter для розмиття

### Анімації
- Плавне відкриття/закриття dropdown
- Анімація іконки бургер-меню (перетворення на X)
- Hover ефекти для посилань

### Безпечні зони (Safe Area)
- Використання `var(--safe-area-bottom)` для iOS
- Коректне позиціювання на пристроях з вирізом





