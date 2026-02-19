// core/page6.js – Animations et interactions de la page Exercice
document.addEventListener('DOMContentLoaded', () => {
  // Count-up hero
  const countEls = document.querySelectorAll('[data-count]');
  function runCountUp(el) {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const dur = 1100;
    const t0 = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  if (countEls.length) {
    const countObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        runCountUp(e.target);
        countObs.unobserve(e.target);
      });
    }, { threshold: 0.5 });
    countEls.forEach(el => countObs.observe(el));
  }

  // Barre de progression
  const readBar = document.getElementById('p6-read-bar');
  if (readBar) {
    window.addEventListener('scroll', () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const pct = total > 0 ? (window.scrollY / total) * 100 : 0;
      readBar.style.width = Math.min(100, pct) + '%';
    }, { passive: true });
  }

  // Animation d'entrée de la carte
  const card = document.querySelector('.p6-card-animate');
  if (card) {
    const cardObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('p6-visible');
          cardObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.05 });
    cardObs.observe(card);
  }
});