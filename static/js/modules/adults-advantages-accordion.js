/**
 * Adults Advantages Accordion
 * Управління розгортанням/згортанням контенту карток
 */

document.addEventListener('DOMContentLoaded', function () {
  initAdvantagesAccordion();
});

function initAdvantagesAccordion() {
  const toggleButtons = document.querySelectorAll('.advantages-section .advantage-card__toggle');

  toggleButtons.forEach(button => {
    button.addEventListener('click', function (e) {
      e.preventDefault();
      const card = this.closest('.advantage-card');
      const isExpanded = this.getAttribute('aria-expanded') === 'true';

      // Закрити всі інші картки
      toggleButtons.forEach(otherButton => {
        if (otherButton !== button) {
          otherButton.setAttribute('aria-expanded', 'false');
          otherButton.closest('.advantage-card').classList.remove('expanded');
        }
      });

      // Переключити поточну картку
      this.setAttribute('aria-expanded', !isExpanded);
      card.classList.toggle('expanded', !isExpanded);
    });
  });

  // Закрити картку при клику на неї (крім кнопки)
  const cards = document.querySelectorAll('.advantages-section .advantage-card');
  cards.forEach(card => {
    card.addEventListener('click', function (e) {
      // Якщо клік на кнопку - ігнорируємо
      if (e.target.closest('.advantage-card__toggle')) {
        return;
      }

      // Якщо картка розгорнута - закриваємо
      const button = this.querySelector('.advantage-card__toggle');
      if (button.getAttribute('aria-expanded') === 'true') {
        button.click();
      }
    });
  });
}
