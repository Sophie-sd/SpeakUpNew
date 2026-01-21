/**
 * Individual Lessons Toggle
 * Управління перемикачами День/Вечір та табсами Загальна/Спеціалізована
 */

(function() {
  'use strict';

  // =============================================
  // ІНІЦІАЛІЗАЦІЯ
  // =============================================

  function init() {
    const section = document.querySelector('.individual-section');
    if (!section) {
      return;
    }

    // Приховуємо контент на початку
    hideAllContent();

    initTimeToggle();
    initCategoryTabs();
    initURLHash();
  }

  // =============================================
  // РІВЕНЬ 1: ПЕРЕМИКАЧ ДЕНЬ/ВЕЧІР
  // =============================================

  function hideAllContent() {
    document.querySelectorAll('.individual-content').forEach(content => {
      content.classList.add('individual-content--hidden');
      content.classList.remove('individual-content--active');
    });
  }

  function initTimeToggle() {
    const toggleButtons = document.querySelectorAll('.individual-time-toggle__button');
    if (!toggleButtons.length) {
      return;
    }

    toggleButtons.forEach(button => {
      button.addEventListener('click', handleTimeToggle);

      // Keyboard accessibility
      button.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleTimeToggle(e);
        }
      });
    });
  }

  function handleTimeToggle(e) {
    const button = e.currentTarget;
    const timeMode = button.dataset.time; // 'day' або 'evening'

    // Оновлення кнопок
    document.querySelectorAll('.individual-time-toggle__button').forEach(btn => {
      const isActive = btn === button;
      btn.classList.toggle('individual-time-toggle__button--active', isActive);
      btn.setAttribute('aria-pressed', isActive);
    });

    // Показ/приховування контенту
    document.querySelectorAll('.individual-content').forEach(content => {
      const contentTime = content.dataset.timeContent;
      if (contentTime === timeMode) {
        content.classList.remove('individual-content--hidden');
        content.classList.add('individual-content--active');
      } else {
        content.classList.add('individual-content--hidden');
        content.classList.remove('individual-content--active');
      }
    });

    // Оновлення URL hash
    updateURLHash('time', timeMode);
  }

  // =============================================
  // РІВЕНЬ 2: ТАБСИ КАТЕГОРІЙ
  // =============================================

  function initCategoryTabs() {
    const tabs = document.querySelectorAll('.individual-tabs__tab');
    if (!tabs.length) {
      return;
    }

    tabs.forEach(tab => {
      tab.addEventListener('click', handleTabClick);

      // Keyboard navigation
      tab.addEventListener('keydown', handleTabKeydown);
    });
  }

  function handleTabClick(e) {
    const tab = e.currentTarget;
    const category = tab.dataset.category; // 'general' або 'specialized'

    switchTab(tab, category);
    updateURLHash('category', category);
  }

  function handleTabKeydown(e) {
    const tab = e.currentTarget;
    const tabs = Array.from(document.querySelectorAll('.individual-tabs__tab'));
    const currentIndex = tabs.indexOf(tab);

    let nextIndex = currentIndex;

    // Arrow key navigation
    switch(e.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = tabs.length - 1;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleTabClick(e);
        return;
      default:
        return;
    }

    // Фокус на наступний таб
    tabs[nextIndex].focus();
  }

  function switchTab(activeTab, category) {
    const tabsContainer = activeTab.closest('.individual-tabs');
    if (!tabsContainer) {
      return;
    }

    // Оновлення табсів
    tabsContainer.querySelectorAll('.individual-tabs__tab').forEach(tab => {
      const isActive = tab === activeTab;
      tab.classList.toggle('individual-tabs__tab--active', isActive);
      tab.setAttribute('aria-selected', isActive);
      tab.setAttribute('tabindex', isActive ? '0' : '-1');
    });

    // Показ/приховування панелей
    const dayContent = document.querySelector('[data-time-content="day"]');
    if (!dayContent) {
      return;
    }

    dayContent.querySelectorAll('.individual-tabpanel').forEach(panel => {
      const panelCategory = panel.dataset.categoryPanel;
      if (panelCategory === category) {
        panel.classList.remove('individual-tabpanel--hidden');
      } else {
        panel.classList.add('individual-tabpanel--hidden');
      }
    });
  }

  // =============================================
  // URL HASH MANAGEMENT (опціонально)
  // =============================================

  function updateURLHash(param, value) {
    // Отримуємо поточний hash
    const hash = window.location.hash.substring(1); // без '#'
    const params = new URLSearchParams(hash);

    params.set(param, value);

    // Оновлюємо URL без перезавантаження
    const newHash = params.toString();
    if (newHash) {
      history.replaceState(null, '', '#' + newHash);
    }
  }

  function initURLHash() {
    // Перевірка hash при завантаженні
    const hash = window.location.hash.substring(1);
    if (!hash) {
      return;
    }

    const params = new URLSearchParams(hash);
    const timeMode = params.get('time');
    const category = params.get('category');

    // Застосування збережених налаштувань
    if (timeMode) {
      const timeButton = document.querySelector(`.individual-time-toggle__button[data-time="${timeMode}"]`);
      if (timeButton && !timeButton.classList.contains('individual-time-toggle__button--active')) {
        timeButton.click();
      }
    }

    if (category) {
      setTimeout(() => {
        const categoryTab = document.querySelector(`.individual-tabs__tab[data-category="${category}"]`);
        if (categoryTab && !categoryTab.classList.contains('individual-tabs__tab--active')) {
          categoryTab.click();
        }
      }, 100);
    }
  }

  // =============================================
  // ПЛАВНИЙ СКРОЛ ДО СЕКЦІЇ
  // =============================================

  function initSmoothScroll() {
    // Якщо користувач натискає на кнопку навігації в hero блоці
    const navButtons = document.querySelectorAll('a[href="#individual-section"]');
    navButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const section = document.querySelector('#individual-section');
        if (section) {
          const headerHeight = document.querySelector('header')?.offsetHeight || 80;
          const sectionTop = section.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;

          window.scrollTo({
            top: sectionTop,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  // =============================================
  // ЗАПУСК ПРИ ЗАВАНТАЖЕННІ
  // =============================================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      init();
      initSmoothScroll();
    });
  } else {
    init();
    initSmoothScroll();
  }

})();
