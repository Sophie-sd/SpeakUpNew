'use strict';

/**
 * Lazy initialization для модулів на головній сторінці
 * Модулі завантажуються динамічно коли секції з'являються у viewport
 */

const lazyModules = [
  {
    selector: '.achievements',
    module: () => import('./modules/counter-animation.js'),
    name: 'Counter Animation'
  },
  {
    selector: '.advantages-carousel',
    module: () => import('./modules/advantages-carousel.js'),
    name: 'Advantages Carousel'
  },
  {
    selector: '.courses-section, .pricing-section',
    module: () => {
      // Визначаємо який модуль завантажити на основі наявних елементів
      if (document.querySelector('.pricing-section')) {
        return import('./modules/pricing-accordion.js');
      }
      return import('./modules/courses-accordion.js');
    },
    name: 'Courses/Pricing Accordion'
  },
  {
    selector: '.testimonials-section',
    module: () => import('./modules/testimonials-carousel.js'),
    name: 'Testimonials Carousel'
  },
  {
    selector: '.faq-section',
    module: () => import('./modules/faq-accordion.js'),
    name: 'FAQ Accordion'
  },
  {
    selector: '.consultation-section',
    module: () => import('./modules/consultation-form.js'),
    name: 'Consultation Form'
  },
  {
    selector: '.testimonials-section',
    module: () => import('./modules/testimonial-modal.js'),
    name: 'Testimonial Modal'
  }
];

// Завантажити parallax та initi відразу (вони критичні для above-the-fold контенту)
async function loadCriticalModules() {
  try {
    const { initParallaxScroll } = await import('./modules/parallax-scroll.js');
    if (initParallaxScroll) initParallaxScroll();
    console.log('[Lazy] Critical module loaded: Parallax Scroll');
  } catch (error) {
    console.error('[Lazy] Error loading critical module:', error);
  }
}

// Інітіалізація lazy loading для інших модулів
function initLazyLoading() {
  const loadedModules = new Set();

  const moduleObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const config = lazyModules.find(m => {
          // Обробка декількох селекторів
          if (m.selector.includes(',')) {
            return m.selector.split(',').some(sel =>
              entry.target.matches(sel.trim())
            );
          }
          return entry.target.matches(m.selector);
        });

        if (config && !loadedModules.has(config.name)) {
          loadedModules.add(config.name);

          config.module()
            .then(module => {
              console.log(`[Lazy] Loaded module: ${config.name}`);

              // Викликати init функцію якщо існує
              if (module.init) {
                module.init();
              }
              // Деякі модулі експортують default як об'єкт з методом init
              else if (module.default && typeof module.default === 'object' && module.default.init) {
                module.default.init();
              }
              // Деякі модулі експортують default функцію
              else if (module.default && typeof module.default === 'function') {
                module.default();
              }
            })
            .catch(error => {
              console.error(`[Lazy] Error loading module ${config.name}:`, error);
            });

          moduleObserver.unobserve(entry.target);
        }
      }
    });
  }, {
    rootMargin: '300px', // Збільшено з 200px - раніше стартує завантаження
    threshold: [0, 0.25]  // Множинні thresholds для кращого тригеру
  });

  // ВИПРАВЛЕНО: перевіряємо viewport ДО додавання observer
  document.addEventListener('DOMContentLoaded', () => {
    lazyModules.forEach(config => {
      const selectors = config.selector.includes(',')
        ? config.selector.split(',').map(s => s.trim())
        : [config.selector];

      selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(element => {
          // Перевірка чи елемент в viewport
          const rect = element.getBoundingClientRect();
          const rootMargin = 300;

          const isInViewport = (
            rect.top < (window.innerHeight + rootMargin) &&
            rect.bottom > -rootMargin &&
            rect.left < (window.innerWidth + rootMargin) &&
            rect.right > -rootMargin
          );

          if (isInViewport && !loadedModules.has(config.name)) {
            // Завантажити ОДРАЗУ
            loadedModules.add(config.name);

            config.module()
              .then(module => {
                console.log(`[Lazy] Loaded module immediately (in viewport): ${config.name}`);

                if (module.init) {
                  module.init();
                } else if (module.default && typeof module.default === 'object' && module.default.init) {
                  module.default.init();
                } else if (module.default && typeof module.default === 'function') {
                  module.default();
                }
              })
              .catch(error => {
                console.error(`[Lazy] Error loading module ${config.name}:`, error);
              });
          } else if (!loadedModules.has(config.name)) {
            // Додати observer для майбутнього
            moduleObserver.observe(element);
          }
        });
      });
    });
  });
}

// Запуск при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Lazy] Initializing lazy loading...');

  // Завантажити критичні модулі одразу
  loadCriticalModules();

  // Ініціалізувати lazy loading для інших
  initLazyLoading();
});

export { loadCriticalModules, initLazyLoading };


