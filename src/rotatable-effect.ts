// Rotatable card effect: makes elements with class "rotatable-card" tilt based on mouse position
export function initRotatableCards() {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRotatableCards);
    return;
  }
  const cards = document.querySelectorAll('.rotatable-card');
  cards.forEach(card => {
    // Add listener for mousemove
    card.addEventListener('mousemove', (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left; // x position within the element
      const y = e.clientY - rect.top; // y position within the element
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      // Calculate angle as a proportion of distance from center, max 15 degrees
      const maxAngle = 15;
      const angleX = ((y - centerY) / centerY) * maxAngle; // tilt on X axis (rotate left/right)
      const angleY = ((centerX - x) / centerX) * maxAngle; // tilt on Y axis (rotate up/down)
      // Apply transformation
      card.style.setProperty('--rotate-x', `${angleX}deg`);
      card.style.setProperty('--rotate-y', `${angleY}deg`);
      card.style.transform = `rotateY(${angleY}deg) rotateX(${angleX}deg)`;
    });
    // Reset on mouse leave
    card.addEventListener('mouseleave', () => {
      card.style.removeProperty('--rotate-x');
      card.style.removeProperty('--rotate-y');
      card.style.transform = '';
    });
  });
}
