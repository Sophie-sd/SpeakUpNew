'use strict';

import { GTMEvents } from './gtm-events.js';

/**
 * HTMX GTM Integration - додає GTM tracking до HTMX форм
 * БЕЗ зміни їх роботи (consultation, testimonial)
 */
let initialized = false;

function initHtmxGtmIntegration() {
  // Перевіряємо чи htmx завантажений і чи вже ініціалізовано
  if (typeof htmx === 'undefined' || initialized) {
    if (typeof htmx === 'undefined' && !initialized) {
      // Якщо htmx ще не завантажений, спробувати ще раз
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHtmxGtmIntegration);
      } else {
        setTimeout(initHtmxGtmIntegration, 100);
      }
    }
    return;
  }

  initialized = true;

  // Form start tracking - при першому фокусі на полі HTMX форми
  document.body.addEventListener('focusin', (e) => {
    const form = e.target.closest('form[hx-post]');
    if (form && !form.dataset.gtmTracked) {
      form.dataset.gtmTracked = 'true';
      const formType = form.dataset.formType || 'unknown';
      const location = form.dataset.formLocation || 'page';
      GTMEvents.formStart(formType, location);
    }
  });

  // Form submit tracking (ПЕРЕД відправкою)
  document.body.addEventListener('htmx:beforeRequest', (e) => {
    if (e.target.tagName === 'FORM' || e.target.closest('form')) {
      const form = e.target.tagName === 'FORM' ? e.target : e.target.closest('form');
      const formType = form.dataset.formType || 'unknown';
      const location = form.dataset.formLocation || 'page';
      GTMEvents.formSubmit(formType, location);
    }
  });

  // Success tracking (після успішного swap)
  document.body.addEventListener('htmx:afterSwap', (e) => {
    const form = e.target.tagName === 'FORM' ? e.target : e.target.closest('form');
    if (form && form.hasAttribute('hx-post')) {
      const formType = form.dataset.formType || 'unknown';
      const location = form.dataset.formLocation || 'page';

      // Перевіряємо чи це success response (шукаємо success клас або повідомлення)
      const successElement = e.target.querySelector('[class*="success"], [class*="message--success"]');
      if (successElement) {
        GTMEvents.formSuccess(formType, location);
      }
    }
  });

  // Error tracking
  document.body.addEventListener('htmx:responseError', (e) => {
    const form = e.target.tagName === 'FORM' ? e.target : e.target.closest('form');
    if (form && form.hasAttribute('hx-post')) {
      const formType = form.dataset.formType || 'unknown';
      const location = form.dataset.formLocation || 'page';
      GTMEvents.formError(formType, location, 'server');
    }
  });

  // Network error tracking
  document.body.addEventListener('htmx:sendError', (e) => {
    const form = e.target.tagName === 'FORM' ? e.target : e.target.closest('form');
    if (form && form.hasAttribute('hx-post')) {
      const formType = form.dataset.formType || 'unknown';
      const location = form.dataset.formLocation || 'page';
      GTMEvents.formError(formType, location, 'network');
    }
  });
}

// Запустити ініціалізацію
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHtmxGtmIntegration);
} else {
  initHtmxGtmIntegration();
}

