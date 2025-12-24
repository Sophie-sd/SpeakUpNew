'use strict';

/**
 * Base Accordion Module - базовий модуль для всіх акордеонів
 * Використовує event delegation для оптимізації
 * Підтримує ARIA attributes, keyboard navigation
 */
export class BaseAccordion {
  constructor(container, options = {}) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    if (!this.container) {
      console.warn('[BaseAccordion] Container not found');
      return;
    }

    this.options = {
      closeOthers: options.closeOthers !== false, // Закривати інші при відкритті
      animationDuration: options.animationDuration || 300,
      ...options
    };

    this.items = Array.from(this.container.querySelectorAll('[data-accordion-item]'));
    this.openItems = new Set();

    this.init();
  }

  init() {
    // Event delegation на контейнер
    this.container.addEventListener('click', this.handleClick.bind(this));

    // Keyboard navigation
    this.container.addEventListener('keydown', this.handleKeyDown.bind(this));

    // Ініціалізація ARIA attributes
    this.items.forEach((item, index) => {
      const header = item.querySelector('[data-accordion-header]');
      const content = item.querySelector('[data-accordion-content]');

      if (!header || !content) {
        console.warn(`[BaseAccordion] Missing header or content for item ${index}`);
        return;
      }

      const itemId = `accordion-item-${index}`;
      const contentId = `accordion-content-${index}`;

      header.setAttribute('id', itemId);
      header.setAttribute('aria-expanded', 'false');
      header.setAttribute('aria-controls', contentId);
      header.setAttribute('tabindex', '0');
      header.setAttribute('role', 'button');

      content.setAttribute('id', contentId);
      content.setAttribute('aria-labelledby', itemId);
      content.setAttribute('aria-hidden', 'true');

      // Початковий стан: закрито
      content.style.maxHeight = '0';
      content.style.overflow = 'hidden';
      content.style.transition = `max-height ${this.options.animationDuration}ms ease-out`;
    });
  }

  handleClick(e) {
    const header = e.target.closest('[data-accordion-header]');
    if (!header) return;

    e.preventDefault();
    const item = header.closest('[data-accordion-item]');
    if (!item) return;

    this.toggle(item);
  }

  handleKeyDown(e) {
    const header = e.target.closest('[data-accordion-header]');
    if (!header) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const item = header.closest('[data-accordion-item]');
      if (item) {
        this.toggle(item);
      }
    }
  }

  toggle(item) {
    const isOpen = this.openItems.has(item);

    if (isOpen) {
      this.close(item);
    } else {
      if (this.options.closeOthers) {
        // Закриваємо всі інші
        this.openItems.forEach(openItem => {
          if (openItem !== item) {
            this.close(openItem);
          }
        });
      }
      this.open(item);
    }
  }

  open(item) {
    const header = item.querySelector('[data-accordion-header]');
    const content = item.querySelector('[data-accordion-content]');

    if (!header || !content) return;

    // Встановлюємо max-height на scrollHeight
    content.style.maxHeight = `${content.scrollHeight}px`;
    header.setAttribute('aria-expanded', 'true');
    content.setAttribute('aria-hidden', 'false');
    item.classList.add('accordion-item--open');

    this.openItems.add(item);
  }

  close(item) {
    const header = item.querySelector('[data-accordion-header]');
    const content = item.querySelector('[data-accordion-content]');

    if (!header || !content) return;

    // Встановлюємо max-height на 0
    content.style.maxHeight = '0';
    header.setAttribute('aria-expanded', 'false');
    content.setAttribute('aria-hidden', 'true');
    item.classList.remove('accordion-item--open');

    this.openItems.delete(item);
  }

  openAll() {
    this.items.forEach(item => this.open(item));
  }

  closeAll() {
    this.items.forEach(item => this.close(item));
  }

  destroy() {
    this.container.removeEventListener('click', this.handleClick);
    this.container.removeEventListener('keydown', this.handleKeyDown);
  }
}

export default BaseAccordion;

