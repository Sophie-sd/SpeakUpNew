'use strict';

export class BurgerMenu {
  constructor() {
    this.button = document.querySelector('[data-burger-toggle]');
    this.overlay = document.querySelector('[data-burger-overlay]');
    this.dropdown = document.querySelector('[data-burger-menu]');
    this.links = this.dropdown?.querySelectorAll('.burger-menu__link');

    this.isOpen = false;
    this.scrollPosition = 0;

    this.init();
  }

  init() {
    if (!this.button || !this.overlay || !this.dropdown) return;

    this.button.addEventListener('click', () => this.toggle());
    this.overlay.addEventListener('click', () => this.close());

    this.links?.forEach(link => {
      link.addEventListener('click', () => this.close());
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  open() {
    // Зберегти позицію скролу
    this.scrollPosition = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;

    if (this.scrollPosition > 0) {
      sessionStorage.setItem('burgerMenuScrollPosition', this.scrollPosition.toString());
    }

    this.button.setAttribute('aria-expanded', 'true');
    this.overlay.setAttribute('aria-hidden', 'false');
    this.dropdown.setAttribute('aria-hidden', 'false');

    // Розрахунок ширини scrollbar
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    // Блокування скролу
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100vw';
    document.body.style.top = `-${this.scrollPosition}px`;

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    this.isOpen = true;
  }

  close() {
    this.button.setAttribute('aria-expanded', 'false');
    this.overlay.setAttribute('aria-hidden', 'true');
    this.dropdown.setAttribute('aria-hidden', 'true');

    // Відновити скрол - використовуємо removeProperty для повного видалення
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('position');
    document.body.style.removeProperty('top');
    document.body.style.removeProperty('width');
    document.body.style.removeProperty('padding-right');

    // Відновити позицію скролу
    if (this.scrollPosition !== undefined && this.scrollPosition !== null && this.scrollPosition >= 0) {
      // Використовуємо requestAnimationFrame для забезпечення правильного порядку
      requestAnimationFrame(() => {
        window.scrollTo({
          top: this.scrollPosition,
          behavior: 'auto'
        });
      });
    }

    sessionStorage.removeItem('burgerMenuScrollPosition');
    this.isOpen = false;
  }
}
