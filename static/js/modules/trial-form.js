'use strict';

import { initPhoneMask, showFieldError, clearFieldError } from '../utils/form-helpers.js';

export function initTrialForm() {
  const triggerMobile = document.querySelector('.trial-form__trigger--mobile');
  const modal = document.querySelector('.trial-form__modal');
  const formsDesktop = document.querySelectorAll('.trial-form--desktop');
  const formsMobile = document.querySelectorAll('[data-trial-form-mobile]');
  const formsHero = document.querySelectorAll('.trial-form--hero');

  // Відкриття модалу на мобільних:
  triggerMobile?.addEventListener('click', () => {
    modal?.classList.add('modal--active');

    // Закрити бургер-меню якщо відкрите:
    const burgerOverlay = document.querySelector('[data-burger-overlay]');
    if (burgerOverlay?.classList.contains('burger-menu__overlay--active')) {
      document.querySelector('[data-burger-toggle]')?.click();
    }
  });

  // Закриття модалу:
  modal?.querySelector('.modal__close')?.addEventListener('click', () => {
    modal.classList.remove('modal--active');
  });

  modal?.querySelector('.modal__backdrop')?.addEventListener('click', () => {
    modal.classList.remove('modal--active');
  });

  // Обробка submit для всіх форм:
  [...formsDesktop, ...formsMobile, ...formsHero].forEach(form => {
    form?.addEventListener('submit', handleSubmit);
  });

  // Маска телефону (використовуємо shared функцію):
  document.querySelectorAll('input[type="tel"]').forEach(input => {
    initPhoneMask(input);
  });
}

function handleSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const submitBtn = form.querySelector('[type="submit"]');
  const nameInput = form.querySelector('input[name="name"]');
  const phoneInput = form.querySelector('input[name="phone"]');

  // Валідація перед відправкою
  let isValid = true;
  const errors = {};

  // Валідація імені
  const name = nameInput?.value.trim();
  if (!name || name.length < 2) {
    isValid = false;
    errors.name = "Ім'я має містити мінімум 2 символи";
    if (nameInput) {
      showFieldError(nameInput, errors.name);
      nameInput.focus();
    }
  } else {
    if (nameInput) clearFieldError(nameInput);
  }

  // Валідація телефону
  const phone = phoneInput?.value.trim();
  if (!phone) {
    isValid = false;
    errors.phone = "Введіть номер телефону";
    if (phoneInput) {
      showFieldError(phoneInput, errors.phone);
      if (!nameInput || (name && name.length >= 2)) {
        phoneInput.focus();
      }
    }
  } else {
    // Перевірка формату телефону (мінімум 9 цифр після +380)
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 9 || (phoneDigits.length === 12 && !phoneDigits.startsWith('380'))) {
      isValid = false;
      errors.phone = "Введіть коректний український номер телефону";
      if (phoneInput) {
        showFieldError(phoneInput, errors.phone);
        if (!nameInput || (name && name.length >= 2)) {
          phoneInput.focus();
        }
      }
    } else {
      if (phoneInput) clearFieldError(phoneInput);
    }
  }

  if (!isValid) {
    return;
  }

  const formData = new FormData(form);

  // Нормалізувати телефон: видалити пробіли та залишити тільки +380XXXXXXXXX
  if (phoneInput) {
    const phoneValue = phoneInput.value.replace(/\s/g, ''); // Видалити всі пробіли
    formData.set('phone', phoneValue);
  }

  // Додати UTM параметри:
  const urlParams = new URLSearchParams(window.location.search);
  formData.append('utm_source', urlParams.get('utm_source') || '');
  formData.append('utm_medium', urlParams.get('utm_medium') || '');
  formData.append('utm_campaign', urlParams.get('utm_campaign') || '');
  formData.append('utm_content', urlParams.get('utm_content') || '');
  formData.append('utm_term', urlParams.get('utm_term') || '');
  formData.append('fbclid', urlParams.get('fbclid') || '');
  formData.append('gclid', urlParams.get('gclid') || '');

  // CSRF token:
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  if (!csrfToken) {
    console.error('CSRF token not found');
    showFormError(form, 'Помилка безпеки. Будь ласка, оновіть сторінку.');
    return;
  }

  // Disabled кнопка:
  submitBtn.disabled = true;
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Відправляємо...';

  fetch('/leads/api/trial-form/', {
    method: 'POST',
    headers: {
      'X-CSRFToken': csrfToken
    },
    body: formData
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(data => {
        throw new Error(data.errors || 'Помилка сервера');
      });
    }
    return response.json();
  })
  .then(data => {
    if (data.success) {
      // Facebook Pixel:
      if (typeof fbq !== 'undefined') {
        fbq('track', 'Lead', { content_name: 'Trial Lesson Form' });
      }

      // Google Ads:
      if (typeof gtag !== 'undefined') {
        gtag('event', 'conversion', {
          'send_to': 'AW-CONVERSION_ID/CONVERSION_LABEL'
        });
      }

      // Редірект:
      window.location.href = data.redirect_url;
    } else {
      // Відобразити помилки валідації з сервера
      if (data.errors) {
        Object.keys(data.errors).forEach(fieldName => {
          const field = form.querySelector(`[name="${fieldName}"]`);
          if (field) {
            const errorMessage = Array.isArray(data.errors[fieldName])
              ? data.errors[fieldName][0]
              : data.errors[fieldName];
            showFieldError(field, errorMessage);
          }
        });
      } else {
        showFormError(form, 'Помилка відправки форми. Спробуйте ще раз.');
      }
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  })
  .catch(error => {
    console.error('Error:', error);
    showFormError(form, 'Помилка відправки форми. Перевірте з\'єднання з інтернетом.');
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  });
}

function showFormError(form, message) {
  // Видалити старі загальні помилки
  const oldError = form.querySelector('.form-error-general');
  if (oldError) oldError.remove();

  // Додати нову загальну помилку
  const errorDiv = document.createElement('div');
  errorDiv.className = 'form-error form-error-general';
  errorDiv.textContent = message;
  form.insertBefore(errorDiv, form.firstChild);
}

