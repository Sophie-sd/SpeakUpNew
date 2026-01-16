'use strict';

/**
 * PhoneInputHandler - простий handler для очищення phone inputs
 * - Приймає цифри та +
 * - Очищує від спеціальних символів
 * - Нормалізація телефону відбувається на серверній стороні (normalize_phone_number)
 */

class PhoneInputHandler {
  constructor(input) {
    this.input = input;
    this.prefix = '+38';
    this.maxDigits = 10; // 0 + 9 цифр
    this.init();
  }

  init() {
    // Зберегти bound методи для можливості видалення
    this.boundHandleFocus = this.handleFocus.bind(this);
    this.boundHandleInput = this.handleInput.bind(this);
    this.boundHandlePaste = this.handlePaste.bind(this);
    this.boundHandleBlur = this.handleBlur.bind(this);
    this.boundHandleAutofill = this.handleAutofill.bind(this);
    this.boundHandleChange = this.handleChange.bind(this);

    // Event listeners
    this.input.addEventListener('focus', this.boundHandleFocus);
    this.input.addEventListener('input', this.boundHandleInput);
    this.input.addEventListener('paste', this.boundHandlePaste);
    this.input.addEventListener('blur', this.boundHandleBlur);
    this.input.addEventListener('animationstart', this.boundHandleAutofill);
    this.input.addEventListener('change', this.boundHandleChange);

    // КРИТИЧНО: Перевірити чи поле вже має autofill ДО ініціалізації
    this.checkInitialAutofillState();
  }

  handleFocus(e) {
    // Очистити помилки
    this.clearErrors();

    // Просто встановити курсор в кінець, не додавати префікс автоматично
    if (this.input.value) {
      this.input.setSelectionRange(this.input.value.length, this.input.value.length);
    }
  }

  handleBlur(e) {
    // При втраті фокусу просто залишити значення як є
    // Нормалізація буде на серверній стороні (normalize_phone_number)
  }

  checkInitialAutofillState() {
    /**
     * Перевірити чи поле вже автозаповнене браузером ДО ініціалізації JS
     * Це вирішує race condition коли autofill спрацьовує раніше за DOMContentLoaded
     */
    try {
      // Метод 1: CSS pseudo-class (найнадійніший для Webkit)
      if (this.input.matches(':-webkit-autofill')) {
        console.log('[PhoneInputHandler] Initial autofill detected (webkit)');
        this.handleInitialAutofill();
        return;
      }

      // Метод 2: Перевірка значення (fallback для інших браузерів)
      if (this.input.value && this.input.value.length > 0) {
        console.log('[PhoneInputHandler] Initial value detected, treating as potential autofill');
        this.handleInitialAutofill();
        return;
      }
    } catch (e) {
      console.warn('[PhoneInputHandler] Error checking initial autofill state:', e);
    }
  }

  handleInitialAutofill() {
    /**
     * Обробити autofill що спрацював ДО ініціалізації
     */
    this.clearErrors();
    this.input.removeAttribute('disabled');
    this.input.removeAttribute('readonly');

    // Нормалізувати значення якщо потрібно
    if (this.input.value) {
      // Очистити від нецифрових символів (крім +)
      const cleaned = this.input.value.replace(/[^\d+]/g, '');
      if (cleaned !== this.input.value) {
        this.input.value = cleaned;
      }
    }
  }

  handleAutofill(e) {
    /**
     * Обробити autofill animation event (спрацьовує при autofill)
     */
    if (e.animationName === 'onAutoFillStart') {
      console.log('[PhoneInputHandler] Autofill animation detected');
      this.clearErrors();
      this.input.removeAttribute('disabled');
      this.input.removeAttribute('readonly');

      // Нормалізувати autofill значення після невеликої затримки
      setTimeout(() => {
        if (this.input.value) {
          const cleaned = this.input.value.replace(/[^\d+]/g, '');
          this.input.value = cleaned;
        }
      }, 10);
    }
  }

  handleChange(e) {
    /**
     * Change event спрацьовує після autofill (fallback)
     */
    console.log('[PhoneInputHandler] Change event (possibly autofill)');
    this.clearErrors();
    this.input.removeAttribute('disabled');
    this.input.removeAttribute('readonly');
  }

  clearErrors() {
    // Очистити клас помилки з input
    this.input.classList.remove('field-error');
    this.input.removeAttribute('aria-invalid');
    this.input.removeAttribute('disabled');
    this.input.removeAttribute('readonly');

    // Видалити error span
    const formGroup = this.input.closest('.form-group');
    if (formGroup) {
      const errorSpan = formGroup.querySelector('.form-error');
      if (errorSpan) {
        errorSpan.remove();
      }
    }

    // Dispatch custom event
    this.input.dispatchEvent(new CustomEvent('phone:error-cleared', {
      bubbles: true,
      detail: { input: this.input }
    }));
  }

  handleInput(e) {
    // Очистити помилки при введенні
    this.clearErrors();

    let value = this.input.value;

    // Якщо поле порожнє, дозволити введення
    if (!value || value.length === 0) {
      return;
    }

    // Очистити від нецифрових символів, але залишити + для можливості введення +380
    let cleaned = value.replace(/[^\d+]/g, '');

    // Оновити значення (без форматування)
    this.input.value = cleaned;

    // Курсор в кінець
    this.input.setSelectionRange(cleaned.length, cleaned.length);
  }

  handlePaste(e) {
    e.preventDefault();

    // Очистити помилки при paste
    this.clearErrors();

    const pastedText = e.clipboardData.getData('text');
    // Очистити від нецифрових символів (крім +)
    const cleaned = pastedText.replace(/[^\d+]/g, '');

    this.input.value = cleaned;
    this.input.setSelectionRange(cleaned.length, cleaned.length);

    // Trigger input event для консистентності
    this.input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  destroy() {
    /**
     * Очистити event listeners та references для повної переініціалізації
     * Використовується при HTMX afterSwap щоб уникнути дублювання handlers
     */
    if (this.input) {
      this.input.removeEventListener('focus', this.boundHandleFocus);
      this.input.removeEventListener('input', this.boundHandleInput);
      this.input.removeEventListener('paste', this.boundHandlePaste);
      this.input.removeEventListener('blur', this.boundHandleBlur);
      this.input.removeEventListener('animationstart', this.boundHandleAutofill);
      this.input.removeEventListener('change', this.boundHandleChange);

      delete this.input._phoneHandler;
      delete this.input.dataset.phoneHandlerInit;
    }
  }
}

// Factory для ініціалізації всіх phone inputs
export function initPhoneInputs(root = document) {
  const inputs = root.querySelectorAll('input[type="tel"]');

  inputs.forEach(input => {
    // Якщо вже ініціалізовано, знищити старий handler перед переініціалізацією
    if (input.dataset.phoneHandlerInit === 'true') {
      if (input._phoneHandler) {
        input._phoneHandler.destroy();
      }
    }

    const handler = new PhoneInputHandler(input);
    input._phoneHandler = handler;
    input.dataset.phoneHandlerInit = 'true';

    console.log('[PhoneInputHandler] Initialized for:', input.name || input.id || 'unnamed');
  });
}

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initPhoneInputs());
} else {
  initPhoneInputs();
}

export default PhoneInputHandler;
