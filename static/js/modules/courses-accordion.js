'use strict';

import { BaseAccordion } from './base-accordion.js';

/**
 * Courses Accordion - акордеони навчальних програм
 * Використовує base-accordion
 */
function initCoursesAccordion() {
  const accordionContainers = document.querySelectorAll('.course-accordion[data-accordion-container]');

  accordionContainers.forEach(container => {
    new BaseAccordion(container, {
      closeOthers: false, // Дозволяємо відкривати кілька курсів одночасно
      animationDuration: 300
    });
  });
}

document.addEventListener('DOMContentLoaded', initCoursesAccordion);

export default { initCoursesAccordion };




