'use strict';

export function initTrialForm() {
  const triggerMobile = document.querySelector('.trial-form__trigger--mobile');
  const modal = document.querySelector('.trial-form__modal');
  const formsDesktop = document.querySelectorAll('.trial-form--desktop');
  const formsMobile = document.querySelectorAll('[data-trial-form-mobile]');

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
  [...formsDesktop, ...formsMobile].forEach(form => {
    form?.addEventListener('submit', handleSubmit);
  });

  // Маска телефону:
  document.querySelectorAll('input[type="tel"]').forEach(input => {
    initPhoneMask(input);
  });
}

function handleSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const submitBtn = form.querySelector('[type="submit"]');
  const formData = new FormData(form);

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

  // Disabled кнопка:
  submitBtn.disabled = true;
  submitBtn.textContent = 'Відправляємо...';

  fetch('/leads/api/trial-form/', {
    method: 'POST',
    headers: {
      'X-CSRFToken': csrfToken
    },
    body: formData
  })
  .then(response => response.json())
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
      alert('Помилка: ' + JSON.stringify(data.errors));
      submitBtn.disabled = false;
      submitBtn.textContent = 'Записатись';
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('Помилка відправки форми');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Записатись';
  });
}

function initPhoneMask(input) {
  input.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');

    if (!value.startsWith('380')) {
      value = '380' + value;
    }

    value = value.substring(0, 12);

    let formatted = '+380';
    if (value.length > 3) {
      formatted += ' (' + value.substring(3, 5);
    }
    if (value.length > 5) {
      formatted += ') ' + value.substring(5, 8);
    }
    if (value.length > 8) {
      formatted += '-' + value.substring(8, 10);
    }
    if (value.length > 10) {
      formatted += '-' + value.substring(10, 12);
    }

    e.target.value = formatted;
  });
}


