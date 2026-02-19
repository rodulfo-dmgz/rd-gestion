/**
 * page2.js — Interactivité complète de la page "Définition KPI"
 *
 * Ce fichier ne touche qu'aux éléments portant des classes .p2-*
 * Les classes CSS existantes (card, grid-2, info-box...) ne sont jamais
 * manipulées directement — on les lit au plus, jamais on ne les modifie.
 *
 * Modules :
 *   1. Count-up animé dans le hero (chiffres qui s'incrémentent)
 *   2. Barre de progression de lecture
 *   3. Animation d'entrée de .card au scroll (Intersection Observer)
 *   4. Bulles d'exemples au survol des 4 rôles
 *   5. Comparateur interactif Leading / Lagging
 *   6. Quiz Vanity vs Actionable
 *   7. Checklist filtre KPI
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  // Ré-initialiser Lucide après les injections dynamiques de HTML
  const refreshIcons = () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
  };


  /* ============================================================
     1. COUNT-UP HERO
     Anime les chiffres du bandeau statistique (0 → valeur cible).
     On utilise requestAnimationFrame pour une fluidité maximale
     avec un easing ease-out cubique qui ralentit en fin de course.
     ============================================================ */
  const countEls = document.querySelectorAll('[data-count]');

  /**
   * Lance l'animation d'un seul compteur.
   * @param {HTMLElement} el - L'élément à animer
   */
  function runCountUp(el) {
    const target  = parseInt(el.dataset.count, 10);
    const suffix  = el.dataset.suffix || '';
    const dur     = 1200; // durée en ms
    const t0      = performance.now();

    const tick = (now) => {
      // Progression 0→1 bornée
      const progress = Math.min((now - t0) / dur, 1);
      // Easing cubic ease-out : ralentit en approchant de 1
      const eased    = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  // On déclenche les count-up dès que les éléments sont visibles
  if (countEls.length) {
    const countObserver = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        runCountUp(e.target);
        countObserver.unobserve(e.target); // une seule fois
      });
    }, { threshold: 0.5 });

    countEls.forEach(el => countObserver.observe(el));
  }


  /* ============================================================
     2. BARRE DE PROGRESSION DE LECTURE
     Suit le scroll et met à jour la barre en % de page lue.
     La physique est simple : scrollY / (scrollHeight - innerHeight).
     ============================================================ */
  const readBar = document.getElementById('p2-read-bar');

  if (readBar) {
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      const total    = document.documentElement.scrollHeight - window.innerHeight;
      const pct      = total > 0 ? (scrolled / total) * 100 : 0;
      readBar.style.width = Math.min(100, pct).toFixed(1) + '%';
    }, { passive: true }); // passive pour ne pas bloquer le scroll natif
  }


  /* ============================================================
     3. ANIMATION D'ENTRÉE DE LA CARD AU SCROLL
     L'Intersection Observer est préféré à un listener scroll
     car il est déclenché nativement par le navigateur, sans
     calcul JS continu — bien plus performant.
     ============================================================ */
  const cardAnimate = document.querySelector('.p2-card-animate');

  if (cardAnimate) {
    const cardObserver = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('p2-visible');
          cardObserver.unobserve(e.target);
        }
      });
    }, { threshold: 0.05 }); // déclenche dès 5% visible

    cardObserver.observe(cardAnimate);
  }


  /* ============================================================
     4. BULLES D'EXEMPLES AU SURVOL DES 4 RÔLES
     Quand la souris entre dans une tuile de rôle, on injecte
     le texte de l'attribut data-example dans la bulle .p2-hover-example.
     Au départ, la bulle affiche un placeholder invitant au survol.
     ============================================================ */
  const roleTiles = document.querySelectorAll('.p2-role-tile');

  roleTiles.forEach(tile => {
    const bubble    = tile.querySelector('.p2-hover-example');
    const textSpan  = tile.querySelector('.p2-example-text');
    const example   = tile.dataset.example || '';
    const placeholder = 'Survolez pour voir un exemple concret…';

    if (!bubble || !textSpan) return;

    tile.addEventListener('mouseenter', () => {
      textSpan.textContent = example;
      bubble.classList.add('p2-active');
    });

    tile.addEventListener('mouseleave', () => {
      textSpan.textContent = placeholder;
      bubble.classList.remove('p2-active');
    });
  });


  /* ============================================================
     5. COMPARATEUR INTERACTIF LEADING / LAGGING
     Trois scénarios prédéfinis. Un clic sur un onglet remplace
     le contenu du panneau de comparaison par injection HTML.
     L'animation CSS p2FadeIn se re-déclenche grâce à la technique
     "retire puis replace" de la classe sur l'élément.
     ============================================================ */

  /** Données des scénarios : chacun décrit la même situation
      vue par un Lagging et par un Leading indicator. */
const scenarios = {
  ventes: {
    lagging: {
      title: `CA du mois : −18 %`,
      text: `En fin de mois, le rapport indique un chiffre d'affaires en baisse de 18 %. Il ne reste plus qu'à constater la perte. Les commandes ont été passées, les stocks achetés, les charges engagées. Il est trop tard pour changer le mois en cours.`,
      note: `Action possible : planifier le mois prochain`
    },
    leading: {
      title: `Devis envoyés : −40 % cette semaine`,
      text: `En milieu de mois, l'indicateur du nombre de devis hebdomadaires chute de 40 %. C'est le signal que le CA va baisser dans 3 à 4 semaines. Il est encore temps de relancer les prospects, de booster les actions commerciales, d'agir maintenant.`,
      note: `Action possible : réactivation commerciale immédiate`
    }
  },
  clients: {
    lagging: {
      title: `Taux de churn annuel : 22 %`,
      text: `À la fin de l'exercice, l'analyse révèle que 22 % des clients n'ont pas renouvelé. Ils sont partis — souvent en silence, sans se plaindre. L'entreprise n'a aucune information sur pourquoi ils sont partis ni quand le processus de désengagement a commencé.`,
      note: `Action possible : enquête post-départ (souvent sans retour)`
    },
    leading: {
      title: `Score NPS semaine : 5,8 / 10 (en baisse)`,
      text: `Le NPS hebdomadaire passe de 7,2 à 5,8 en deux semaines. Statistiquement, un NPS sous 6 précède un pic de churn de 60 à 90 jours. L'équipe client peut contacter les détracteurs cette semaine, avant que la décision de partir soit prise.`,
      note: `Action possible : appels de rétention ciblés immédiatement`
    }
  },
  tresorerie: {
    lagging: {
      title: `Découvert bancaire : −2 400 €`,
      text: `Le 1er du mois, le relevé bancaire affiche un solde négatif. Les fournisseurs ont déjà envoyé leurs relances. La banque facture des agios. La crise est là, réelle et immédiate. Le gérant subit une situation que des semaines de décisions ont créée.`,
      note: `Action possible : négociation d'urgence avec la banque`
    },
    leading: {
      title: `Jours de cash restants : 18 jours (seuil 30)`,
      text: `En cours de mois, l'indicateur "jours de cash disponibles" passe sous le seuil d'alerte de 30 jours. Il reste 18 jours de liquidités au rythme actuel. Le dirigeant peut accélérer ses relances clients, reporter une commande fournisseur, activer une ligne de crédit court terme.`,
      note: `Action possible : 3 leviers activables sous 48 h`
    }
  }
};

  const tabs     = document.querySelectorAll('.p2-comp-tab');
  const compBody = document.getElementById('p2-comp-body');

  /**
   * Injecte le HTML d'un scénario dans le panneau comparateur.
   * La classe d'animation est retirée puis ré-appliquée après
   * un micro-délai pour déclencher à nouveau le keyframe CSS.
   * @param {string} key - clé du scénario dans l'objet scenarios
   */
  function renderScenario(key) {
    if (!compBody || !scenarios[key]) return;
    const s = scenarios[key];

    compBody.innerHTML = `
      <div class="p2-comp-cell lagging">
        <div class="p2-comp-cell-lbl">
          <i data-lucide="history"></i> Lagging — Ce qu'il constate
        </div>
        <div class="p2-comp-cell-title">${s.lagging.title}</div>
        <div class="p2-comp-cell-text">
          ${s.lagging.text}
          <em><i data-lucide="arrow-right" style="width:12px;height:12px;stroke:currentColor;vertical-align:middle;"></i> ${s.lagging.note}</em>
        </div>
      </div>
      <div class="p2-comp-cell leading">
        <div class="p2-comp-cell-lbl">
          <i data-lucide="telescope"></i> Leading — Ce qu'il permet
        </div>
        <div class="p2-comp-cell-title">${s.leading.title}</div>
        <div class="p2-comp-cell-text">
          ${s.leading.text}
          <em><i data-lucide="arrow-right" style="width:12px;height:12px;stroke:currentColor;vertical-align:middle;"></i> ${s.leading.note}</em>
        </div>
      </div>
    `;

    // Re-déclencher l'animation fade-in CSS en forçant un reflow
    compBody.style.animation = 'none';
    void compBody.offsetWidth; // force le navigateur à recalculer le style
    compBody.style.animation  = 'p2FadeIn .3s ease both';

    refreshIcons();
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderScenario(tab.dataset.scenario);
    });
  });

  // Afficher le scénario "ventes" par défaut au chargement
  renderScenario('ventes');


  /* ============================================================
     6. QUIZ VANITY vs ACTIONABLE
     5 questions injectées dynamiquement. Chaque question est
     un objet avec l'énoncé, la bonne réponse ('vanity' ou 'action')
     et les feedbacks explicatifs dans les deux cas.
     Le score est mis à jour après chaque réponse.
     ============================================================ */

  /** Base de questions du quiz */
const questions = [
    {
      stmt: `10 000 abonnés Instagram gagnés en un mois`,
      answer: `vanity`,
      okMsg: `Exact. Des abonnés sans conversion ne génèrent pas de revenus. Un vrai KPI serait : "Taux de conversion Instagram → achat = 1,4 %".`,
      failMsg: `C'est bien une Vanity Metric. Sans taux de conversion associé, ce chiffre ne dit rien sur l'impact business réel.`
    },
    {
      stmt: `Coût d'acquisition client (CAC) ce mois : 87 €`,
      answer: `action`,
      okMsg: `Parfait. Le CAC est un KPI actionnable : s'il monte au-delà du seuil rentable, vous pouvez agir sur vos canaux d'acquisition dès la semaine prochaine.`,
      failMsg: `C'est un vrai KPI. Le CAC mesure directement la rentabilité de votre acquisition et déclenche des décisions concrètes sur vos budgets marketing.`
    },
    {
      stmt: `500 000 impressions sur une campagne display`,
      answer: `vanity`,
      okMsg: `Bien vu. Les impressions mesurent la diffusion, pas l'impact. Le vrai KPI serait le taux de clic ou, mieux, le coût par lead qualifié généré.`,
      failMsg: `C'est une Vanity Metric. Les impressions flattent l'ego mais ne permettent aucune décision concrète sans les taux de conversion associés.`
    },
    {
      stmt: `Taux de marge brute : 52 % (objectif 58 %)`,
      answer: `action`,
      okMsg: `Excellent. La marge brute avec un objectif défini est un KPI de pilotage pur : elle déclenche une analyse des coûts d'achat ou une révision de tarif.`,
      failMsg: `C'est bien un KPI actionnable. Un écart de marge par rapport à l'objectif est exactement ce qui doit orienter une décision de prix ou de sourcing.`
    },
    {
      stmt: `Nombre de mentions de la marque sur Twitter`,
      answer: `vanity`,
      okMsg: `Correct. Sauf si les mentions sont qualifiées (sentiment, leads générés), elles restent une Vanity Metric — un bruit de fond sans impact décisionnel direct.`,
      failMsg: `C'est une Vanity Metric. Le volume de mentions ne dit pas si elles sont positives, si elles génèrent des visites ou des ventes. Sans qualification, ce n'est pas pilotable.`
    }
  ];
  
  const quizContainer = document.getElementById('p2-quiz-questions');
  const quizFinal     = document.getElementById('p2-quiz-final');
  const scoreEl       = document.getElementById('p2-score');
  const totalEl       = document.getElementById('p2-total');
  const progBar       = document.getElementById('p2-quiz-prog');

  let score    = 0;
  let answered = 0;

  // Initialiser le total affiché
  if (totalEl) totalEl.textContent = questions.length;

  /**
   * Construit et injecte toutes les cartes de questions dans le DOM.
   * Chaque carte est indépendante — répondre à l'une ne bloque pas les autres.
   */
  function buildQuiz() {
    if (!quizContainer) return;
    quizContainer.innerHTML = '';
    score = 0; answered = 0;
    if (scoreEl) scoreEl.textContent = '0';
    if (progBar) progBar.style.width = '0%';
    if (quizFinal) quizFinal.style.display = 'none';

    questions.forEach((q, idx) => {
      const card = document.createElement('div');
      card.className = 'p2-q-card';
      card.innerHTML = `
        <div class="p2-q-stmt">
          <i data-lucide="tag"></i>
          <span>${q.stmt}</span>
        </div>
        <div class="p2-q-actions">
          <button class="p2-q-btn vanity" data-idx="${idx}" data-choice="vanity">
            <i data-lucide="x-circle"></i> Vanity Metric
          </button>
          <button class="p2-q-btn action" data-idx="${idx}" data-choice="action">
            <i data-lucide="check-circle"></i> Vrai KPI
          </button>
        </div>
        <div class="p2-q-feedback" id="feedback-${idx}"></div>
      `;
      quizContainer.appendChild(card);
    });

    refreshIcons();
    attachQuizListeners();
  }

  /**
   * Attache les écouteurs de clic sur les boutons de réponse.
   * La délégation d'événements est utilisée sur le container
   * pour éviter de re-binder après chaque injection.
   */
  function attachQuizListeners() {
    if (!quizContainer) return;
    quizContainer.addEventListener('click', handleQuizClick);
  }

  /**
   * Gère un clic de réponse.
   * @param {Event} e
   */
  function handleQuizClick(e) {
    const btn = e.target.closest('.p2-q-btn');
    if (!btn || btn.disabled) return;

    const idx      = parseInt(btn.dataset.idx, 10);
    const choice   = btn.dataset.choice;
    const q        = questions[idx];
    const card     = btn.closest('.p2-q-card');
    const feedback = document.getElementById(`feedback-${idx}`);

    // Bloquer les deux boutons de cette question
    card.querySelectorAll('.p2-q-btn').forEach(b => (b.disabled = true));

    const isCorrect = choice === q.answer;

    // Styliser le bouton choisi selon le résultat
    btn.classList.add(isCorrect ? 'p2-selected-ok' : 'p2-selected-fail');

    // Si faux, montrer aussi quel était le bon choix
    if (!isCorrect) {
      const correctBtn = card.querySelector(`.p2-q-btn[data-choice="${q.answer}"]`);
      if (correctBtn) correctBtn.classList.add('p2-selected-ok');
    }

    // Styler la carte entière
    card.classList.add(isCorrect ? 'p2-correct' : 'p2-wrong');

    // Afficher le feedback explicatif
    if (feedback) {
      feedback.textContent = isCorrect ? q.okMsg : q.failMsg;
      feedback.className = `p2-q-feedback show ${isCorrect ? 'fb-ok' : 'fb-fail'}`;
    }

    // Mettre à jour le score et la progression
    if (isCorrect) score++;
    answered++;
    if (scoreEl) scoreEl.textContent = score;
    if (progBar) progBar.style.width = ((answered / questions.length) * 100) + '%';

    // Afficher le résultat final quand toutes les questions sont répondues
    if (answered === questions.length) showFinalResult();
  }

  /**
   * Construit et affiche le panneau de résultat final.
   * Le message varie selon le score obtenu.
   */
  function showFinalResult() {
    if (!quizFinal) return;
    quizFinal.style.display = 'block';

    // Message adapté au score — on contextualise pédagogiquement
    let icon, title, msg;
    if (score === questions.length) {
      icon  = 'trophy';
      title = 'Score parfait !';
      msg   = `Vous maîtrisez parfaitement la distinction Vanity / Actionable. Vous êtes prêt(e) à auditer le tableau de bord de votre entreprise.`;
    } else if (score >= questions.length - 1) {
      icon  = 'star';
      title = 'Excellente maîtrise !';
      msg   = `${score} / ${questions.length} — Presque parfait. Relisez les feedbacks des questions manquées pour consolider votre analyse.`;
    } else if (score >= Math.ceil(questions.length / 2)) {
      icon  = 'award';
      title = 'Bonne base !';
      msg   = `${score} / ${questions.length} — Vous avez les fondamentaux. Reprenez les exemples manqués, la distinction devient naturelle avec la pratique.`;
    } else {
      icon  = 'refresh-cw';
      title = 'À retravailler…';
      msg   = `${score} / ${questions.length} — La distinction Vanity/Actionable est subtile. Relisez les feedbacks attentivement, puis retentez le quiz.`;
    }

    quizFinal.innerHTML = `
      <i data-lucide="${icon}"></i>
      <h3>${title}</h3>
      <p>${msg}</p>
      <button class="btn btn-secondary" id="p2-restart-btn" style="display:inline-flex; align-items:center; gap:7px;">
        <i data-lucide="rotate-ccw"></i> Recommencer le quiz
      </button>
    `;

    refreshIcons();

    document.getElementById('p2-restart-btn')?.addEventListener('click', () => {
      // Détacher l'ancien listener avant de reconstruire
      quizContainer.removeEventListener('click', handleQuizClick);
      buildQuiz();
    });
  }

  // Lancement initial du quiz
  buildQuiz();


  /* ============================================================
     7. CHECKLIST FILTRE KPI
     Trois cases à cocher. Quand les trois sont cochées,
     le panneau de validation apparaît avec une animation CSS.
     Chaque case colorie aussi son étape (numéro + bordure).
     ============================================================ */
  const checkboxes   = document.querySelectorAll('.p2-chk');
  const filterResult = document.getElementById('p2-filter-result');

  checkboxes.forEach(chk => {
    chk.addEventListener('change', () => {
      // Mettre à jour l'aspect visuel de l'étape correspondante
      const step = chk.closest('.p2-filter-step-card');
      if (step) step.classList.toggle('p2-step-done', chk.checked);

      // Vérifier si toutes les cases sont cochées
      const allChecked = [...checkboxes].every(c => c.checked);

      if (filterResult) {
        if (allChecked) {
          filterResult.style.display = 'flex';
          // Forcer un reflow pour rejouer l'animation d'apparition
          void filterResult.offsetWidth;
          filterResult.style.animation = 'p2FadeIn .4s ease both';
          refreshIcons();
        } else {
          filterResult.style.display = 'none';
        }
      }
    });
  });

});