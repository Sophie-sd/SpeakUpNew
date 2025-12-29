'use strict';

import { BaseAccordion } from './base-accordion.js';

/**
 * Programs List - таб-навігація та акордеони для сторінки всіх програм
 */
function initProgramsList() {
  // Ініціалізація таб-навігації
  const tabsContainer = document.querySelector('[data-tabs-container]');
  if (tabsContainer) {
    const tabs = tabsContainer.querySelectorAll('[data-tabs-trigger]');
    const categories = document.querySelectorAll('[data-tab-content]');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;

        // Видалити активний клас з усіх табів
        tabs.forEach(t => t.classList.remove('programs-tab--active'));
        // Додати активний клас до поточного табу
        tab.classList.add('programs-tab--active');

        // Приховати всі категорії
        categories.forEach(cat => {
          cat.classList.remove('programs-category--active');
        });

        // Показати вибрану категорію
        const targetCategory = document.querySelector(`[data-tab-content="${targetTab}"]`);
        if (targetCategory) {
          targetCategory.classList.add('programs-category--active');
        }
      });
    });
  }

  // Ініціалізація акордеонів для карток програм
  const programCards = document.querySelectorAll('.programs-grid .program-card');
  programCards.forEach(card => {
    const header = card.querySelector('.program-card__header');
    const content = card.querySelector('.program-card__content');

    if (header && content) {
      header.addEventListener('click', () => {
        const isOpen = card.classList.contains('accordion-item--open');

        if (isOpen) {
          card.classList.remove('accordion-item--open');
          content.style.maxHeight = '0';
          header.setAttribute('aria-expanded', 'false');
          content.setAttribute('aria-hidden', 'true');
        } else {
          card.classList.add('accordion-item--open');
          content.style.maxHeight = content.scrollHeight + 'px';
          header.setAttribute('aria-expanded', 'true');
          content.setAttribute('aria-hidden', 'false');
        }
      });

      // ARIA attributes
      header.setAttribute('role', 'button');
      header.setAttribute('aria-expanded', 'false');
      header.setAttribute('aria-controls', `program-content-${card.dataset.accordionItem || ''}`);
      content.setAttribute('aria-hidden', 'true');
      content.setAttribute('id', `program-content-${card.dataset.accordionItem || ''}`);
    }
  });

  // Інтеграція з формою консультації
  const consultationButtons = document.querySelectorAll('.programs-list-page [data-consultation-btn]');
  consultationButtons.forEach(btn => {
    btn.addEventListener('click', handleConsultationClick);
  });
}

function handleConsultationClick(e) {
  const programCard = e.target.closest('.program-card');
  const programTitle = programCard?.querySelector('.program-card__title')?.textContent?.trim() || 'Unknown';

  // Скролл до форми консультації
  const consultationSection = document.querySelector('#consultation');
  if (consultationSection) {
    consultationSection.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Зберегти вибрану програму для передачі в форму
    sessionStorage.setItem('selectedPricing', programTitle);
  }
}

// Ініціалізація відбувається через app-init.js
export default { initProgramsList };

