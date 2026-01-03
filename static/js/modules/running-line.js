'use strict';

export function initRunningLine() {
  const runningLine = document.querySelector('[data-running-line]');
  if (!runningLine) return;

  // Intersection Observer для will-change оптимізації
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Видимий - додати will-change та показати
        runningLine.classList.add('running-line--visible');
        runningLine.classList.remove('running-line--hidden');
      } else {
        // Невидимий - видалити will-change
        runningLine.classList.remove('running-line--visible');
      }
    });
  }, {
    rootMargin: '50px' // Почати оптимізацію трохи раніше
  });

  observer.observe(runningLine);

  let lastScroll = 0;
  let ticking = false;

  const handleScroll = () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > lastScroll && currentScroll > 100) {
      // Скрол вниз - ховати
      runningLine.classList.add('running-line--hidden');
    } else {
      // Скрол вгору - показати
      runningLine.classList.remove('running-line--hidden');
    }

    lastScroll = currentScroll;
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(handleScroll);
      ticking = true;
    }
  }, { passive: true });
}





