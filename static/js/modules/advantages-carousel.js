'use strict';

import { BaseCarousel } from './base-carousel.js';

/**
 * Advantages Carousel - flip картки з snap scroll та навігацією
 */
function initAdvantagesCarousel() {
  const cards = document.querySelectorAll('.advantage-card');
  const container = document.querySelector('.advantages-carousel__container');

  if (!cards.length) return;

  // Встановлення динамічних фонів з data-атрибутів
  cards.forEach(card => {
    const bgElement = card.querySelector('.advantage-card__bg--dynamic');
    if (bgElement) {
      const bgUrl = bgElement.getAttribute('data-bg-image');
      if (bgUrl) {
        bgElement.style.backgroundImage = `url('${bgUrl}')`;
      }
    }
  });

  // Flip функціонал
  cards.forEach(card => {
    const handleFlip = function() {
      // Додати will-change для оптимізації анімації
      card.classList.add('advantage-card--animating');
      card.classList.toggle('flipped');

      // Видалити will-change після завершення анімації (0.6s)
      setTimeout(() => {
        card.classList.remove('advantage-card--animating');
      }, 600);
    };

    card.addEventListener('click', function(e) {
      // Не flip якщо клік по посиланню або кнопці
      if (e.target.closest('a, button')) return;

      handleFlip();
    });

    // Touch-friendly для мобільних
    let touchStartX = 0;
    let touchStartY = 0;
    let isSwiping = false;

    card.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isSwiping = false;
    }, { passive: true });

    card.addEventListener('touchmove', (e) => {
      const touchMoveX = e.touches[0].clientX;
      const touchMoveY = e.touches[0].clientY;
      const diffX = Math.abs(touchMoveX - touchStartX);
      const diffY = Math.abs(touchMoveY - touchStartY);

      // Визначаємо чи це свайп (горизонтальна прокрутка)
      if (diffX > diffY && diffX > 10) {
        isSwiping = true;
      }
    }, { passive: true });

    card.addEventListener('touchend', (e) => {
      // Якщо був свайп - не flip
      if (isSwiping) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const diffX = Math.abs(touchEndX - touchStartX);
      const diffY = Math.abs(touchEndY - touchStartY);

      // Якщо рух мінімальний - це tap, робимо flip
      if (diffX < 10 && diffY < 10) {
        e.preventDefault();
        handleFlip();
      }
    }, { passive: false });
  });

  // Keyboard navigation для accessibility
  cards.forEach((card, index) => {
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Картка переваги ${index + 1}. Натисніть для деталей`);

    const handleFlip = function() {
      // Додати will-change для оптимізації анімації
      card.classList.add('advantage-card--animating');
      card.classList.toggle('flipped');

      // Видалити will-change після завершення анімації (0.6s)
      setTimeout(() => {
        card.classList.remove('advantage-card--animating');
      }, 600);
    };

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleFlip();
      }
    });
  });

  // Ініціалізація BaseCarousel для навігації стрілками
  if (container) {
    const isMobile = window.innerWidth <= 767;
    const prevButton = document.querySelector('.advantages-carousel-nav--prev');
    const nextButton = document.querySelector('.advantages-carousel-nav--next');
    const navWrapper = document.querySelector('.advantages-carousel-nav-wrapper');

    // Додаємо класи для BaseCarousel
    container.classList.add('carousel-container');
    cards.forEach(card => card.classList.add('carousel-item'));

    if (prevButton && nextButton) {
      const carousel = new BaseCarousel(container, {
        itemsPerView: isMobile ? 1 : 2,
        gap: 24,
        prevButton: prevButton,
        nextButton: nextButton,
        lazyLoad: false,
        keyboardNav: true
      });

      // Оновлюємо кнопки при зміні розміру вікна
      let resizeTimeout;
      const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          const newIsMobile = window.innerWidth <= 767;
          carousel.options.itemsPerView = newIsMobile ? 1 : 2;

          // Оновлюємо кнопки
          if (navWrapper) {
            if (newIsMobile) {
              navWrapper.style.display = 'none';
            } else {
              navWrapper.style.display = 'flex';
            }
          }

          // Оновлюємо стан кнопок після зміни розміру
          if (carousel.updateButtons) {
            carousel.updateButtons();
          }
        }, 150);
      };

      window.addEventListener('resize', handleResize);

      // Ініціалізуємо стан кнопок
      if (carousel.updateButtons) {
        carousel.updateButtons();
      }
    }

    // Smooth scroll на desktop при кліку по індикатору (якщо буде додано)
    container.addEventListener('scroll', () => {
      // Можна додати логіку для індикаторів прогресу
    }, { passive: true });
  }
}

// Ініціалізація
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdvantagesCarousel);
} else {
  initAdvantagesCarousel();
}

export default { initAdvantagesCarousel };
