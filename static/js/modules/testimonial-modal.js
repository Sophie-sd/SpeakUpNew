'use strict';

/**
 * Testimonial Modal - модальне вікно для відгуків
 */
function initTestimonialModal() {
  const trigger = document.getElementById('testimonial-modal-trigger');
  if (!trigger) return;

  trigger.addEventListener('click', function() {
    // Створюємо модальне вікно динамічно
    fetch('/get-testimonial-form/', {
      method: 'GET',
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
    .then(response => response.text())
    .then(html => {
      const temp = document.createElement('div');
      temp.innerHTML = html;
      const modal = temp.querySelector('.modal');
      if (modal) {
        document.body.appendChild(modal);

        // Обробка закриття
        const closeBtn = modal.querySelector('.modal__close');
        const backdrop = modal.querySelector('.modal__backdrop');

        const closeModal = () => {
          modal.classList.remove('modal--active');
          setTimeout(() => modal.remove(), 300);
        };

        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (backdrop) backdrop.addEventListener('click', closeModal);
      }
    })
    .catch(err => console.error('[TestimonialModal] Error:', err));
  });
}

document.addEventListener('DOMContentLoaded', initTestimonialModal);

export default { initTestimonialModal };

