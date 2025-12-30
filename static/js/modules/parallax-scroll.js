'use strict';

/**
 * Static Background - Статичний фон для головної сторінки
 * Фон та Speaky зафіксовані, контент скролиться поверх них
 */

/**
 * Ініціалізація статичного фону
 */
function initStaticBackground() {
  const container = document.querySelector('.parallax-container');
  if (!container) return;

  // Фон завжди відображається (на desktop та mobile)
  // Мобільна версія зображення встановлюється через CSS media query
}

// Ініціалізація після завантаження DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initStaticBackground);
} else {
  initStaticBackground();
}

export { initStaticBackground };

