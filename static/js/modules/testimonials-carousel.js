'use strict';

import { BaseCarousel } from './base-carousel.js';

/**
 * Testimonials Carousel - карусель відгуків
 * Використовує base-carousel з кнопками навігації
 */
function initTestimonialsCarousel() {
  const container = document.querySelector('.testimonials-carousel');
  if (!container) return;

  const isMobile = window.innerWidth <= 767;
  const prevButton = document.querySelector('.testimonials-carousel-nav--prev');
  const nextButton = document.querySelector('.testimonials-carousel-nav--next');
  const navWrapper = document.querySelector('.testimonials-carousel-nav-wrapper');

  const carousel = new BaseCarousel(container, {
    itemsPerView: isMobile ? 1 : 3,
    gap: isMobile ? 16 : 32,
    prevButton: prevButton,
    nextButton: nextButton,
    lazyLoad: true,
    keyboardNav: true
  });

  // Оновлюємо кнопки при зміні розміру вікна
  let resizeTimeout;
  const handleResize = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const newIsMobile = window.innerWidth <= 767;
      carousel.options.itemsPerView = newIsMobile ? 1 : 3;
      carousel.options.gap = newIsMobile ? 16 : 32;

      // Оновлюємо кнопки
      if (navWrapper) {
        if (newIsMobile) {
          navWrapper.style.display = 'none';
        } else {
          navWrapper.style.display = 'flex';
        }
      }

      // Оновлюємо стан кнопок після зміни розміру
      carousel.updateButtons();
    }, 150);
  };

  window.addEventListener('resize', handleResize);

  // Ініціалізуємо стан кнопок
  if (carousel.updateButtons) {
    carousel.updateButtons();
  }
}

document.addEventListener('DOMContentLoaded', initTestimonialsCarousel);

export default { initTestimonialsCarousel };



