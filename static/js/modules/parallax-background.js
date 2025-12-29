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

    // Динамічна висота контенту
    this.contentElement = document.querySelector('.hero-content');
    this.contentHeight = 0;
    this.resizeObserver = null;
    this.resizeObserverTimeout = null;
    this.cachedAdaptiveSpeed = new Map(); // Кеш адаптивних швидкостей

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

    // ResizeObserver для відстеження змін висоти контенту (для адаптивної швидкості)
    this.setupResizeObserver();

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

  setupResizeObserver() {
    if (!this.contentElement) return;

    this.resizeObserver = new ResizeObserver(() => {
      // Debounce для продуктивності (150ms, як для resize listener)
      if (this.resizeObserverTimeout) {
        clearTimeout(this.resizeObserverTimeout);
      }
      this.resizeObserverTimeout = setTimeout(() => {
        // Оновити висоту контенту для адаптивної швидкості
        this.contentHeight = this.contentElement.offsetHeight;
        // Очистити кеш адаптивних швидкостей при зміні висоти
        this.cachedAdaptiveSpeed.clear();
      }, 150);
    });

    this.resizeObserver.observe(this.contentElement);
    // Початкова висота контенту
    this.contentHeight = this.contentElement.offsetHeight;
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

  calculateAdaptiveSpeed(baseSpeed) {
    if (!this.contentHeight) return baseSpeed;

    const viewportHeight = window.innerHeight;
    const contentHeightVh = this.contentHeight / viewportHeight;
    const thresholdVh = 3; // 300vh = 3 viewport heights

    // Якщо контент ≤ 300vh, використовуємо оригінальну швидкість
    if (contentHeightVh <= thresholdVh) {
      return baseSpeed;
    }

    // Лінійне зменшення: для кожних 100vh понад 300vh зменшуємо на 10%
    const excessVh = contentHeightVh - thresholdVh;
    const reductionFactor = Math.min(excessVh * 0.1, 0.7); // Максимум 70% зменшення (мінімум 30%)
    const adaptiveSpeed = baseSpeed * (1 - reductionFactor);

    return Math.max(adaptiveSpeed, baseSpeed * 0.3); // Мінімум 30% від базової
  }

  update() {
    // Використовуємо правильне обчислення скролу
    this.scrollY = Math.max(
      window.pageYOffset || window.scrollY || 0,
      document.documentElement.scrollTop || 0
    );

    // НЕ обмежуємо scrollY - дозволяємо браузеру самому визначати максимальний скрол
    // Це запобігає створенню зайвого простору через неправильне обчислення висоти

    this.layers.forEach(layer => {
      if (!layer.isActive) return;

      // Адаптивна швидкість на основі висоти контенту
      let adaptiveSpeed = layer.speed;
      if (this.contentHeight > 0) {
        // Кешування адаптивної швидкості
        if (!this.cachedAdaptiveSpeed.has(layer.element)) {
          adaptiveSpeed = this.calculateAdaptiveSpeed(layer.speed);
          this.cachedAdaptiveSpeed.set(layer.element, adaptiveSpeed);
        } else {
          adaptiveSpeed = this.cachedAdaptiveSpeed.get(layer.element);
        }
      }

      // Мобільні пристрої: зменшити швидкість на 50%
      const speedMultiplier = this.isMobile ? 0.5 : 1;
      const effectiveSpeed = adaptiveSpeed * speedMultiplier;

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
    if (this.resizeObserverTimeout) {
      clearTimeout(this.resizeObserverTimeout);
    }
    if (this.resizeObserver && this.contentElement) {
      this.resizeObserver.unobserve(this.contentElement);
      this.resizeObserver.disconnect();
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

