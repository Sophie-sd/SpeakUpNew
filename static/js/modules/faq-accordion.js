'use strict';

import { BaseAccordion } from './base-accordion.js';

/**
 * FAQ Accordion - акордеон часті питання
 * Використовує base-accordion
 */
function initFAQAccordion() {
  const container = document.querySelector('.faq-accordion[data-accordion-container]');
  if (!container) return;

  new BaseAccordion(container, {
    closeOthers: true, // Закривати інші при відкритті одного
    animationDuration: 300
  });
}

document.addEventListener('DOMContentLoaded', initFAQAccordion);

export default { initFAQAccordion };



