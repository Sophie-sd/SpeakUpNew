'use strict';

import { BaseAccordion } from './base-accordion.js';

/**
 * Pricing Accordion - акордеони прайс-листу
 * Використовує базовий BaseAccordion
 */
function initPricingAccordion() {
  // Ініціалізація акордеонів (тільки всередині .pricing-section)
  const accordionContainers = document.querySelectorAll('.pricing-section .pricing-accordion[data-accordion-container]');

  accordionContainers.forEach(container => {
    new BaseAccordion(container, {
      closeOthers: false, // Дозволяємо відкривати кілька одночасно
      animationDuration: 300
    });
  });

  // Інтеграція з формою консультації
  const consultationButtons = document.querySelectorAll('.pricing-section [data-consultation-btn]');
  consultationButtons.forEach(btn => {
    btn.addEventListener('click', handleConsultationClick);
  });

  // Додати selected_pricing до форми консультації при submit
  const consultationForm = document.querySelector('#consultation form');
  if (consultationForm) {
    consultationForm.addEventListener('submit', function() {
      const selectedPricing = sessionStorage.getItem('selectedPricing');
      if (selectedPricing) {
        // Створити або оновити hidden input
        let hiddenInput = consultationForm.querySelector('input[name="selected_pricing"]');
        if (!hiddenInput) {
          hiddenInput = document.createElement('input');
          hiddenInput.type = 'hidden';
          hiddenInput.name = 'selected_pricing';
          consultationForm.appendChild(hiddenInput);
        }
        hiddenInput.value = selectedPricing;
      }
    });
  }
}

function handleConsultationClick(e) {
  const pricingItem = e.target.closest('[data-pricing-item]');
  const pricingTitle = pricingItem?.dataset.pricingTitle || 'Unknown';

  // Скролл до форми консультації
  const consultationSection = document.querySelector('#consultation');
  if (consultationSection) {
    consultationSection.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Зберегти вибраний пакет для передачі в форму
    sessionStorage.setItem('selectedPricing', pricingTitle);
  }

  // Викликати analytics
  if (window.trackPricingEvent) {
    window.trackPricingEvent('consultation_click', pricingTitle);
  }
}

document.addEventListener('DOMContentLoaded', initPricingAccordion);

export default { initPricingAccordion };

