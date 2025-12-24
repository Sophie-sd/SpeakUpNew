'use strict';

export function initRunningLine() {
  const runningLine = document.querySelector('[data-running-line]');
  if (!runningLine) return;

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

