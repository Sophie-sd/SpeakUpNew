'use strict';

import { BurgerMenu } from './modules/burger-menu.js';
import { initRunningLine } from './modules/running-line.js';
import { initTrialForm } from './modules/trial-form.js';
import { initHeaderDynamicForm } from './modules/header-dynamic-form.js';
import { initTabSlider } from './shared/tab-slider.js';
import programsListModule from './modules/programs-list.js';
import { BaseAccordion } from './modules/base-accordion.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('[SpeakUp] Initializing modules...');

  new BurgerMenu();
  initRunningLine();
  initTrialForm();
  initHeaderDynamicForm();

  // Слайдер для нижнього меню навігації
  // Використовуємо селектор, який знаходить тільки нижнє меню (всередині .mobile-nav-container)
  initTabSlider('.mobile-nav-container .header__nav', {
    sliderAttr: 'data-nav-slider',
    tabAttr: 'data-nav-tab',
    activeClass: 'header__link--active',
    containerPadding: 0,
    widthReduction: 5,  // Візуальний відступ для всіх кнопок
    rightOffset: 10     // Додатковий відступ для останньої кнопки
  });

  // Програми - таб-навігація та акордеони (тільки на сторінці programs)
  if (document.querySelector('.programs-list-page')) {
    programsListModule.initProgramsList();
  }

  // Корпоративна сторінка - акордеони
  if (document.querySelector('.corporate-program-page')) {
    // Ініціалізація акордеонів для корпоративної сторінки через BaseAccordion
    const corporateGrids = document.querySelectorAll('.corporate-program-page .programs-grid');
    corporateGrids.forEach(grid => {
      new BaseAccordion(grid, {
        closeOthers: false,
        animationDuration: 300
      });
    });
  }

  // FAQ сторінка - ініціалізація акордеонів
  if (document.querySelector('.faq-page')) {
    console.log('[SpeakUp] Initializing FAQ accordion...');
    const accordionContainers = document.querySelectorAll('.faq-accordion[data-accordion-container]');

    if (accordionContainers.length > 0) {
      console.log(`[SpeakUp] Found ${accordionContainers.length} FAQ accordion container(s)`);
      accordionContainers.forEach(container => {
        new BaseAccordion(container, {
          closeOthers: true,
          animationDuration: 300
        });
      });
    } else {
      console.warn('[SpeakUp] No FAQ accordion containers found');
    }
  }
});

