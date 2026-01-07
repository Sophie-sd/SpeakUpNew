/**
 * Phone Mask Utility - Ukrainian phone number formatting
 * Handles input, paste, and backspace events for +380 (XX) XXX XX XX format
 *
 * Rule 0 compliance: No inline JS, pure vanilla JS utility
 */

/**
 * Initialize phone mask on a single input element
 * @param {HTMLInputElement} input - The input element to mask
 */
export function initPhoneMask(input) {
  if (!input || input.type !== 'tel') {
    return;
  }

  // Prevent double initialization
  if (input.dataset.phoneMaskInitialized === 'true') {
    return;
  }
  input.dataset.phoneMaskInitialized = 'true';

  /**
   * Extract only digits from a string
   * @param {string} value - Input value
   * @returns {string} - Only digits
   */
  function getDigits(value) {
    return value.replace(/\D/g, '');
  }

  /**
   * Format phone number as +380 (XX) XXX XX XX
   * @param {string} digits - Only digits
   * @returns {string} - Formatted phone number
   */
  function formatPhone(digits) {
    // Remove leading zeros and ensure we start with 380
    if (digits.startsWith('0')) {
      digits = '380' + digits.substring(1);
    } else if (!digits.startsWith('380')) {
      // If it doesn't start with 380, try to prepend it
      if (digits.length >= 9) {
        digits = '380' + digits;
      }
    }

    // Limit to 12 digits (380 + 9 digits)
    if (digits.length > 12) {
      digits = digits.substring(0, 12);
    }

    // Format: +380 (XX) XXX XX XX
    if (digits.length === 0) {
      return '';
    } else if (digits.length <= 3) {
      return '+' + digits;
    } else if (digits.length <= 6) {
      return '+380 (' + digits.substring(3);
    } else if (digits.length <= 9) {
      return '+380 (' + digits.substring(3, 5) + ') ' + digits.substring(5);
    } else {
      return '+380 (' + digits.substring(3, 5) + ') ' + digits.substring(5, 8) + ' ' + digits.substring(8, 10) + ' ' + digits.substring(10, 12);
    }
  }

  /**
   * Get cursor position after formatting
   * @param {string} oldValue - Previous value
   * @param {string} newValue - New formatted value
   * @param {number} oldCursorPos - Previous cursor position
   * @returns {number} - New cursor position
   */
  function getNewCursorPosition(oldValue, newValue, oldCursorPos) {
    // Count non-digit characters before cursor in old value
    let nonDigitsBefore = 0;
    for (let i = 0; i < oldCursorPos && i < oldValue.length; i++) {
      if (/\D/.test(oldValue[i])) {
        nonDigitsBefore++;
      }
    }

    // Count digits before cursor
    const digitsBefore = oldCursorPos - nonDigitsBefore;

    // Find position in new value where we have the same number of digits
    let digitCount = 0;
    for (let i = 0; i < newValue.length; i++) {
      if (/\d/.test(newValue[i])) {
        digitCount++;
        if (digitCount >= digitsBefore) {
          return i + 1;
        }
      }
    }

    return newValue.length;
  }

  /**
   * Handle input event
   */
  function handleInput(e) {
    const input = e.target;
    const oldValue = input.value;
    const oldCursorPos = input.selectionStart || 0;

    const digits = getDigits(oldValue);
    const formatted = formatPhone(digits);

    input.value = formatted;

    // Restore cursor position
    const newCursorPos = getNewCursorPosition(oldValue, formatted, oldCursorPos);
    input.setSelectionRange(newCursorPos, newCursorPos);
  }

  /**
   * Handle paste event
   */
  function handlePaste(e) {
    e.preventDefault();

    const input = e.target;
    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
    const digits = getDigits(pastedText);

    // If pasted content starts with +380 or 380, use it as is
    // Otherwise, if it starts with 0, convert to 380
    let phoneDigits = digits;
    if (phoneDigits.startsWith('0') && phoneDigits.length === 10) {
      phoneDigits = '380' + phoneDigits.substring(1);
    } else if (!phoneDigits.startsWith('380') && phoneDigits.length >= 9) {
      // If we have 9+ digits but don't start with 380, prepend 380
      phoneDigits = '380' + phoneDigits;
    }

    // Limit to 12 digits
    if (phoneDigits.length > 12) {
      phoneDigits = phoneDigits.substring(0, 12);
    }

    const formatted = formatPhone(phoneDigits);
    input.value = formatted;

    // Set cursor to end
    const cursorPos = formatted.length;
    input.setSelectionRange(cursorPos, cursorPos);

    // Trigger input event for any listeners
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /**
   * Handle keydown for backspace/delete
   */
  function handleKeyDown(e) {
    // Allow navigation and deletion keys
    const allowedKeys = [
      'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End', 'Tab', 'Enter'
    ];

    if (allowedKeys.includes(e.key)) {
      return; // Allow default behavior
    }

    // Allow Ctrl/Cmd combinations
    if (e.ctrlKey || e.metaKey) {
      return;
    }

    // Block non-digit characters (except + which is handled by format)
    if (e.key.length === 1 && !/\d/.test(e.key) && e.key !== '+') {
      e.preventDefault();
    }
  }

  // Attach event listeners
  input.addEventListener('input', handleInput);
  input.addEventListener('paste', handlePaste);
  input.addEventListener('keydown', handleKeyDown);
}

/**
 * Initialize phone masks on all tel inputs in a container
 * @param {HTMLElement|Document} container - Container to search in (default: document)
 */
export function initPhoneMasks(container = document) {
  const telInputs = container.querySelectorAll('input[type="tel"]');
  telInputs.forEach(input => {
    initPhoneMask(input);
  });
}

