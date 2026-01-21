/**
 * Level Cards Navigation Module
 * Управління горизонтальним скролом карток рівнів за допомогою стрілочок та клавіатури
 */

(function() {
  'use strict';

  /**
   * Ініціалізація модуля
   */
  function initLevelCardsNavigation() {
    const containers = document.querySelectorAll('.level-cards-container');
    
    if (!containers.length) {
      return;
    }

    containers.forEach((container) => {
      const wrapper = container.parentElement;
      const prevBtn = wrapper.querySelector('.level-cards-nav--prev');
      const nextBtn = wrapper.querySelector('.level-cards-nav--next');

      if (!prevBtn || !nextBtn) {
        return;
      }

      // Обробка кліків на стрілочки
      prevBtn.addEventListener('click', () => scrollCards(container, 'prev'));
      nextBtn.addEventListener('click', () => scrollCards(container, 'next'));

      // Оновлення стану стрілочок при скролі
      container.addEventListener('scroll', () => updateButtonStates(container, prevBtn, nextBtn));

      // Клавіатурна навігація
      prevBtn.addEventListener('keydown', (e) => handleKeyDown(e, container, 'prev'));
      nextBtn.addEventListener('keydown', (e) => handleKeyDown(e, container, 'next'));

      // Початковий стан
      updateButtonStates(container, prevBtn, nextBtn);
    });
  }

  /**
   * Прокручування до попередньої або наступної картки
   * @param {HTMLElement} container - Контейнер з картками
   * @param {string} direction - 'prev' або 'next'
   */
  function scrollCards(container, direction) {
    const card = container.querySelector('.level-card');
    if (!card) return;

    const cardWidth = card.offsetWidth;
    const gap = parseFloat(window.getComputedStyle(container).gap) || 0;
    const scrollAmount = cardWidth + gap;
    const currentScroll = container.scrollLeft;
    let newScroll;

    if (direction === 'prev') {
      newScroll = Math.max(0, currentScroll - scrollAmount);
    } else {
      newScroll = currentScroll + scrollAmount;
    }

    container.scrollTo({
      left: newScroll,
      behavior: 'smooth',
    });
  }

  /**
   * Оновлення стану стрілочок (enable/disable)
   * @param {HTMLElement} container - Контейнер з картками
   * @param {HTMLElement} prevBtn - Кнопка "Назад"
   * @param {HTMLElement} nextBtn - Кнопка "Далі"
   */
  function updateButtonStates(container, prevBtn, nextBtn) {
    const scrollLeft = container.scrollLeft;
    const maxScroll = container.scrollWidth - container.clientWidth;

    // Disable кнопка назад якщо на початку
    prevBtn.disabled = scrollLeft <= 0;

    // Disable кнопка далі якщо на кінці (з невеликим допуском)
    nextBtn.disabled = scrollLeft >= maxScroll - 1;
  }

  /**
   * Обробка клавіатурної навігації
   * @param {KeyboardEvent} e - Подія клавіатури
   * @param {HTMLElement} container - Контейнер з картками
   * @param {string} direction - 'prev' або 'next'
   */
  function handleKeyDown(e, container, direction) {
    // Enter та Space для активації кнопки
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scrollCards(container, direction);
    }

    // Arrow keys для навігації між стрілочками
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const wrapper = container.parentElement;
      const prevBtn = wrapper.querySelector('.level-cards-nav--prev');
      const nextBtn = wrapper.querySelector('.level-cards-nav--next');

      if (e.key === 'ArrowLeft' && !prevBtn.disabled) {
        prevBtn.focus();
      } else if (e.key === 'ArrowRight' && !nextBtn.disabled) {
        nextBtn.focus();
      }
    }
  }

  /**
   * Запуск при завантаженні DOM
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLevelCardsNavigation);
  } else {
    initLevelCardsNavigation();
  }

  // Перініціалізація при динамічному завантаженню
  window.addEventListener('htmx:load', initLevelCardsNavigation);
})();
