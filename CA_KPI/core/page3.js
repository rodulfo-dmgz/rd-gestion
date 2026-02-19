/**
 * page3.js — Interactivité complète de la page "Comment calculer un KPI ?"
 *
 * PRINCIPE FONDAMENTAL :
 * Ce fichier respecte scrupuleusement les id et classes existants.
 * Les id "ca", "achats", "marge" sont conservés et utilisés.
 * La fonction globale calculerMarge() reste déclarée dans le HTML,
 * elle délègue maintenant à window.p3Calculer() défini ici.
 *
 * ARCHITECTURE DES MODULES :
 *   1. Count-up animé dans le hero
 *   2. Barre de progression de lecture
 *   3. Animation d'entrée de .card (Intersection Observer)
 *   4. Visualisation des 3 niveaux — clic sur un niveau
 *      met en surbrillance la tuile .info-box correspondante
 *   5. Calculateur multi-formules (4 modes)
 *      - Marge brute    (formule originale conservée, id "ca"/"achats"/"marge")
 *      - Taux de marge  (nouveaux champs injectés dynamiquement)
 *      - BFR            (3 champs)
 *      - CAC            (2 champs)
 *   6. Historique des calculs (5 derniers)
 *   7. Analyse contextuelle du résultat
 *   8. Quiz "Reconnaissez-vous la bonne formule ?"
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  // Raccourci pour ré-initialiser les icônes Lucide après injection HTML
  const refreshIcons = () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
  };


  /* ============================================================
     1. COUNT-UP HERO
     Même implémentation que page2 : requestAnimationFrame
     avec un easing cubic ease-out.
     ============================================================ */
  const countEls = document.querySelectorAll('[data-count]');

  function runCountUp(el) {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const dur    = 1100;
    const t0     = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - t0) / dur, 1);
      // Easing cubic ease-out — ralentit en approchant de la valeur cible
      const eased    = 1 - Math.pow(1 - progress, 3);
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
        countObs.unobserve(e.target); // ne s'anime qu'une seule fois
      });
    }, { threshold: 0.5 });
    countEls.forEach(el => countObs.observe(el));
  }


  /* ============================================================
     2. BARRE DE PROGRESSION DE LECTURE
     Scroll passif pour ne pas bloquer le rendering.
     ============================================================ */
  const readBar = document.getElementById('p3-read-bar');
  if (readBar) {
    window.addEventListener('scroll', () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const pct   = total > 0 ? (window.scrollY / total) * 100 : 0;
      readBar.style.width = Math.min(100, pct).toFixed(1) + '%';
    }, { passive: true });
  }


  /* ============================================================
     3. ANIMATION D'ENTRÉE DE .card
     Intersection Observer : déclenche dès que 5 % de la carte
     est visible à l'écran (threshold 0.05).
     ============================================================ */
  const cardAnimate = document.querySelector('.p3-card-animate');
  if (cardAnimate) {
    const cardObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('p3-visible');
          cardObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.05 });
    cardObs.observe(cardAnimate);
  }


  /* ============================================================
     4. VISUALISATION DES 3 NIVEAUX
     Un clic sur un bloc de la barre de visualisation :
       a) Active visuellement ce bloc (classe p3-lv-active)
       b) Ajoute la classe p3-highlighted sur la .info-box correspondante
       c) Fait défiler doucement vers cette tuile
     La correspondance entre data-level et l'id de la tuile est explicite
     dans l'objet levelMap ci-dessous.
     ============================================================ */
  const lvItems = document.querySelectorAll('.p3-lv-item');

  // Mapping : data-level → id de la tuile .info-box correspondante
  const levelMap = { tpe: 'tile-tpe', pme: 'tile-pme', ge: 'tile-ge' };

  lvItems.forEach(item => {
    item.addEventListener('click', () => {
      // Désactiver tous les niveaux
      lvItems.forEach(i => i.classList.remove('p3-lv-active'));
      // Activer le niveau cliqué
      item.classList.add('p3-lv-active');

      // Retirer le highlight de toutes les tuiles
      document.querySelectorAll('.p3-info-tile')
        .forEach(t => t.classList.remove('p3-highlighted'));

      // Ajouter le highlight sur la tuile correspondante
      const tileId = levelMap[item.dataset.level];
      const tile   = tileId ? document.getElementById(tileId) : null;
      if (tile) {
        tile.classList.add('p3-highlighted');
        // Défilement doux vers la tuile
        tile.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });


  /* ============================================================
     5. CALCULATEUR MULTI-FORMULES
     ============================================================
     Quatre modes de calcul sont disponibles via les onglets.
     Chaque mode est décrit par un objet dans la constante FORMULAS
     contenant :
       - title     : libellé de la formule pour l'affichage
       - formula   : texte de la formule dans le bandeau sombre
       - fields    : tableau des {id, label, defaultValue} pour
                     les champs de saisie. Les champs 1 et 2 utilisent
                     les id "ca" et "achats" conservés de l'original.
                     Les champs 3 et 4 utilisent p3-input3 et p3-input4.
       - compute   : fonction qui reçoit les valeurs et retourne
                     {value, unit, analysis} — l'analyse est un texte
                     pédagogique contextualisant le résultat.

     IMPORTANT SUR calculerMarge() :
     La fonction globale originale est conservée dans le HTML.
     Elle appelle window.p3Calculer() qui est défini ici,
     de sorte que l'appel onclick="calculerMarge()" continue
     de fonctionner dans tous les modes.
     ============================================================ */

  const FORMULAS = {
    // ── Mode 1 : Marge brute (mode original) ──────────────
    marge: {
      title:   'Marge brute',
      formula: 'Marge brute = CA − Achats consommés',
      fields: [
        { id: 'ca',     labelId: 'label-ca',     label: 'Chiffre d\'affaires (€)', def: 100000 },
        { id: 'achats', labelId: 'label-achats',  label: 'Achats consommés (€)',   def: 60000  },
      ],
      extraFields: [],
      /**
       * Calcule la marge brute et génère un commentaire contextuel.
       * La notion de "bon" taux varie selon le secteur, on est volontairement
       * prudent dans le commentaire.
       */
      compute(vals) {
        const [ca, achats] = vals;
        const marge     = ca - achats;
        const taux      = ca > 0 ? ((marge / ca) * 100).toFixed(1) : 0;
        let analysis    = `Marge brute : ${fmt(marge)} € — soit ${taux} % du CA. `;
        if (taux >= 60)       analysis += 'Excellent ratio : votre structure de coûts est très maîtrisée.';
        else if (taux >= 40)  analysis += 'Taux correct pour la plupart des secteurs. Comparez avec N-1 pour voir la tendance.';
        else if (taux >= 20)  analysis += 'Taux bas : identifiez les postes d\'achat les plus lourds pour optimiser.';
        else                  analysis += '⚠ Taux très faible : la marge ne couvre probablement pas les charges fixes. Analyse urgente.';
        return { value: marge.toFixed(2), unit: '€', analysis, resultLabel: 'Marge brute' };
      }
    },

    // ── Mode 2 : Taux de marge ────────────────────────────
    taux: {
      title:   'Taux de marge',
      formula: 'Taux de marge = (CA − Coût de revient) ÷ CA × 100',
      fields: [
        { id: 'ca',     labelId: 'label-ca',    label: 'Chiffre d\'affaires (€)',  def: 100000 },
        { id: 'achats', labelId: 'label-achats', label: 'Coût de revient (€)',     def: 45000  },
      ],
      extraFields: [],
      compute(vals) {
        const [ca, cout] = vals;
        if (ca === 0) return { value: '0.00', unit: '%', analysis: 'CA nul — le taux ne peut pas être calculé.', resultLabel: 'Taux de marge' };
        const taux  = ((ca - cout) / ca * 100);
        let analysis = `Taux de marge : ${taux.toFixed(1)} %. `;
        if (taux >= 55)       analysis += 'Secteur de services ou produits à forte valeur ajoutée — excellent.';
        else if (taux >= 35)  analysis += 'Taux sain pour la grande distribution ou la PME industrielle.';
        else if (taux >= 15)  analysis += 'Marge sous pression : surveillez vos coûts d\'approvisionnement.';
        else                  analysis += '⚠ Taux très comprimé — vérifiez votre politique tarifaire.';
        return { value: taux.toFixed(2), unit: '%', analysis, resultLabel: 'Taux de marge' };
      }
    },

    // ── Mode 3 : BFR ──────────────────────────────────────
    bfr: {
      title:   'Besoin en Fonds de Roulement (BFR)',
      formula: 'BFR = Stocks + Créances clients − Dettes fournisseurs',
      fields: [
        { id: 'ca',     labelId: 'label-ca',    label: 'Stocks (€)',              def: 30000 },
        { id: 'achats', labelId: 'label-achats', label: 'Créances clients (€)',   def: 25000 },
      ],
      extraFields: [
        { id: 'p3-input3', labelId: 'label-c3', label: 'Dettes fournisseurs (€)', def: 20000 },
      ],
      compute(vals) {
        const [stocks, creances, dettes] = vals;
        const bfr     = stocks + creances - dettes;
        let analysis  = `BFR : ${fmt(bfr)} €. `;
        if (bfr < 0)         analysis += '✔ BFR négatif : vos clients paient avant que vous payiez vos fournisseurs — trésorerie spontanément positive (modèle de la grande distribution).';
        else if (bfr === 0)  analysis += 'BFR nul : équilibre parfait. Situation rare mais idéale.';
        else                 analysis += `BFR positif : vous avez besoin de ${fmt(bfr)} € de financement "gratuit" pour faire tourner votre cycle d\'exploitation. À couvrir par le FRNG.`;
        return { value: bfr.toFixed(2), unit: '€', analysis, resultLabel: 'BFR' };
      }
    },

    // ── Mode 4 : CAC (Coût d'Acquisition Client) ─────────
    cac: {
      title:   'Coût d\'Acquisition Client (CAC)',
      formula: 'CAC = Budget marketing total ÷ Nombre de nouveaux clients',
      fields: [
        { id: 'ca',     labelId: 'label-ca',    label: 'Budget marketing (€)',     def: 12000 },
        { id: 'achats', labelId: 'label-achats', label: 'Nouveaux clients acquis', def: 60    },
      ],
      extraFields: [],
      compute(vals) {
        const [budget, clients] = vals;
        if (clients === 0) return { value: '—', unit: '', analysis: 'Aucun client acquis : le CAC est infini. Revoyez votre stratégie d\'acquisition.', resultLabel: 'CAC' };
        const cac     = budget / clients;
        let analysis  = `CAC : ${fmt(cac)} € par client. `;
        // Le CAC pertinent dépend du secteur — on rappelle la règle LTV
        analysis += `La règle d'or : votre LTV (valeur vie client) doit être au moins 3× votre CAC. Si un client vous rapporte en moyenne ${fmt(cac * 3)} € sur sa durée de vie, votre acquisition est rentable.`;
        return { value: cac.toFixed(2), unit: '€', analysis, resultLabel: 'CAC' };
      }
    }
  };

  // État courant du calculateur
  let currentMode    = 'marge';
  // Historique des calculs (LIFO, max 5 entrées)
  const calcHistory  = [];

  // Références aux éléments du DOM du calculateur
  const labelCa      = document.getElementById('label-ca');
  const labelAchats  = document.getElementById('label-achats');
  const inputCa      = document.getElementById('ca');
  const inputAchats  = document.getElementById('achats');
  const extraFields  = document.getElementById('p3-extra-fields');
  const labelC3      = document.getElementById('label-c3');
  const inputC3      = document.getElementById('p3-input3');
  const fdFormula    = document.getElementById('p3-fd-formula');
  const resultLabel  = document.getElementById('p3-result-label');
  const resultVal    = document.getElementById('marge');          // id original conservé
  const resultUnit   = document.getElementById('p3-result-unit');
  const analysisBox  = document.getElementById('p3-analysis');
  const analysisText = document.getElementById('p3-analysis-text');
  const historyBox   = document.getElementById('p3-history');
  const historyList  = document.getElementById('p3-history-list');

  /**
   * Formate un nombre en notation française avec séparateurs de milliers.
   * Utilisé dans les messages d'analyse contextuelle.
   * @param {number} n
   * @returns {string} ex: "40 000"
   */
  function fmt(n) {
    return Math.round(n).toLocaleString('fr-FR');
  }

  /**
   * Change le mode du calculateur.
   * Met à jour les libellés, les valeurs par défaut et la formule affichée.
   * Les champs 3/4 sont masqués ou affichés selon le mode.
   * @param {string} mode - clé dans FORMULAS
   */
  function switchMode(mode) {
    currentMode = mode;
    const f = FORMULAS[mode];

    // Mettre à jour la formule affichée
    if (fdFormula) {
      fdFormula.style.opacity = '0';
      setTimeout(() => {
        fdFormula.textContent    = f.formula;
        fdFormula.style.opacity  = '1';
      }, 150);
    }

    // Mettre à jour les libellés et valeurs des 2 champs principaux
    // On respecte les id "ca" et "achats" — seuls les labels changent
    if (labelCa    && f.fields[0]) labelCa.textContent    = f.fields[0].label;
    if (labelAchats && f.fields[1]) labelAchats.textContent = f.fields[1].label;
    if (inputCa    && f.fields[0]) inputCa.value    = f.fields[0].def;
    if (inputAchats && f.fields[1]) inputAchats.value = f.fields[1].def;

    // Afficher ou masquer les champs supplémentaires (3 et 4)
    if (extraFields) {
      if (f.extraFields && f.extraFields.length > 0) {
        extraFields.style.display = '';
        const ef = f.extraFields[0];
        if (labelC3) labelC3.textContent = ef.label;
        if (inputC3) inputC3.value       = ef.def;
      } else {
        extraFields.style.display = 'none';
      }
    }

    // Masquer l'analyse et l'historique à chaque changement de mode
    if (analysisBox) analysisBox.style.display = 'none';

    // Activer le bon onglet visuellement
    document.querySelectorAll('.p3-calc-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.calc === mode);
    });

    refreshIcons();
  }

  // Écoute des clics sur les onglets du calculateur
  document.querySelectorAll('.p3-calc-tab').forEach(tab => {
    tab.addEventListener('click', () => switchMode(tab.dataset.calc));
  });

  /**
   * Fonction principale de calcul — exposée globalement sous window.p3Calculer
   * pour que calculerMarge() du HTML original puisse la déléguer.
   *
   * Récupère les valeurs saisies, appelle la fonction compute() du mode actif,
   * met à jour l'affichage du résultat, l'analyse contextuelle et l'historique.
   */
  window.p3Calculer = function () {
    const f = FORMULAS[currentMode];

    // Collecter les valeurs des champs selon le mode
    const vals = [];
    if (inputCa)     vals.push(parseFloat(inputCa.value)     || 0);
    if (inputAchats) vals.push(parseFloat(inputAchats.value) || 0);
    // Champ supplémentaire (BFR mode 3)
    if (f.extraFields && f.extraFields.length > 0) {
      vals.push(parseFloat(inputC3?.value) || 0);
    }

    const result = f.compute(vals);

    // Mettre à jour l'affichage du résultat
    if (resultLabel) resultLabel.textContent = result.resultLabel;
    if (resultUnit)  resultUnit.textContent  = result.unit;

    if (resultVal) {
      resultVal.textContent = result.value;
      // Micro-animation de feedback : le chiffre change de couleur brièvement
      resultVal.classList.add('p3-updated');
      setTimeout(() => resultVal.classList.remove('p3-updated'), 600);
    }

    // Afficher l'analyse contextuelle
    if (analysisBox && analysisText) {
      analysisText.textContent  = result.analysis;
      analysisBox.style.display = 'flex';
      refreshIcons();
    }

    // Ajouter à l'historique
    addToHistory(result.resultLabel, result.value, result.unit);
  };

  /**
   * Ajoute une entrée à l'historique des calculs.
   * L'historique est limité aux 5 derniers calculs (LIFO).
   * @param {string} type  - nom du KPI calculé
   * @param {string} value - valeur calculée
   * @param {string} unit  - unité (€ ou %)
   */
  function addToHistory(type, value, unit) {
    // On ne garde que 5 entrées
    if (calcHistory.length >= 5) calcHistory.pop();
    calcHistory.unshift({ type, value, unit, ts: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) });

    if (!historyList || !historyBox) return;

    // Vider et reconstruire la liste
    historyList.innerHTML = '';
    calcHistory.forEach(entry => {
      const div = document.createElement('div');
      div.className = 'p3-history-entry';
      div.innerHTML = `
        <span class="p3-he-type">${entry.type}</span>
        <span class="p3-he-val">${entry.value} ${entry.unit}</span>
        <span style="font-size:11px; color:var(--gray);">${entry.ts}</span>
      `;
      historyList.appendChild(div);
    });

    historyBox.style.display = 'block';
  }

  // Calcul initial au chargement pour afficher un résultat de départ
  window.p3Calculer();

  // Calcul en temps réel à chaque saisie (UX améliorée)
  [inputCa, inputAchats, inputC3].forEach(input => {
    input?.addEventListener('input', () => window.p3Calculer());
  });


  /* ============================================================
     6. QUIZ — RECONNAISSEZ-VOUS LA BONNE FORMULE ?
     4 questions, chacune propose 3 formules dont une seule est exacte.
     Les formules sont présentées en code monospace pour renforcer
     l'aspect technique et habituer l'apprenant à leur notation.
     ============================================================ */
  const quizQuestions = [
    {
      kpi:    'Marge brute',
      opts:   [
        'CA × Taux de marge / 100',
        'CA − Achats consommés',           // ← bonne réponse
        'CA ÷ Nombre de produits vendus',
      ],
      answer: 1,
      ok:   'Exact ! La marge brute est la différence entre le prix de vente et le coût des marchandises. Elle mesure la valeur ajoutée brute créée avant les charges de structure.',
      fail: 'Pas tout à fait. La marge brute = CA − Achats consommés. C\'est le solde après avoir payé ce qu\'on a acheté pour revendre.'
    },
    {
      kpi:    'Taux de marge commerciale',
      opts:   [
        '(CA − Coût de revient) ÷ CA × 100',  // ← bonne réponse
        '(CA − Charges fixes) ÷ CA × 100',
        'Marge brute ÷ Charges × 100',
      ],
      answer: 0,
      ok:   'Parfait. Le taux de marge exprime la marge en % du CA. Il permet de comparer des entreprises de tailles différentes et de suivre l\'évolution de la rentabilité dans le temps.',
      fail: 'La bonne formule est (CA − Coût de revient) ÷ CA × 100. On divise par le CA, pas par les charges, pour obtenir un taux comparable d\'une période à l\'autre.'
    },
    {
      kpi:    'Besoin en Fonds de Roulement (BFR)',
      opts:   [
        'Trésorerie − Dettes financières',
        'Créances + Dettes fournisseurs − Stocks',
        'Stocks + Créances clients − Dettes fournisseurs',  // ← bonne réponse
      ],
      answer: 2,
      ok:   'Bravo ! Le BFR mesure le décalage de trésorerie dû au cycle d\'exploitation : vous avez payé vos stocks et attendez que vos clients paient, pendant que vos fournisseurs vous ont accordé un délai.',
      fail: 'La formule exacte est : Stocks + Créances clients − Dettes fournisseurs. Les dettes fournisseurs viennent EN DÉDUCTION car elles financent une partie de votre cycle sans coût immédiat.'
    },
    {
      kpi:    'Coût d\'Acquisition Client (CAC)',
      opts:   [
        'Chiffre d\'affaires ÷ Nombre de clients',
        'Budget marketing ÷ Nombre de nouveaux clients',   // ← bonne réponse
        'Charges de personnel ÷ Nombre de clients',
      ],
      answer: 1,
      ok:   'Exact. Le CAC divise le budget marketing par les clients NOUVEAUX acquis, pas le total. C\'est un indicateur de rentabilité de l\'acquisition — à comparer avec la LTV (valeur vie client).',
      fail: 'La bonne réponse est Budget marketing ÷ Nouveaux clients. On ne divise pas par le CA ni par tous les clients, mais uniquement par ceux qui ont été acquis pendant la période d\'investissement mesurée.'
    }
  ];

  const quizBody  = document.getElementById('p3-quiz-body');
  const quizFinal = document.getElementById('p3-quiz-final');
  const scoreEl   = document.getElementById('p3-score');
  const totalEl   = document.getElementById('p3-qtotal');
  const progFill  = document.getElementById('p3-quiz-fill');

  let qScore    = 0;
  let qAnswered = 0;

  if (totalEl) totalEl.textContent = quizQuestions.length;

  /**
   * Construit et injecte les cartes de questions dans le DOM.
   * Réinitialise le score et la progression.
   */
  function buildQuiz() {
    if (!quizBody) return;
    quizBody.innerHTML = '';
    qScore = 0; qAnswered = 0;
    if (scoreEl)   scoreEl.textContent = '0';
    if (progFill)  progFill.style.width = '0%';
    if (quizFinal) quizFinal.style.display = 'none';

    quizQuestions.forEach((q, qi) => {
      const card = document.createElement('div');
      card.className = 'p3-q-card';

      // Mélanger l'ordre des options pour éviter que la bonne réponse
      // soit toujours à la même position — on garde un map index→original
      // pour retrouver la bonne réponse après mélange.
      const shuffled = q.opts.map((text, i) => ({ text, original: i }))
        .sort(() => Math.random() - 0.5);

      const optsHtml = shuffled.map((opt, si) =>
        `<button class="p3-q-opt" data-qi="${qi}" data-si="${si}" data-orig="${opt.original}">
          ${opt.text}
        </button>`
      ).join('');

      card.innerHTML = `
        <div class="p3-q-label">Question ${qi + 1} / ${quizQuestions.length}</div>
        <div class="p3-q-stmt">
          <i data-lucide="hash"></i>
          <span>Quelle est la formule correcte pour calculer le <strong>${q.kpi}</strong> ?</span>
        </div>
        <div class="p3-q-options">${optsHtml}</div>
        <div class="p3-q-feedback" id="p3-fb-${qi}"></div>
      `;

      // Stocker le map des indices mélangés dans le dataset pour le JS
      card.dataset.shuffled = JSON.stringify(shuffled);
      quizBody.appendChild(card);
    });

    refreshIcons();
    // Délégation d'événement sur le container plutôt que sur chaque bouton
    quizBody.removeEventListener('click', handleQuizClick);
    quizBody.addEventListener('click', handleQuizClick);
  }

  /**
   * Gère un clic sur un bouton de réponse.
   * La délégation d'événement évite les fuites mémoire lors
   * du rebuildquiz (on retire d'abord l'ancien listener).
   * @param {Event} e
   */
  function handleQuizClick(e) {
    const btn = e.target.closest('.p3-q-opt');
    if (!btn || btn.disabled) return;

    const qi      = parseInt(btn.dataset.qi, 10);
    const origIdx = parseInt(btn.dataset.orig, 10);
    const q       = quizQuestions[qi];
    const card    = btn.closest('.p3-q-card');
    const fb      = document.getElementById(`p3-fb-${qi}`);

    // Bloquer toutes les options de cette question
    card.querySelectorAll('.p3-q-opt').forEach(b => (b.disabled = true));

    const isCorrect = origIdx === q.answer;

    // Colorier le bouton cliqué
    btn.classList.add(isCorrect ? 'p3-opt-correct' : 'p3-opt-wrong');

    // Révéler toujours la bonne réponse si mauvais choix
    if (!isCorrect) {
      card.querySelectorAll('.p3-q-opt').forEach(b => {
        if (parseInt(b.dataset.orig, 10) === q.answer) {
          b.classList.add('p3-opt-reveal');
        }
      });
    }

    card.classList.add(isCorrect ? 'p3-correct' : 'p3-wrong');

    // Feedback contextuel
    if (fb) {
      fb.textContent = isCorrect ? q.ok : q.fail;
      fb.className = `p3-q-feedback show ${isCorrect ? 'fb-ok' : 'fb-fail'}`;
    }

    // Mise à jour du score
    if (isCorrect) qScore++;
    qAnswered++;
    if (scoreEl) scoreEl.textContent = qScore;
    if (progFill) progFill.style.width = ((qAnswered / quizQuestions.length) * 100) + '%';

    // Résultat final quand toutes les questions sont répondues
    if (qAnswered === quizQuestions.length) showQuizResult();
  }

  /**
   * Affiche le panneau de résultat final avec un message adapté au score.
   */
  function showQuizResult() {
    if (!quizFinal) return;
    quizFinal.style.display = 'block';

    let icon, title, msg;
    if (qScore === quizQuestions.length) {
      icon  = 'trophy';
      title = 'Score parfait — Formules maîtrisées !';
      msg   = 'Vous connaissez les 4 formules fondamentales. Vous êtes prêt(e) à calculer vos KPI avec méthode et à expliquer leur calcul à votre équipe.';
    } else if (qScore >= quizQuestions.length - 1) {
      icon  = 'star';
      title = 'Excellente maîtrise !';
      msg   = `${qScore} / ${quizQuestions.length}. Relisez le feedback de la question manquée pour consolider votre compréhension. La formule rate souvent sur un détail de structure.`;
    } else if (qScore >= Math.ceil(quizQuestions.length / 2)) {
      icon  = 'award';
      title = 'Bonne base, à consolider';
      msg   = `${qScore} / ${quizQuestions.length}. Les formules s'acquièrent par la pratique — essayez de les calculer avec vos propres données réelles pour les mémoriser naturellement.`;
    } else {
      icon  = 'refresh-cw';
      title = 'À retravailler — les formules demandent de la pratique';
      msg   = `${qScore} / ${quizQuestions.length}. Relisez le référentiel ci-dessus, pratiquez chaque formule dans le calculateur, puis retentez le quiz.`;
    }

    quizFinal.innerHTML = `
      <i data-lucide="${icon}"></i>
      <h3>${title}</h3>
      <p>${msg}</p>
      <button class="btn btn-secondary" id="p3-restart-btn"
              style="display:inline-flex; align-items:center; gap:7px; margin-top:0.5rem;">
        <i data-lucide="rotate-ccw"></i> Recommencer le quiz
      </button>
    `;

    refreshIcons();

    document.getElementById('p3-restart-btn')?.addEventListener('click', () => {
      buildQuiz();
      // Remonter vers le quiz pour que l'utilisateur voie la première question
      quizBody?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // Lancement initial du quiz
  buildQuiz();

}); // fin DOMContentLoaded