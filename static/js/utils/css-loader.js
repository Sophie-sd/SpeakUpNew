'use strict';

/**
 * CSS Loader Utility
 * Завантажує CSS файли асинхронно через rel="preload" pattern
 * Замінює inline onload handlers для відповідності правилам проекту
 */
export function initCssLoader() {
  // Знаходимо всі link теги з data-css-preload атрибутом
  const cssLinks = document.querySelectorAll('link[rel="preload"][as="style"][data-css-preload]');

  if (cssLinks.length === 0) {
    return;
  }

  /**
   * Обробник завантаження CSS файлу
   * @param {HTMLLinkElement} link - Link елемент
   */
  function loadCss(link) {
    try {
      // Перетворюємо preload в stylesheet
      link.onload = null; // Видаляємо обробник (якщо був)
      link.rel = 'stylesheet';
    } catch (error) {
      console.warn('[CSS Loader] Помилка при завантаженні CSS:', link.href, error);
    }
  }

  // Обробляємо кожен link
  cssLinks.forEach(link => {
    // Якщо ресурс вже завантажений, одразу перетворюємо
    if (link.sheet || link.href && document.querySelector(`link[rel="stylesheet"][href="${link.href}"]`)) {
      loadCss(link);
      return;
    }

    // Додаємо обробник події load
    link.addEventListener('load', () => {
      loadCss(link);
    });

    // Fallback: якщо onload не спрацював через 3 секунди, примусово завантажуємо
    setTimeout(() => {
      if (link.rel === 'preload') {
        loadCss(link);
      }
    }, 3000);
  });
}

// Автоматична ініціалізація, якщо DOM вже готовий
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCssLoader);
} else {
  // DOM вже готовий, виконуємо одразу
  initCssLoader();
}

