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
    this.lastUpdateTime = 0;
    this.resizeTimeout = null;
    this.minFrameTime = 1000 / 60; // 60fps throttling

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

    // Scroll listener з throttling (max 60fps)
    window.addEventListener('scroll', () => {
      if (!this.ticking) {
        window.requestAnimationFrame(() => this.handleScroll());
        this.ticking = true;
      }
    }, { passive: true });

    // Resize listener з debounce для iOS vh
    if (this.isIOS()) {
      window.addEventListener('resize', () => {
        if (this.resizeTimeout) {
          clearTimeout(this.resizeTimeout);
        }
        this.resizeTimeout = setTimeout(() => {
          this.setVhVariable();
          this.isMobile = window.innerWidth <= 767;
        }, 150);
      }, { passive: true });
    }

    // Початкове оновлення
    this.update();

    // Для Speaky шару застосувати початковий offset одразу
    this.layers.forEach(layer => {
      if (layer.element.classList.contains('speaky-layer')) {
        const initialOffset = -100;
        layer.element.style.transform = `translate3d(-50%, ${initialOffset}px, 0)`;
        layer.element.style.webkitTransform = `translate3d(-50%, ${initialOffset}px, 0)`;
      }
    });
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

    // Throttling для продуктивності (max 60fps)
    const now = performance.now();
    if (now - this.lastUpdateTime < this.minFrameTime) {
      this.ticking = false;
      return;
    }
    this.lastUpdateTime = now;

    this.update();
    this.ticking = false;
  }

  update() {
    // Використовуємо pageYOffset як у running-line.js
    this.scrollY = window.pageYOffset || window.scrollY;

    this.layers.forEach(layer => {
      if (!layer.isActive) return;

      // Мобільні пристрої: зменшити швидкість на 50%
      const speedMultiplier = this.isMobile ? 0.5 : 1;
      const effectiveSpeed = layer.speed * speedMultiplier;

      const translateY = -(this.scrollY * effectiveSpeed);

      // Використовуємо translate3d для кращої GPU акселерації
      // Для Speaky шару потрібно зберегти translateX для центрування та додати початковий offset
      if (layer.element.classList.contains('speaky-layer')) {
        // Початкова позиція -100px від низу
        const initialOffset = -100;
        const finalTranslateY = translateY + initialOffset;
        layer.element.style.transform = `translate3d(-50%, ${finalTranslateY}px, 0)`;
        layer.element.style.webkitTransform = `translate3d(-50%, ${finalTranslateY}px, 0)`;
      } else {
        // Для інших шарів використовуємо translate3d для кращої продуктивності
        layer.element.style.transform = `translate3d(0, ${translateY}px, 0)`;
        layer.element.style.webkitTransform = `translate3d(0, ${translateY}px, 0)`;
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
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    this.layers.forEach(layer => {
      if (layer.element) {
        layer.element.classList.remove('hero-background--active');
        layer.element.classList.remove('speaky-layer--active');
        layer.element.style.transform = '';
        layer.element.style.webkitTransform = '';
      }
    });
  }
}

export default ParallaxBackground;

