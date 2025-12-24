'use strict';

import { observe } from './global-observer.js';

/**
 * Counter Animation - анімація лічильників для досягнень
 * Використовує global-observer для оптимізації
 */
function animateCounter(element, target, suffix = '', duration = 2000) {
  const start = 0;
  const startTime = performance.now();
  let animationFrameId;

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing: easeOutQuart
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    const current = Math.floor(start + (target - start) * easeOutQuart);

    element.textContent = current + suffix;

    if (progress < 1) {
      animationFrameId = requestAnimationFrame(update);
    } else {
      element.textContent = target + suffix;
    }
  }

  animationFrameId = requestAnimationFrame(update);

  return () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  };
}

function initAchievements() {
  const achievementCards = document.querySelectorAll('.achievement-card');

  achievementCards.forEach(card => {
    const numberElement = card.querySelector('.achievement-card__number');
    if (!numberElement) return;

    const targetNumber = parseInt(card.dataset.achievementNumber, 10);
    const suffix = card.dataset.achievementSuffix || '';

    // Спостереження через global-observer
    observe(card, (entry) => {
      if (entry.isIntersecting && !card.dataset.animated) {
        card.dataset.animated = 'true';
        animateCounter(numberElement, targetNumber, suffix);
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', initAchievements);

export default { initAchievements };

