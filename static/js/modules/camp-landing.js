/**
 * Camp Landing Page - JavaScript Module
 * Handles CTA button interactions and modal triggers
 */

(function() {
  'use strict';

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCampLanding);
  } else {
    initCampLanding();
  }

  /**
   * Initialize all event handlers
   */
  function initCampLanding() {
    const ctaButton = document.getElementById('cta-button');
    const ctaButton2 = document.getElementById('cta-button-2');
    const modalTrigger = document.getElementById('modal-trigger');

    if (ctaButton) {
      ctaButton.addEventListener('click', handleCtaClick);
    }

    if (ctaButton2) {
      ctaButton2.addEventListener('click', handleCtaClick);
    }
  }

  /**
   * Handle CTA button click - open modal for consultation form
   * @param {Event} event - Click event
   */
  function handleCtaClick(event) {
    event.preventDefault();

    const button = event.currentTarget;
    const action = button.getAttribute('data-action');

    // Check if modal already exists in DOM
    const modal = document.querySelector('[role="dialog"]') || 
                  document.getElementById('consultation-modal') ||
                  document.querySelector('.modal');

    if (action === 'open-modal' && modal) {
      // Modal exists - open it
      if (modal.classList) {
        modal.classList.add('active', 'is-open');
      }
      // Also trigger via click if it has a trigger mechanism
      const trigger = modal.querySelector('[data-modal-trigger]');
      if (trigger) {
        trigger.click();
      }
    } else if (action === 'open-modal') {
      // Modal doesn't exist - try HTMX approach
      const htmxForm = document.querySelector('[hx-get*="consultation"]');
      if (htmxForm && window.htmx) {
        window.htmx.ajax('GET', htmxForm.getAttribute('hx-get'), {
          target: '#modal-trigger',
          swap: 'innerHTML'
        });
      } else {
        // Fallback: trigger button if it exists
        const modalButton = document.querySelector('[data-modal-open]');
        if (modalButton) {
          modalButton.click();
        }
      }
    }

    // Show success state (optional)
    showButtonSuccess(button);
  }

  /**
   * Show success state on button after click
   * @param {HTMLElement} button - Button element
   */
  function showButtonSuccess(button) {
    const originalText = button.textContent;
    const originalHTML = button.innerHTML;

    // Store original state
    button.dataset.originalHtml = originalHTML;

    // Update button UI to show success
    button.classList.add('success');

    // Change text
    const textSpan = button.querySelector('.button-text');
    if (textSpan) {
      textSpan.textContent = 'Дякуємо! Ми зв\'яжемося з вами';
    }

    // Remove arrow
    const arrow = button.querySelector('.button-arrow');
    if (arrow) {
      arrow.style.display = 'none';
    }

    // Change emoji
    const emoji = button.querySelector('.button-emoji');
    if (emoji) {
      emoji.textContent = '✅';
    }

    // Disable button
    button.disabled = true;
    button.style.pointerEvents = 'none';

    // Optional: Restore after delay
    setTimeout(function() {
      // Keep success state visible
    }, 3000);
  }

  /**
   * Utility: Update dynamic content (grant amount, spots left)
   * Can be called from server/admin if needed
   */
  window.campLanding = {
    updateGrantAmount: function(amount) {
      const elements = document.querySelectorAll('#grant-amount');
      elements.forEach(el => {
        el.textContent = amount;
      });
    },
    updateSpotsLeft: function(spots) {
      const elements = document.querySelectorAll('#spots-left, #spots-left-2');
      elements.forEach(el => {
        el.textContent = spots;
      });
    },
    resetButtons: function() {
      const buttons = document.querySelectorAll('[data-action="open-modal"]');
      buttons.forEach(button => {
        button.classList.remove('success');
        button.disabled = false;
        button.style.pointerEvents = 'auto';

        const textSpan = button.querySelector('.button-text');
        if (textSpan) {
          textSpan.textContent = textSpan.dataset.originalText || 'Отримати грант';
        }

        const emoji = button.querySelector('.button-emoji');
        if (emoji) {
          emoji.textContent = emoji.dataset.originalEmoji || '🎓';
        }

        const arrow = button.querySelector('.button-arrow');
        if (arrow) {
          arrow.style.display = '';
        }
      });
    }
  };

})();
