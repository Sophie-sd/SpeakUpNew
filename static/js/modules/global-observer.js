'use strict';

/**
 * Global Intersection Observer - один Observer для всіх секцій
 * Оптимізація: замість багатьох Observers використовуємо один з Map callbacks
 */
const callbacks = new Map();

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const callback = callbacks.get(entry.target);
    if (callback) {
      callback(entry);
    }
  });
}, {
  rootMargin: '50px',
  threshold: 0.1
});

/**
 * Реєструє елемент для спостереження
 * @param {Element} element - Елемент для спостереження
 * @param {Function} callback - Callback функція (entry) => void
 */
export function observe(element, callback) {
  if (!element || typeof callback !== 'function') {
    console.warn('[GlobalObserver] Invalid element or callback');
    return;
  }
  callbacks.set(element, callback);
  observer.observe(element);
}

/**
 * Прибирає елемент зі спостереження
 * @param {Element} element - Елемент для видалення
 */
export function unobserve(element) {
  if (!element) return;
  callbacks.delete(element);
  observer.unobserve(element);
}

/**
 * Очищає всі callbacks (для cleanup)
 */
export function disconnect() {
  callbacks.clear();
  observer.disconnect();
}

export default { observe, unobserve, disconnect };

