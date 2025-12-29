'use strict';

/**
 * Tab Slider - анімований слайдер для навігаційного меню
 * Рухається за курсором при hover, залишається на активній кнопці
 */
export function initTabSlider(containerSelector, options = {}) {
  const container = document.querySelector(containerSelector);
  if (!container) {
    console.warn(`[TabSlider] Контейнер не знайдено: ${containerSelector}`);
    return;
  }

  const config = {
    sliderAttr: options.sliderAttr || 'data-nav-slider',
    tabAttr: options.tabAttr || 'data-nav-tab',
    activeClass: options.activeClass || 'active',
    containerPadding: options.containerPadding || 0,
    widthReduction: options.widthReduction || 0,
    rightOffset: options.rightOffset || 0,
    ...options
  };

  const slider = container.querySelector(`[${config.sliderAttr}]`);
  if (!slider) {
    console.warn(`[TabSlider] Слайдер не знайдено: [${config.sliderAttr}]`);
    return;
  }

  const tabs = Array.from(container.querySelectorAll(`[${config.tabAttr}]`));
  if (tabs.length === 0) {
    console.warn(`[TabSlider] Кнопки не знайдено: [${config.tabAttr}]`);
    return;
  }

  let isHovering = false;
  let hoveredTab = null;
  let resetTimeout = null;

  /**
   * Отримує тільки видимі кнопки (фільтрує приховані через CSS)
   * @returns {HTMLElement[]} Масив видимих кнопок
   */
  function getVisibleTabs() {
    return tabs.filter(tab => {
      // Перевіряємо видимість через offsetParent (найшвидший спосіб)
      // offsetParent === null означає, що елемент прихований (display: none)
      return tab.offsetParent !== null;
    });
  }

  /**
   * Знаходить активну кнопку в меню
   * @returns {HTMLElement|null} Активна кнопка або null
   */
  function findActiveTab() {
    return tabs.find(tab => tab.classList.contains(config.activeClass)) || null;
  }

  /**
   * Оновлює позицію та розмір слайдера
   * @param {HTMLElement} targetTab - Кнопка, під яку переміщується слайдер
   * @param {boolean} instant - Якщо true, вимикає анімацію для миттєвого переміщення
   */
  function updateSliderPosition(targetTab, instant = false) {
    if (!targetTab) return;

    // Перевірка видимості кнопки перед обчисленням позиції
    // Якщо кнопка прихована, не обчислюємо позицію для неї
    if (targetTab.offsetParent === null) {
      return;
    }

    // Вимкнути анімацію якщо потрібно миттєве переміщення
    if (instant) {
      slider.style.transition = 'none';
    }

    const containerRect = container.getBoundingClientRect();
    const tabRect = targetTab.getBoundingClientRect();

    // Розраховуємо позицію відносно контейнера
    // Слайдер має left: var(--menu-spacing-sm) в CSS (padding контейнера)
    // Тому translateX має бути позиція кнопки мінус padding
    const containerPadding = parseFloat(getComputedStyle(container).paddingLeft) || 0;
    const left = tabRect.left - containerRect.left - containerPadding;
    const width = tabRect.width;

    // Визначаємо, чи це останній таб серед видимих кнопок
    const visibleTabs = getVisibleTabs();
    const tabIndex = visibleTabs.indexOf(targetTab);
    const isLastTab = tabIndex === visibleTabs.length - 1;

    // Коригуємо ширину
    const adjustedWidth = isLastTab
      ? width - config.widthReduction - config.rightOffset
      : width - config.widthReduction;

    // Встановлюємо позицію через transform
    slider.style.transform = `translateX(${left}px)`;
    slider.style.width = `${adjustedWidth}px`;
    slider.style.opacity = '1';

    // Повернути transition після миттєвого переміщення
    if (instant) {
      // Використовуємо requestAnimationFrame для коректного повернення transition
      requestAnimationFrame(() => {
        slider.style.transition = '';
      });
    }
  }

  /**
   * Повертає слайдер на активну кнопку
   */
  function resetToActive() {
    const activeTab = findActiveTab();
    if (activeTab) {
      updateSliderPosition(activeTab, false);
    } else {
      slider.style.opacity = '0';
    }
  }

  /**
   * Ініціалізація: встановлює початкову позицію на активну кнопку
   */
  function init() {
    const activeTab = findActiveTab();
    if (activeTab) {
      // Миттєве встановлення початкової позиції без анімації
      updateSliderPosition(activeTab, true);
    } else {
      slider.style.opacity = '0';
    }
  }

  /**
   * Перевірка, чи пристрій підтримує hover
   */
  const hasHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /**
   * Обробка hover на кнопках (тільки для пристроїв з підтримкою hover)
   */
  if (hasHover) {
    // Обробник на контейнері для відстеження виходу курсора з меню
    container.addEventListener('mouseleave', () => {
      isHovering = false;
      hoveredTab = null;
      // Затримка перед поверненням на активну кнопку
      if (resetTimeout) {
        clearTimeout(resetTimeout);
      }
      resetTimeout = setTimeout(() => {
        resetToActive();
      }, 150);
    });

    tabs.forEach(tab => {
      tab.addEventListener('mouseenter', () => {
        // Скасувати таймер reset, якщо користувач наводить на іншу кнопку
        if (resetTimeout) {
          clearTimeout(resetTimeout);
          resetTimeout = null;
        }
        isHovering = true;
        hoveredTab = tab;
        updateSliderPosition(tab, false); // З анімацією
      });
    });
  }

  /**
   * Обробка кліку: оновлює активну кнопку
   */
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Видаляємо active з усіх кнопок
      tabs.forEach(t => t.classList.remove(config.activeClass));
      // Додаємо active до клікнутої
      tab.classList.add(config.activeClass);
      updateSliderPosition(tab, false); // З анімацією
    });
  });

  /**
   * Обробка зміни розміру вікна
   */
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (isHovering && hoveredTab) {
        updateSliderPosition(hoveredTab, false);
      } else {
        resetToActive();
      }
    }, 100);
  });

  /**
   * Експортуємо функцію для глобального використання
   */
  if (typeof window !== 'undefined') {
    window.initTabSlider = initTabSlider;
  }

  // Ініціалізація
  init();
}

