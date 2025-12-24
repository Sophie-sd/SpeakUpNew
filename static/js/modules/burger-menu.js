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
    // iOS Safari: зберегти позицію скролу
    this.scrollPosition = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;

    if (this.scrollPosition > 0) {
      sessionStorage.setItem('burgerMenuScrollPosition', this.scrollPosition.toString());
    }

    // Подвійний RAF для Safari
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
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
      });
    });
  }

  close() {
    this.button.setAttribute('aria-expanded', 'false');
    this.overlay.setAttribute('aria-hidden', 'true');
    this.dropdown.setAttribute('aria-hidden', 'true');

    // Відновити скрол
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.paddingRight = '';

    // Подвійний requestAnimationFrame для iOS Safari
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          window.scrollTo({
            top: this.scrollPosition,
            behavior: 'auto'
          });

          // Додаткова перевірка для iOS
          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
          if (isIOS) {
            setTimeout(() => {
              window.scrollTo({
                top: this.scrollPosition,
                behavior: 'auto'
              });
            }, 50);
          }
        }, 20);
      });
    });

    this.isOpen = false;
  }
}
