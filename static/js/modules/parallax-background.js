'use strict';

/**
 * ParallaxBackground - Паралакс ефект для фону
 * Оптимізований для iOS/Android/Desktop з мінімальним впливом на продуктивність
 * Підтримує як одиночний шар (backward compatibility), так і масив шарів
 */
export class ParallaxBackground {
  constructor(layers = null) {
    // Якщо передано масив - мульти-шар
    if (Array.isArray(layers)) {
      this.layers = layers.map(config => ({
        element: document.querySelector(config.selector),
        speed: config.speed,
        isActive: false
      })).filter(layer => layer.element !== null);
    } else {
      // Старий спосіб (backward compatibility)
      const bg = document.querySelector('[data-parallax-bg]');
      if (!bg) return;
      this.layers = [{ element: bg, speed: 0.2, isActive: false }];
    }

    if (this.layers.length === 0) return;

    this.ticking = false;
    this.scrollY = 0;
    this.prefersReducedMotion = false;
    this.isMobile = window.innerWidth <= 767;

    this.init();
  }

  init() {
    // Перевірка prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.prefersReducedMotion = mediaQuery.matches;

    if (this.prefersReducedMotion) {
      console.log('[Parallax] Disabled due to prefers-reduced-motion');
      this.layers.forEach(layer => {
        layer.element.style.position = 'absolute';
      });
      return;
    }

    // iOS vh fix (окрема змінна для уникнення конфлікту)
    this.setVhVariable();

    // Intersection Observer для економії ресурсів
    this.setupIntersectionObserver();

    // Scroll listener - використовуємо той самий паттерн як running-line.js
    window.addEventListener('scroll', () => {
      if (!this.ticking) {
        window.requestAnimationFrame(() => this.handleScroll());
        this.ticking = true;
      }
    }, { passive: true });

    // Resize listener тільки для iOS vh
    if (this.isIOS()) {
      window.addEventListener('resize', () => {
        this.setVhVariable();
        this.isMobile = window.innerWidth <= 767;
      }, { passive: true });
    }

    // Початкове оновлення
    this.update();
  }

  setupIntersectionObserver() {
    const options = {
      root: null,
      rootMargin: '200px', // Більший margin для плавності
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const layer = this.layers.find(l => l.element === entry.target);
        if (!layer) return;

        const wasActive = layer.isActive;
        layer.isActive = entry.isIntersecting;

        // Додаємо/видаляємо will-change тільки коли потрібно
        if (layer.isActive && !wasActive) {
          layer.element.classList.add('hero-background--active');
          // Для Speaky шару використовуємо окремий клас
          if (layer.element.classList.contains('speaky-layer')) {
            layer.element.classList.add('speaky-layer--active');
          }
        } else if (!layer.isActive && wasActive) {
          layer.element.classList.remove('hero-background--active');
          if (layer.element.classList.contains('speaky-layer')) {
            layer.element.classList.remove('speaky-layer--active');
          }
        }
      });
    }, options);

    this.layers.forEach(layer => observer.observe(layer.element));
  }

  handleScroll() {
    const hasActive = this.layers.some(layer => layer.isActive);
    if (!hasActive) {
      this.ticking = false;
      return;
    }

    this.update();
    this.ticking = false;
  }

  update() {
    // Використовуємо pageYOffset як у running-line.js
    this.scrollY = window.pageYOffset;

    this.layers.forEach(layer => {
      if (!layer.isActive) return;

      // Мобільні пристрої: зменшити швидкість на 50%
      const speedMultiplier = this.isMobile ? 0.5 : 1;
      const effectiveSpeed = layer.speed * speedMultiplier;

      const translateY = -(this.scrollY * effectiveSpeed);

      // Для Speaky шару потрібно зберегти translateX для центрування
      if (layer.element.classList.contains('speaky-layer')) {
        layer.element.style.transform = `translateX(-50%) translateY(${translateY}px) translateZ(0)`;
      } else {
        // Для інших шарів стандартний transform
        layer.element.style.transform = `translateY(${translateY}px) translateZ(0)`;
      }
    });
  }

  // iOS vh fix (окрема змінна)
  setVhVariable() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--parallax-vh', `${vh}px`);
  }

  // Визначення iOS
  isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  }

  // Cleanup метод (для потенційного destroy)
  destroy() {
    this.layers.forEach(layer => {
      if (layer.element) {
        layer.element.classList.remove('hero-background--active');
        layer.element.classList.remove('speaky-layer--active');
        layer.element.style.transform = '';
      }
    });
  }
}

export default ParallaxBackground;

