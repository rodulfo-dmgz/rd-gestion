/**
 * page5.js – Interactivité pour la page "Cercles de contrôle"
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const refreshIcons = () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
  };

  /* ===== 1. COUNT-UP HERO ===== */
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

  /* ===== 2. BARRE DE PROGRESSION ===== */
  const readBar = document.getElementById('p5-read-bar');
  if (readBar) {
    window.addEventListener('scroll', () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const pct = total > 0 ? (window.scrollY / total) * 100 : 0;
      readBar.style.width = Math.min(100, pct) + '%';
    }, { passive: true });
  }

  /* ===== 3. ANIMATION D'ENTRÉE DE LA CARTE ===== */
  const card = document.querySelector('.p5-card-animate');
  if (card) {
    const cardObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('p5-visible');
          cardObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.05 });
    cardObs.observe(card);
  }

  /* ===== 4. INTERACTION AVEC LES CERCLES ===== */
  const circles = document.querySelectorAll('.p5-circle');
  const explanationDiv = document.getElementById('p5-circle-explanation');
  const infoTiles = document.querySelectorAll('.p5-info-tile');
  const circleDetails = {
    inner: {
      title: 'Cercle interne – Contrôle total',
      text: 'Vous maîtrisez directement : saisie des factures, lettrage, relances, conditions de paiement. Ce sont vos leviers d\'action immédiats.'
    },
    middle: {
      title: 'Cercle médian – Influence',
      text: 'Vous pouvez influencer : comportement des clients, motivation de l\'équipe, politique de crédit. Agissez sur ces leviers pour améliorer le DMP.'
    },
    outer: {
      title: 'Cercle externe – Hors contrôle',
      text: 'Vous subissez : taux de TVA, inflation, législation, santé des clients. À surveiller mais ne pas tenter de changer directement.'
    }
  };

  circles.forEach(circle => {
    circle.addEventListener('click', () => {
      // Désactiver tous les cercles et tuiles
      circles.forEach(c => c.classList.remove('p5-active'));
      infoTiles.forEach(t => t.classList.remove('p5-highlighted'));

      // Activer le cercle cliqué
      circle.classList.add('p5-active');
      const type = circle.dataset.circle;
      if (type && circleDetails[type]) {
        explanationDiv.innerHTML = `<h4>${circleDetails[type].title}</h4><p>${circleDetails[type].text}</p>`;
      }

      // Activer la tuile correspondante
      infoTiles.forEach(tile => {
        if (tile.dataset.circle === type) {
          tile.classList.add('p5-highlighted');
        }
      });
    });
  });

  /* ===== 5. QUIZ ===== */
  const quizQuestions = [
    {
      question: "Dans l'exemple du Délai Moyen de Paiement (DMP), lequel de ces éléments fait partie du cercle interne (contrôle total) ?",
      options: [
        "La législation sur les délais de paiement",
        "L'envoi des relances clients",
        "L'inflation"
      ],
      answer: 1,
      ok: "Exact ! L'envoi des relances est une action que vous maîtrisez directement.",
      fail: "Non, la bonne réponse est 'L'envoi des relances clients'. Les autres sont hors contrôle."
    },
    {
      question: "Que signifie le cercle médian (influence) ?",
      options: [
        "Des actions sur lesquelles vous n'avez aucune prise",
        "Des éléments que vous pouvez influencer indirectement, comme le comportement des clients",
        "Des décisions stratégiques que vous prenez seul"
      ],
      answer: 1,
      ok: "Parfait. Le cercle médian regroupe ce que vous pouvez influencer sans le contrôler totalement.",
      fail: "La bonne réponse est : 'Des éléments que vous pouvez influencer indirectement, comme le comportement des clients'."
    },
    {
      question: "Pourquoi est-il inefficace de se focaliser sur le cercle externe ?",
      options: [
        "Parce qu'il contient des éléments que vous ne pouvez pas changer",
        "Parce qu'il est moins important",
        "Parce qu'il est trop complexe"
      ],
      answer: 0,
      ok: "Exact. Se plaindre de ce qu'on ne peut pas changer est une perte d'énergie. Mieux vaut agir sur l'interne et l'influence.",
      fail: "La bonne réponse est : 'Parce qu'il contient des éléments que vous ne pouvez pas changer'."
    }
  ];

  const quizBody = document.getElementById('p5-quiz-body');
  const quizFinal = document.getElementById('p5-quiz-final');
  const scoreEl = document.getElementById('p5-score');
  const progFill = document.getElementById('p5-quiz-fill');

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
      card.className = 'p5-quiz-question';
      card.id = `p5-q-${qi}`;
      const optionsHtml = q.options.map((opt, optIdx) =>
        `<button class="p5-quiz-option" data-qi="${qi}" data-opt="${optIdx}">${opt}</button>`
      ).join('');
      card.innerHTML = `
        <h4>Question ${qi+1} / ${quizQuestions.length}</h4>
        <p>${q.question}</p>
        <div class="p5-quiz-options">${optionsHtml}</div>
        <div class="p5-quiz-feedback" id="p5-fb-${qi}"></div>
      `;
      quizBody.appendChild(card);
    });

    refreshIcons();
    document.querySelectorAll('.p5-quiz-option').forEach(btn => {
      btn.addEventListener('click', handleQuizClick);
    });
  }

  function handleQuizClick(e) {
    const btn = e.target;
    if (btn.disabled) return;
    const qi = parseInt(btn.dataset.qi, 10);
    const optIdx = parseInt(btn.dataset.opt, 10);
    const q = quizQuestions[qi];
    const card = document.getElementById(`p5-q-${qi}`);
    const fb = document.getElementById(`p5-fb-${qi}`);
    const allBtns = card.querySelectorAll('.p5-quiz-option');

    allBtns.forEach(b => b.disabled = true);
    const isCorrect = optIdx === q.answer;

    btn.classList.add(isCorrect ? 'selected-correct' : 'selected-wrong');
    if (!isCorrect) {
      // Révéler la bonne réponse
      allBtns.forEach(b => {
        if (parseInt(b.dataset.opt, 10) === q.answer) {
          b.classList.add('revealed');
        }
      });
    }

    card.classList.add(isCorrect ? 'correct' : 'wrong');
    fb.textContent = isCorrect ? q.ok : q.fail;
    fb.className = `p5-quiz-feedback show ${isCorrect ? 'ok' : 'ko'}`;

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
      message = '🎉 Félicitations ! Vous maîtrisez parfaitement les cercles de contrôle.';
    } else if (qScore >= 2) {
      message = `👍 Bon score : ${qScore}/${quizQuestions.length}. Revoyez les explications pour consolider.`;
    } else {
      message = `📚 Score : ${qScore}/${quizQuestions.length}. Nous vous conseillons de relire la partie théorique.`;
    }
    quizFinal.innerHTML = `<p>${message}</p><button class="btn btn-secondary" id="p5-restart-quiz">Recommencer</button>`;
    document.getElementById('p5-restart-quiz').addEventListener('click', () => {
      buildQuiz();
      quizBody.scrollIntoView({ behavior: 'smooth' });
    });
  }

  buildQuiz();
  refreshIcons();
});