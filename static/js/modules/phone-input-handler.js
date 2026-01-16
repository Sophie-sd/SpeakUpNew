'use strict';

/**
 * PhoneInputHandler - універсальний handler для всіх phone inputs
 *
 * Особливості:
 * - Працює з будь-яким input[type="tel"]
 * - Фіксований префікс +38
 * - Автоматичне очищення помилок при фокусі
 * - Обробка всіх edge cases (paste, autofill, backspace)
 * - Незалежний від інших handlers
 */

class PhoneInputHandler {
  constructor(input) {
    this.input = input;
    this.prefix = '+38';
    this.maxLength = 13; // +38 + 9 digits
    this.init();
  }

  init() {
    // ЗАВЖДИ встановлювати +38
    if (!this.input.value || !this.input.value.startsWith('+38')) {
      this.input.value = this.prefix;
    }

    // Зберігати оригінальне значення для submit
    this.updateRawValue();

    // Events (в правильному порядку!)
    this.input.addEventListener('focus', this.handleFocus.bind(this));
    this.input.addEventListener('click', this.handleClick.bind(this));
    this.input.addEventListener('keydown', this.handleKeydown.bind(this));
    this.input.addEventListener('input', this.handleInput.bind(this));
    this.input.addEventListener('paste', this.handlePaste.bind(this));
    this.input.addEventListener('change', this.handleChange.bind(this)); // для autofill
    this.input.addEventListener('blur', this.handleBlur.bind(this)); // Додано blur
  }

  updateRawValue() {
    // Зберігати +380XXXXXXXXX для submit в data-атрибут
    const value = this.input.value;
    const digits = value.replace(/\D/g, '').substring(2); // Видалити +38
    if (digits.length === 10 && digits[0] === '0') {
      this.input.dataset.rawValue = '+380' + digits.substring(1);
    } else {
      this.input.dataset.rawValue = this.prefix;
    }
  }

  handleFocus(e) {
    // 1. Очистити помилки (головна фіча!)
    this.clearErrors();

    // 2. ЗАВЖДИ переконатися що +38 на місці
    if (!this.input.value || this.input.value.length < 3 || !this.input.value.startsWith('+38')) {
      this.input.value = this.prefix;
    } else {
      // Форматувати значення якщо воно не форматоване
      const normalized = this.normalizePhoneNumber(this.input.value);
      const formatted = this.formatPhoneForDisplay(normalized);
      if (formatted !== this.input.value) {
        this.input.value = formatted;
      }
    }

    // 3. Перемістити курсор після префіксу
    this.setCursorPosition();
  }

  handleBlur(e) {
    // При втраті фокусу переконатися що +38 на місці
    if (!this.input.value || this.input.value.length < 3 || !this.input.value.startsWith('+38')) {
      this.input.value = this.prefix;
    }
  }

  clearErrors() {
    // Очистити клас помилки з input
    this.input.classList.remove('field-error', 'error');

    // Видалити error span
    const formGroup = this.input.closest('.form-group');
    if (formGroup) {
      const errorSpan = formGroup.querySelector('.form-error');
      if (errorSpan) {
        errorSpan.remove();
      }
    }

    // Dispatch custom event для координації з іншими handlers
    this.input.dispatchEvent(new CustomEvent('phone:error-cleared', {
      bubbles: true,
      detail: { input: this.input }
    }));
  }

  handleClick(e) {
    // Якщо клік на префікс — перемістити курсор
    this.setCursorPosition();
  }

  handleKeydown(e) {
    const pos = this.input.selectionStart;
    const value = this.input.value;

    // Заборонити видалення +38 (перші 3 символи)
    // Backspace на позиції <= 3
    if (e.key === 'Backspace' && pos <= 3) {
      e.preventDefault();
      return;
    }

    // Delete на позиції < 3
    if (e.key === 'Delete' && pos < 3) {
      e.preventDefault();
      return;
    }

    // Arrow Left — не дозволити вийти за межи префіксу
    if (e.key === 'ArrowLeft' && pos <= 3) {
      e.preventDefault();
      this.setCursorPosition();
      return;
    }

    // Home — переміщує на початок префіксу (після +38)
    if (e.key === 'Home') {
      e.preventDefault();
      this.setCursorPosition();
      return;
    }

    // Ctrl+A потім Delete/Backspace - запобігти видаленню +38
    if ((e.key === 'Delete' || e.key === 'Backspace') &&
        (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      return;
    }
  }

  handleInput(e) {
    let value = this.input.value;

    // ЗАВЖДИ переконатися що +38 на місці
    if (!value.startsWith('+38')) {
      value = this.prefix;
    }

    // Видалити все крім цифр та +
    let cleaned = value.replace(/[^\d+]/g, '');

    // ЗАВЖДИ +38 на початку
    if (!cleaned.startsWith('+38')) {
      cleaned = this.prefix + cleaned.replace(/^\+?\d*/, '');
    }

    // Якщо довжина менше 3 символів (+38), встановити мінімум +38
    if (cleaned.length < 3) {
      cleaned = this.prefix;
    }

    // Витягти цифри після +38
    let digits = cleaned.substring(3);

    // ВАЖЛИВА ПЕРЕВІРКА: перша цифра має бути 0
    if (digits.length > 0 && digits[0] !== '0') {
      // Якщо перша цифра не 0, видаляємо її
      digits = digits.substring(1);
    }

    // Якщо потрібна перша цифра 0 і її немає, добавляємо
    if (digits.length > 0 && digits[0] !== '0') {
      // Ніколи це не повинно трапитися, але на всяк випадок
      digits = '0' + digits;
    }

    // Обмежити до 10 цифр (0 + 9)
    if (digits.length > 10) {
      digits = digits.substring(0, 10);
    }

    // Зібрати фінальне значення
    cleaned = this.prefix + digits;

    // Форматування для відображення: +38(0XX)XXX-XX-XX
    const formatted = this.formatPhoneForDisplay(cleaned);

    // Оновити значення
    if (formatted !== value) {
      this.input.value = formatted;
    }

    // Оновити raw value для submit
    this.updateRawValue();

    // Курсор в кінець
    this.input.setSelectionRange(formatted.length, formatted.length);
  }

  formatPhoneForDisplay(phone) {
    // phone має бути у форматі +380XXXXXXXXX (13 символів)
    // Відображення: +38(0XX)XXX-XX-XX
    // ЗАВЖДИ повертаємо мінімум +38
    if (!phone || !phone.startsWith('+38')) {
      return this.prefix;
    }

    // Витягти цифри після +38
    const digits = phone.substring(3); // 0XXXXXXXXX (10 цифр)

    // Якщо немає цифр - повернути тільки +38
    if (digits.length === 0) {
      return this.prefix;
    }

    // ВАЖЛИВА ПЕРЕВІРКА: перша цифра має бути 0
    if (digits[0] !== '0') {
      return this.prefix;
    }

    if (digits.length === 1) {
      return `${this.prefix}(${digits}`;
    }

    if (digits.length <= 3) {
      // +38(0XX
      return `${this.prefix}(${digits}`;
    }

    if (digits.length <= 6) {
      // +38(0XX)XXX
      return `${this.prefix}(${digits.substring(0, 3)})${digits.substring(3)}`;
    }

    if (digits.length <= 8) {
      // +38(0XX)XXX-XX
      return `${this.prefix}(${digits.substring(0, 3)})${digits.substring(3, 6)}-${digits.substring(6)}`;
    }

    // Повна довжина: +38(0XX)XXX-XX-XX
    return `${this.prefix}(${digits.substring(0, 3)})${digits.substring(3, 6)}-${digits.substring(6, 8)}-${digits.substring(8, 10)}`;
  }

  handlePaste(e) {
    e.preventDefault();

    const pastedText = e.clipboardData.getData('text');
    const normalized = this.normalizePhoneNumber(pastedText);
    const formatted = this.formatPhoneForDisplay(normalized);

    this.input.value = formatted;
    this.input.setSelectionRange(formatted.length, formatted.length);

    // Trigger input event для валідації
    this.input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  handleChange(e) {
    // Обробка autofill від браузера
    const normalized = this.normalizePhoneNumber(this.input.value);
    const formatted = this.formatPhoneForDisplay(normalized);
    if (formatted !== this.input.value) {
      this.input.value = formatted;
    }
  }

  normalizePhoneNumber(value) {
    // Видалити все крім цифр
    const digits = value.replace(/\D/g, '');

    // Конвертувати різні формати:
    // 380501234567 -> +380501234567
    // 0501234567 -> +38 0501234567
    // 501234567 -> +380501234567

    let normalized = this.prefix;

    if (digits.startsWith('380') && digits.length >= 12) {
      // 380XXXXXXXXX -> +380XXXXXXXXX
      normalized = '+38' + digits.substring(2, 11);
    } else if (digits.startsWith('38') && digits.length >= 11) {
      // 38XXXXXXXXX -> +38XXXXXXXXX
      normalized = '+' + digits.substring(0, 11);
    } else if (digits.startsWith('0') && digits.length >= 10) {
      // 0XXXXXXXXX -> +380XXXXXXXXX
      normalized = this.prefix + digits.substring(0, 10);
    } else if (digits.length === 9) {
      // XXXXXXXXX -> +380XXXXXXXXX
      normalized = this.prefix + '0' + digits;
    } else if (digits.length > 0) {
      // Часткове введення — просто додати
      normalized = this.prefix + digits.substring(digits.startsWith('38') ? 2 : 0, 10);
    }

    return normalized.substring(0, this.maxLength);
  }

  setCursorPosition() {
    // Курсор після префіксу
    const pos = Math.max(this.prefix.length, this.input.selectionStart || this.prefix.length);
    this.input.setSelectionRange(pos, pos);
  }
}

// Factory для ініціалізації всіх phone inputs
export function initPhoneInputs(root = document) {
  const inputs = root.querySelectorAll('input[type="tel"]');

  inputs.forEach(input => {
    // Уникнути подвійної ініціалізації
    if (input.dataset.phoneHandlerInit === 'true') {
      return;
    }

    new PhoneInputHandler(input);
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

