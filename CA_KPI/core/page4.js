/**
 * page4.js – Interactivité pour la page Méthode SMART
 * Inclut : count-up hero, barre de progression, visualisation des critères,
 * validateur SMART enrichi avec onglets, quiz.
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // Rafraîchir les icônes Lucide après modifications du DOM
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
  const readBar = document.getElementById('p4-read-bar');
  if (readBar) {
    window.addEventListener('scroll', () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const pct = total > 0 ? (window.scrollY / total) * 100 : 0;
      readBar.style.width = Math.min(100, pct) + '%';
    }, { passive: true });
  }

  /* ===== 3. ANIMATION D'ENTRÉE DES CARTES ===== */
  const cards = document.querySelectorAll('.p4-card-animate');
  if (cards.length) {
    const cardObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('p4-visible');
          cardObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.05 });
    cards.forEach(c => cardObs.observe(c));
  }

  /* ===== 4. VISUALISATION DES CRITÈRES AVEC EXEMPLES ===== */
  const critItems = document.querySelectorAll('.p4-crit-item');
  const exampleDiv = document.getElementById('p4-crit-example');
  const examples = {
    S: "Spécifique : l'objectif doit être clair et précis. Exemple : 'Augmenter le CA de la gamme Premium de 15%' plutôt que 'Augmenter les ventes'.",
    M: "Mesurable : on doit pouvoir quantifier. Exemple : 'Atteindre un taux de satisfaction de 95%' (enquête annuelle).",
    A: "Atteignable : réaliste avec les moyens actuels. Exemple : 'Recruter 2 commerciaux avec le budget actuel'.",
    R: "Réaliste : pertinent par rapport à la stratégie. Exemple : 'Baisser les coûts de production après un audit'.",
    T: "Temporel : une échéance précise. Exemple : 'D'ici la fin du 2e trimestre 2026'."
  };
  critItems.forEach(item => {
    item.addEventListener('click', () => {
      critItems.forEach(i => i.classList.remove('p4-crit-active'));
      item.classList.add('p4-crit-active');
      const crit = item.dataset.crit;
      if (examples[crit] && exampleDiv) {
        exampleDiv.innerHTML = `<p><strong>${crit} –</strong> ${examples[crit]}</p>`;
      }
    });
  });

  /* ===== 5. VALIDATEUR SMART AVEC ONGLETS ===== */
  const objectiveInput = document.getElementById('objective');
  const contextTabs = document.querySelectorAll('.p4-context-tab');
  const contextLabel = document.getElementById('p4-context-label');
  const statusS = document.getElementById('p4-status-S');
  const statusM = document.getElementById('p4-status-M');
  const statusA = document.getElementById('p4-status-A');
  const statusR = document.getElementById('p4-status-R');
  const statusT = document.getElementById('p4-status-T');
  const criteriaDivs = {
    S: document.getElementById('p4-crit-S'),
    M: document.getElementById('p4-crit-M'),
    A: document.getElementById('p4-crit-A'),
    R: document.getElementById('p4-crit-R'),
    T: document.getElementById('p4-crit-T')
  };
  const smartResult = document.getElementById('p4-smart-result');
  const suggestionsDiv = document.getElementById('p4-suggestions');

  // Contexte actuel
  let currentContext = 'financier';

  // Mots-clés pour chaque contexte (aide à la validation)
  const contextKeywords = {
    financier: ['ca', 'chiffre d\'affaires', 'marge', 'résultat', 'bénéfice', 'coût', '€', 'euros', 'rentabilité'],
    commercial: ['vente', 'client', 'commande', 'panier', 'conversion', 'taux', 'fidélité'],
    rh: ['recruter', 'embaucher', 'formation', 'absentéisme', 'turnover', 'salarié', 'compétence'],
    marketing: ['notoriété', 'campagne', 'lead', 'acquisition', 'taux d\'ouverture', 'clic']
  };

  // Fonctions de validation (simples, pour la démo)
  function checkSpecific(text) {
    return text.split(' ').length >= 4 && /[a-z]/i.test(text);
  }
  function checkMeasurable(text) {
    return /\d+/.test(text) || /pourcent|%|taux|montant|quantité/i.test(text);
  }
  function checkAchievable(text) {
    return !/(impossible|irréaliste|utopique)/i.test(text);
  }
  function checkRelevant(text, context) {
    const keywords = contextKeywords[context] || [];
    return keywords.some(k => text.toLowerCase().includes(k));
  }
  function checkTimebound(text) {
    return /(d'ici|avant|dans|mois|année|semaine|jour|trimestre|202[4-9])/i.test(text);
  }

  function updateValidation() {
    const text = objectiveInput.value;
    const checks = {
      S: checkSpecific(text),
      M: checkMeasurable(text),
      A: checkAchievable(text),
      R: checkRelevant(text, currentContext),
      T: checkTimebound(text)
    };

    // Mise à jour des statuts et classes
    const statusMap = { S: statusS, M: statusM, A: statusA, R: statusR, T: statusT };
    for (let [key, valid] of Object.entries(checks)) {
      const el = criteriaDivs[key];
      if (el) {
        el.classList.toggle('valid', valid);
        el.classList.toggle('invalid', !valid);
      }
      if (statusMap[key]) {
        statusMap[key].textContent = valid ? '✅' : '❌';
      }
    }

    const allValid = Object.values(checks).every(v => v === true);
    if (allValid) {
      smartResult.innerHTML = '<span style="color: var(--success);">✅ Objectif SMART !</span>';
      suggestionsDiv.classList.remove('active');
    } else {
      smartResult.innerHTML = '<span style="color: var(--danger);">❌ Objectif non SMART. Voir suggestions.</span>';
      // Générer des suggestions
      let suggestions = [];
      if (!checks.S) suggestions.push('• Soyez plus spécifique : précisez quoi, qui, où.');
      if (!checks.M) suggestions.push('• Ajoutez une mesure chiffrée (%, €, nombre).');
      if (!checks.A) suggestions.push('• Vérifiez que l\'objectif est atteignable (évitez les termes "impossible").');
      if (!checks.R) suggestions.push('• Assurez-vous que l\'objectif est pertinent dans votre contexte ' + currentContext + '.');
      if (!checks.T) suggestions.push('• Fixez une échéance temporelle (date, délai).');
      suggestionsDiv.innerHTML = '<strong>Suggestions :</strong><br>' + suggestions.join('<br>');
      suggestionsDiv.classList.add('active');
    }
  }

  objectiveInput.addEventListener('input', updateValidation);

  // Changement de contexte
  contextTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      contextTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentContext = tab.dataset.context;
      contextLabel.textContent = `(ex: ${currentContext})`;
      updateValidation();
    });
  });

  // Initialiser le validateur avec un exemple
  objectiveInput.value = "Augmenter le CA de 15% d'ici fin 2026";
  updateValidation();

  /* ===== 6. QUIZ SUR LES CRITÈRES SMART ===== */
  const quizContainer = document.getElementById('p4-quiz-container');
  const quizQuestions = [
    {
      question: "Lequel de ces énoncés est un objectif SMART ?",
      options: [
        "Améliorer la satisfaction client.",
        "Augmenter le taux de satisfaction de 80% à 90% d'ici décembre 2026.",
        "Faire mieux que l'année dernière."
      ],
      answer: 1,
      explanation: "L'option 2 est spécifique, mesurable (80%→90%), temporelle (décembre 2026)."
    },
    {
      question: "Que signifie le 'A' dans SMART ?",
      options: [
        "Accessible",
        "Atteignable",
        "Ambitieux"
      ],
      answer: 1,
      explanation: "A = Atteignable (ou Achievable en anglais)."
    },
    {
      question: "Pourquoi un objectif doit-il être temporel ?",
      options: [
        "Pour pouvoir le planifier et créer un sentiment d'urgence.",
        "Pour qu'il soit plus long.",
        "Pour qu'il soit plus facile."
      ],
      answer: 0,
      explanation: "Une échéance permet de prioriser et de mesurer l'atteinte dans le temps."
    },
    {
      question: "Lequel de ces objectifs est mesurable ?",
      options: [
        "Améliorer l'image de marque.",
        "Devenir leader sur le marché.",
        "Atteindre un chiffre d'affaires de 2M€ en 2026."
      ],
      answer: 2,
      explanation: "Le chiffre d'affaires est quantifiable."
    }
  ];

  let quizScore = 0;
  let quizAnswered = 0;

  function buildQuiz() {
    if (!quizContainer) return;
    quizContainer.innerHTML = '';
    quizQuestions.forEach((q, idx) => {
      const qDiv = document.createElement('div');
      qDiv.className = 'p4-quiz-question';
      qDiv.id = `quiz-q-${idx}`;
      qDiv.innerHTML = `
        <h4>Question ${idx+1} / ${quizQuestions.length}</h4>
        <p>${q.question}</p>
        <div class="p4-quiz-options" id="quiz-opt-${idx}"></div>
        <div class="p4-quiz-feedback" id="quiz-fb-${idx}"></div>
      `;
      quizContainer.appendChild(qDiv);

      const optsDiv = document.getElementById(`quiz-opt-${idx}`);
      q.options.forEach((opt, optIdx) => {
        const btn = document.createElement('button');
        btn.className = 'p4-quiz-option';
        btn.textContent = opt;
        btn.dataset.qIdx = idx;
        btn.dataset.optIdx = optIdx;
        btn.addEventListener('click', () => handleQuizAnswer(btn, idx, optIdx, q.answer, q.explanation));
        optsDiv.appendChild(btn);
      });
    });
    refreshIcons();
  }

  function handleQuizAnswer(btn, qIdx, optIdx, correctIdx, explanation) {
    const questionDiv = document.getElementById(`quiz-q-${qIdx}`);
    const allBtns = questionDiv.querySelectorAll('.p4-quiz-option');
    const fbDiv = document.getElementById(`quiz-fb-${qIdx}`);

    if (btn.disabled) return;

    allBtns.forEach(b => b.disabled = true);
    const isCorrect = (optIdx === correctIdx);

    if (isCorrect) {
      btn.classList.add('selected-correct');
      questionDiv.classList.add('correct');
      fbDiv.className = 'p4-quiz-feedback show ok';
      fbDiv.textContent = '✅ ' + explanation;
      quizScore++;
    } else {
      btn.classList.add('selected-wrong');
      questionDiv.classList.add('wrong');
      fbDiv.className = 'p4-quiz-feedback show ko';
      fbDiv.textContent = '❌ ' + explanation;
      // Révéler la bonne réponse
      allBtns.forEach(b => {
        if (parseInt(b.dataset.optIdx) === correctIdx) {
          b.classList.add('revealed');
        }
      });
    }
    quizAnswered++;
    if (quizAnswered === quizQuestions.length) {
      showQuizResult();
    }
  }

  function showQuizResult() {
    const finalDiv = document.createElement('div');
    finalDiv.className = 'p4-quiz-score';
    finalDiv.innerHTML = `Score final : ${quizScore} / ${quizQuestions.length}`;
    quizContainer.appendChild(finalDiv);
  }

  buildQuiz();
});