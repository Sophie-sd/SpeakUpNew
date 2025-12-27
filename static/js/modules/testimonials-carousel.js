'use strict';

import { BaseCarousel } from './base-carousel.js';

/**
 * Testimonials Carousel - карусель відгуків
 * Використовує base-carousel
 */
function initTestimonialsCarousel() {
  const container = document.querySelector('.testimonials-carousel');
  if (!container) return;

  new BaseCarousel(container, {
    itemsPerView: window.innerWidth <= 767 ? 1 : 3,
    gap: 16,
    lazyLoad: true,
    keyboardNav: true
  });
}

document.addEventListener('DOMContentLoaded', initTestimonialsCarousel);

export default { initTestimonialsCarousel };


