'use strict';

import { BaseCarousel } from './base-carousel.js';

/**
 * Advantages Carousel - карусель переваг з flip картками
 * Використовує base-carousel + flip функціонал
 */
function initAdvantagesCarousel() {
  const container = document.querySelector('.advantages-carousel__container');
  if (!container) return;

  // Ініціалізація базової каруселі
  new BaseCarousel(container, {
    itemsPerView: window.innerWidth <= 767 ? 1 : 4,
    gap: 16,
    lazyLoad: true,
    keyboardNav: true
  });

  // Flip функціонал для карток
  const cards = container.querySelectorAll('.advantage-card');

  cards.forEach(card => {
    card.addEventListener('click', function() {
      // Додаємо клас для анімації
      this.classList.add('glass-card--animating');
      this.classList.toggle('flipped');

      // Видаляємо клас після завершення анімації
      setTimeout(() => {
        this.classList.remove('glass-card--animating');
      }, 600);
    });

    // Touch-friendly: мінімальна відстань для flip
    let touchStartX = 0;
    let touchStartY = 0;

    card.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    card.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const diffX = Math.abs(touchEndX - touchStartX);
      const diffY = Math.abs(touchEndY - touchStartY);

      // Якщо рух переважно вертикальний - flip, якщо горизонтальний - scroll
      if (diffY > diffX && diffY > 30) {
        e.preventDefault();
        card.classList.add('glass-card--animating');
        card.classList.toggle('flipped');
        setTimeout(() => {
          card.classList.remove('glass-card--animating');
        }, 600);
      }
    }, { passive: false });
  });
}

document.addEventListener('DOMContentLoaded', initAdvantagesCarousel);

export default { initAdvantagesCarousel };

