'use strict';

import { BaseAccordion } from './base-accordion.js';

/**
 * FAQ Accordion - акордеон часті питання
 * Використовує base-accordion
 * Підтримує кілька контейнерів (3 стовпчики)
 */
function initFAQAccordion() {
  // Ініціалізація акордеонів на сторінці FAQ
  const accordionContainers = document.querySelectorAll('.faq-accordion[data-accordion-container]');

  accordionContainers.forEach(container => {
    new BaseAccordion(container, {
      closeOthers: true, // Закривати інші при відкритті одного
      animationDuration: 300
    });
  });
}

document.addEventListener('DOMContentLoaded', initFAQAccordion);

export default { initFAQAccordion };



