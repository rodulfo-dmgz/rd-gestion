// core/page7.js – Interactivité pour la page Sources de données
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
  const readBar = document.getElementById('p7-read-bar');
  if (readBar) {
    window.addEventListener('scroll', () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const pct = total > 0 ? (window.scrollY / total) * 100 : 0;
      readBar.style.width = Math.min(100, pct) + '%';
    }, { passive: true });
  }

  // Animation d'entrée de la carte
  const card = document.querySelector('.p7-card-animate');
  if (card) {
    const cardObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('p7-visible');
          cardObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.05 });
    cardObs.observe(card);
  }

  // Démo interactive
  const sourceSelect = document.getElementById('source-select');
  const sourceExample = document.getElementById('source-example');
  if (sourceSelect) {
    sourceSelect.addEventListener('change', () => {
      const val = sourceSelect.value;
      if (val === 'insee') {
        sourceExample.textContent = 'KPI : Taux de marge moyen du secteur = 28,4% (source INSEE 2025).';
      } else {
        sourceExample.textContent = 'KPI : Délai moyen de paiement fournisseur = 52 jours (Banque de France).';
      }
    });
  }

  // Quiz
  const quizQuestions = [
    {
      question: "Quelle est la source interne pour suivre les stocks ?",
      options: ["CRM", "ERP", "Logiciel de paie"],
      answer: 1,
      ok: "Exact. L'ERP gère les stocks.",
      fail: "Non, c'est l'ERP qui contient les données de stocks."
    },
    {
      question: "Quel organisme public fournit des données sectorielles gratuites ?",
      options: ["INSEE", "Google Analytics", "Facebook"],
      answer: 0,
      ok: "Bravo ! L'INSEE est une source fiable.",
      fail: "La bonne réponse est INSEE."
    },
    {
      question: "Le CRM est utile pour quel type de KPI ?",
      options: ["KPI financiers", "KPI commerciaux", "KPI RH"],
      answer: 1,
      ok: "Parfait, le CRM sert surtout aux indicateurs commerciaux.",
      fail: "Le CRM est dédié à la relation client, donc aux KPI commerciaux."
    }
  ];

  const quizBody = document.getElementById('p7-quiz-body');
  const quizFinal = document.getElementById('p7-quiz-final');
  const scoreEl = document.getElementById('p7-score');
  const progFill = document.getElementById('p7-quiz-fill');

  let qScore = 0;
  let qAnswered = 0;

  function buildQuiz() {
    if (!quizBody) return;
    quizBody.innerHTML = '';
    qScore = 0; qAnswered = 0;
    if (scoreEl) scoreEl.textContent = '0';
    if (progFill) progFill.style.width = '0%';
    if (quizFinal) quizFinal.style.display = 'none';

    quizQuestions.forEach((q, qi) => {
      const card = document.createElement('div');
      card.className = 'p7-quiz-question';
      card.id = `p7-q-${qi}`;
      const optionsHtml = q.options.map((opt, optIdx) =>
        `<button class="p7-quiz-option" data-qi="${qi}" data-opt="${optIdx}">${opt}</button>`
      ).join('');
      card.innerHTML = `
        <h4>Question ${qi+1} / ${quizQuestions.length}</h4>
        <p>${q.question}</p>
        <div class="p7-quiz-options">${optionsHtml}</div>
        <div class="p7-quiz-feedback" id="p7-fb-${qi}"></div>
      `;
      quizBody.appendChild(card);
    });

    document.querySelectorAll('.p7-quiz-option').forEach(btn => {
      btn.addEventListener('click', handleQuizClick);
    });
  }

  function handleQuizClick(e) {
    const btn = e.target;
    if (btn.disabled) return;
    const qi = parseInt(btn.dataset.qi, 10);
    const optIdx = parseInt(btn.dataset.opt, 10);
    const q = quizQuestions[qi];
    const card = document.getElementById(`p7-q-${qi}`);
    const fb = document.getElementById(`p7-fb-${qi}`);
    const allBtns = card.querySelectorAll('.p7-quiz-option');

    allBtns.forEach(b => b.disabled = true);
    const isCorrect = optIdx === q.answer;

    btn.classList.add(isCorrect ? 'selected-correct' : 'selected-wrong');
    if (!isCorrect) {
      allBtns.forEach(b => {
        if (parseInt(b.dataset.opt, 10) === q.answer) {
          b.classList.add('revealed');
        }
      });
    }

    card.classList.add(isCorrect ? 'correct' : 'wrong');
    fb.textContent = isCorrect ? q.ok : q.fail;
    fb.className = `p7-quiz-feedback show ${isCorrect ? 'ok' : 'ko'}`;

    if (isCorrect) qScore++;
    qAnswered++;
    if (scoreEl) scoreEl.textContent = qScore;
    if (progFill) progFill.style.width = ((qAnswered / quizQuestions.length) * 100) + '%';

    if (qAnswered === quizQuestions.length) showQuizResult();
  }

  function showQuizResult() {
    if (!quizFinal) return;
    quizFinal.style.display = 'block';
    let message = '';
    if (qScore === quizQuestions.length) {
      message = '🎉 Félicitations ! Vous maîtrisez les sources de données.';
    } else if (qScore >= 2) {
      message = `👍 Bon score : ${qScore}/${quizQuestions.length}. Relisez les explications.`;
    } else {
      message = `📚 Score : ${qScore}/${quizQuestions.length}. Revenez sur la partie théorique.`;
    }
    quizFinal.innerHTML = `<p>${message}</p><button class="btn btn-secondary" id="p7-restart-quiz">Recommencer</button>`;
    document.getElementById('p7-restart-quiz').addEventListener('click', () => {
      buildQuiz();
      quizBody.scrollIntoView({ behavior: 'smooth' });
    });
  }

  buildQuiz();
});