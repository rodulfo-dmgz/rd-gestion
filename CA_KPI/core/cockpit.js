/**
 * cockpit.js — Moteur interactif du simulateur tableau de bord (page1)
 *
 * Ce fichier gère deux expériences distinctes :
 *   A. Le scénario narratif (5 étapes, stepper + navigation)
 *   B. Le simulateur interactif (jauges SVG animées, voyants, alertes)
 *
 * Architecture :
 *   1. Navigation hero → sections (bascule entre scénario et simulateur)
 *   2. Stepper du scénario (5 étapes)
 *   3. Moteur de simulation : calculs physiques inspirés d'un vrai BFR
 *   4. Rendu SVG des jauges (arc conic via stroke-dasharray)
 *   5. Système de voyants d'alerte
 *   6. Mise à jour du slider (couleur dégradée dynamique)
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  // ── Initialiser les icônes Lucide ──────────────────────
  if (typeof lucide !== 'undefined') lucide.createIcons();

  // ──────────────────────────────────────────────────────
  // A. NAVIGATION HERO — bascule entre les deux sections
  // ──────────────────────────────────────────────────────

  const sectionScenario  = document.getElementById('section-scenario');
  const sectionSimulator = document.getElementById('section-simulator');

  const btnScenario    = document.getElementById('btn-scenario');
  const btnSimulator   = document.getElementById('btn-simulator');
  const btnGoSim       = document.getElementById('btn-go-simulator');
  const btnGoScenario  = document.getElementById('btn-go-scenario-from-sim');

  /**
   * Affiche une section et masque l'autre avec un défilement doux.
   * @param {'scenario'|'simulator'} which - quelle section montrer
   */
  function showSection(which) {
    if (which === 'scenario') {
      sectionSimulator.style.display  = 'none';
      sectionScenario.style.display   = 'block';
    } else {
      sectionScenario.style.display   = 'none';
      sectionSimulator.style.display  = 'block';
      // Lancer les animations des jauges SVG au premier affichage
      initGauges();
    }

    // Défilement vers la section affichée
    const target = which === 'scenario' ? sectionScenario : sectionSimulator;
    setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  btnScenario?.addEventListener('click',   () => showSection('scenario'));
  btnSimulator?.addEventListener('click',  () => showSection('simulator'));
  btnGoSim?.addEventListener('click',      () => showSection('simulator'));
  btnGoScenario?.addEventListener('click', () => showSection('scenario'));


  // ──────────────────────────────────────────────────────
  // B. STEPPER DU SCÉNARIO — navigation entre les 5 étapes
  // ──────────────────────────────────────────────────────

  const cards     = document.querySelectorAll('.scenario-card');
  const stepDots  = document.querySelectorAll('.step-dot');
  const stepLines = document.querySelectorAll('.step-line');
  const btnPrev   = document.getElementById('sc-prev');
  const btnNext   = document.getElementById('sc-next');
  const progFill  = document.getElementById('sc-progress-fill');

  let currentStep = 0;
  const totalSteps = cards.length;

  /**
   * Navigue vers une étape précise du scénario.
   * Met à jour : la carte visible, les dots, les lignes de progression,
   * la barre de progression et les boutons précédent/suivant.
   * @param {number} step - index de l'étape (0 = première)
   */
  function goToStep(step) {
    if (step < 0 || step >= totalSteps) return;

    // Masquer toutes les cartes, afficher la bonne
    cards.forEach((c, i) => {
      c.classList.toggle('active', i === step);
    });

    // Mettre à jour les points du stepper
    stepDots.forEach((dot, i) => {
      dot.classList.remove('active', 'done');
      if (i === step)  dot.classList.add('active');
      if (i < step)    dot.classList.add('done');
    });

    // Mettre à jour les lignes entre les points
    stepLines.forEach((line, i) => {
      line.classList.toggle('done', i < step);
    });

    // Barre de progression (largeur en %)
    if (progFill) {
      progFill.style.width = ((step / (totalSteps - 1)) * 100) + '%';
    }

    // État des boutons de navigation
    if (btnPrev) btnPrev.disabled = (step === 0);
    if (btnNext) {
      const isLast = step === totalSteps - 1;
      btnNext.innerHTML = isLast
        ? `Aller au simulateur <i data-lucide="zap"></i>`
        : `Suivant <i data-lucide="chevron-right"></i>`;
      // Le dernier bouton redirige vers le simulateur
      btnNext._isLast = isLast;
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    currentStep = step;

    // Ré-initialiser les animations SVG dans la nouvelle carte
    // (les animations CSS sont jouées à l'insertion — on force un reflow)
    const activeCard = cards[step];
    const animEls = activeCard?.querySelectorAll('.crack-line, .arc-anim');
    animEls?.forEach(el => {
      el.style.animation = 'none';
      // Forcer le reflow du navigateur
      void el.offsetWidth;
      el.style.animation = '';
    });
  }

  btnPrev?.addEventListener('click', () => goToStep(currentStep - 1));
  btnNext?.addEventListener('click', () => {
    if (btnNext._isLast) {
      showSection('simulator');
    } else {
      goToStep(currentStep + 1);
    }
  });

  // Clic sur les dots du stepper
  stepDots.forEach((dot, i) => {
    dot.addEventListener('click', () => goToStep(i));
  });

  // Init stepper à l'étape 0
  goToStep(0);


  // ──────────────────────────────────────────────────────
  // C. SIMULATEUR — Moteur de calcul & rendu des jauges
  // ──────────────────────────────────────────────────────

  /**
   * MODÈLE PHYSIQUE SIMPLIFIÉ du simulateur
   *
   * On simule une PME dont la croissance (pilotée par le curseur) entraîne :
   *  - Une augmentation du CA mensuel
   *  - Une consommation proportionnelle de trésorerie (BFR)
   *  - Des variations de marge brute (compression sous la pression d'achat)
   *  - Un allongement du DSO clients (délai de paiement)
   *
   * Toutes ces formules sont volontairement simplifiées pour être pédagogiques,
   * non pour être un modèle comptable certifié.
   */

  const slider = document.getElementById('sim-throttle');
  if (!slider) return; // Le simulateur n'est pas encore visible — on attend

  let gaugesInited = false;

  // Éléments SVG des jauges
  const speedArc   = document.getElementById('speed-arc');
  const cashArc    = document.getElementById('cash-arc');
  const speedNeedle = document.getElementById('speed-needle');
  const cashNeedle  = document.getElementById('cash-needle');

  // Valeurs texte dans les jauges
  const simCaVal    = document.getElementById('sim-ca-val');
  const simTresoVal = document.getElementById('sim-treso-val');

  // Infobar
  const simMargeVal  = document.getElementById('sim-marge-val');
  const simDsoVal    = document.getElementById('sim-dso-val');
  const simDpoVal    = document.getElementById('sim-dpo-val');
  const simStatusVal = document.getElementById('sim-status-val');
  const chipStatus   = document.getElementById('chip-status');

  // LCD central
  const simBfrVal     = document.getElementById('sim-bfr-val');
  const simClientsVal = document.getElementById('sim-clients-val');
  const simStocksVal  = document.getElementById('sim-stocks-val');

  // Voyants
  const wlBfr     = document.getElementById('wl-bfr');
  const wlTreso   = document.getElementById('wl-treso');
  const wlMarge   = document.getElementById('wl-marge');
  const wlClients = document.getElementById('wl-clients');

  // Alerte centrale
  const cockpitAlert = document.getElementById('cockpit-alert');
  const alertText    = document.getElementById('alert-text');
  const throttlePct  = document.getElementById('throttle-pct');

  /**
   * Calcule tous les indicateurs à partir de la valeur du curseur (0-100).
   * @param {number} t - valeur du throttle (0 à 100)
   * @returns {Object} - objet avec tous les KPI calculés
   */
  function computeModel(t) {
    const CA_BASE    = 40;    // k€/mois à vitesse zéro
    const CA_MAX     = 140;   // k€/mois à plein régime

    // CA croît linéairement avec le throttle
    const ca = CA_BASE + (CA_MAX - CA_BASE) * (t / 100);

    // La tréso diminue vite quand on accélère (courbe en S inversé)
    // Simuler le phénomène "destruction de cash par la croissance"
    const tresoRatio = Math.max(0, 100 - t * 0.9 - Math.pow(t / 100, 2) * 20);

    // BFR augmente avec la vitesse (stocks + créances qui explosent)
    const bfr = Math.round((t / 100) * 65);  // max 65 k€ de BFR

    // Marge se comprime sous la pression d'achat (achat en urgence = coûts plus élevés)
    const marge = Math.max(28, 58 - t * 0.24);

    // Nombre de clients actifs augmente avec le CA
    const clients = Math.round(12 + (t / 100) * 68);

    // Stocks augmentent pour soutenir la croissance
    const stocks = Math.round(8 + (t / 100) * 42);

    // DSO : les clients paient moins vite quand on vend plus vite (choix = délai ou rien)
    const dso = Math.round(30 + (t / 100) * 40);

    // DPO : les fournisseurs aussi rallongent quand on commande gros
    const dpo = Math.round(45 + (t / 100) * 15);

    return { ca, tresoRatio, bfr, marge, clients, stocks, dso, dpo };
  }

  /**
   * Génère le chemin SVG d'un arc de cercle circulaire (type gauge).
   *
   * On utilise la formule paramétrique pour les coordonnées d'un arc.
   * L'arc démarre à 215° (en bas à gauche) et balaye 270° maximum (sens horaire).
   *
   * @param {number} pct   - Pourcentage de remplissage (0 à 100)
   * @param {number} cx    - Centre X
   * @param {number} cy    - Centre Y
   * @param {number} r     - Rayon
   * @param {boolean} reverse - Si true, l'arc part du côté droit (pour la tréso)
   * @returns {string} - chemin SVG "d" attribute
   */
  function makeArcPath(pct, cx = 100, cy = 100, r = 83, reverse = false) {
    // Angle de départ : 215° (−145°) → en bas à gauche du cercle
    // L'arc balaye 270° au total
    const startAngleDeg = 215;
    const sweepAngleDeg = 270;
    const fraction = Math.min(1, Math.max(0, pct / 100));
    const endAngleDeg = startAngleDeg + sweepAngleDeg * fraction;

    // Conversion degrés → radians, et adaptation au repère SVG
    // (SVG : 0° = droite, sens horaire = augmentation angle)
    const toRad = deg => (deg * Math.PI) / 180;

    const startRad = toRad(startAngleDeg - 90); // offset -90 car SVG 0° est à droite
    const endRad   = toRad(endAngleDeg   - 90);

    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);

    // large-arc-flag : 1 si l'arc couvre plus de 180°
    const largeArc = fraction * sweepAngleDeg > 180 ? 1 : 0;

    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  }

  /**
   * Anime l'aiguille d'une jauge en la faisant pivoter.
   * L'aiguille part de −135° (fond de jauge) et va jusqu'à +135°.
   *
   * @param {HTMLElement} needle    - Élément <line> SVG
   * @param {number}      pct       - Pourcentage (0 à 100)
   * @param {boolean}     clockwise - Sens de rotation
   */
  function rotateNeedle(needle, pct, clockwise = true) {
    if (!needle) return;
    // La plage angulaire de l'aiguille est de 270° (−135° à +135°)
    const range   = 270;
    const start   = -135;
    const angle   = clockwise
      ? start + (range * pct / 100)
      : start + (range * (1 - pct / 100));

    needle.style.transform = `rotate(${angle}deg)`;
  }

  /**
   * Détermine la couleur de l'arc de la jauge selon la valeur et les seuils.
   * @param {'speed'|'cash'} type
   * @param {number} pct
   * @returns {string} couleur CSS
   */
  function arcColor(type, pct) {
    if (type === 'speed') {
      if (pct > 75) return '#ef4444';
      if (pct > 50) return '#f59e0b';
      return '#10b981';
    } else {
      // Pour la tréso : vert quand pleine, rouge quand vide
      if (pct > 50) return '#10b981';
      if (pct > 20) return '#f59e0b';
      return '#ef4444';
    }
  }

  /**
   * Met à jour l'état (ok/warn/alert) d'un voyant.
   * @param {HTMLElement} wl    - Élément .wl
   * @param {'ok'|'warn'|'alert'} state
   */
  function setWarningLight(wl, state) {
    if (!wl) return;
    wl.classList.remove('ok', 'warn', 'alert');
    wl.classList.add(state);
  }

  /**
   * Mise à jour complète de l'interface cockpit.
   * Appelée à chaque mouvement du curseur.
   */
  function updateCockpit() {
    const t = parseInt(slider.value) || 0;
    const m = computeModel(t);

    // ── Mise à jour couleur slider (dégradé fill) ──────
    slider.style.setProperty('--fill', t + '%');

    // Valeur % affichée
    if (throttlePct) throttlePct.textContent = t + ' %';

    // ── Jauge vitesse (CA) ─────────────────────────────
    const speedPct = (m.ca - 40) / (140 - 40) * 100; // normaliser entre 0-100
    const sColor = arcColor('speed', speedPct);
    if (speedArc) {
      speedArc.setAttribute('d', makeArcPath(speedPct));
      speedArc.setAttribute('stroke', sColor);
    }
    rotateNeedle(speedNeedle, speedPct, true);
    if (simCaVal) {
      simCaVal.textContent = m.ca.toFixed(0);
      simCaVal.setAttribute('fill', sColor);
    }

    // ── Jauge trésorerie ───────────────────────────────
    const cColor = arcColor('cash', m.tresoRatio);
    if (cashArc) {
      cashArc.setAttribute('d', makeArcPath(m.tresoRatio));
      cashArc.setAttribute('stroke', cColor);
    }
    // Aiguille tréso : sens inverse (pleine = droite = 100%)
    rotateNeedle(cashNeedle, m.tresoRatio, false);
    if (simTresoVal) {
      simTresoVal.textContent = Math.round(m.tresoRatio) + '%';
      simTresoVal.setAttribute('fill', cColor);
    }

    // ── Infobar ────────────────────────────────────────
    if (simMargeVal) simMargeVal.textContent = m.marge.toFixed(0) + '%';
    if (simDsoVal)   simDsoVal.textContent   = m.dso + ' j';
    if (simDpoVal)   simDpoVal.textContent   = m.dpo + ' j';

    // ── LCD central ────────────────────────────────────
    if (simBfrVal)     simBfrVal.textContent     = m.bfr + ' k€';
    if (simClientsVal) simClientsVal.textContent = m.clients;
    if (simStocksVal)  simStocksVal.textContent  = m.stocks + ' k€';

    // ── Statut général ─────────────────────────────────
    let status, statusClass;
    if (m.tresoRatio < 15) {
      status = 'Critique'; statusClass = 'alert';
    } else if (m.tresoRatio < 35 || m.bfr > 40) {
      status = 'Attention'; statusClass = 'warn';
    } else if (t === 0) {
      status = 'En attente'; statusClass = '';
    } else {
      status = 'Nominal'; statusClass = 'ok';
    }
    if (simStatusVal) simStatusVal.textContent = status;
    if (chipStatus)   { chipStatus.className = 'info-chip ' + statusClass; }

    // ── Voyants d'alerte ───────────────────────────────
    setWarningLight(wlBfr,     m.bfr > 50 ? 'alert' : m.bfr > 25 ? 'warn' : 'ok');
    setWarningLight(wlTreso,   m.tresoRatio < 15 ? 'alert' : m.tresoRatio < 35 ? 'warn' : 'ok');
    setWarningLight(wlMarge,   m.marge < 35 ? 'alert' : m.marge < 45 ? 'warn' : 'ok');
    setWarningLight(wlClients, m.dso > 60 ? 'warn' : 'ok');

    // ── Message d'alerte central ───────────────────────
    let alertMsg = '';
    if (m.tresoRatio < 15) {
      alertMsg = 'Trésorerie critique — Panne sèche imminente ! Réduisez la cadence.';
    } else if (m.tresoRatio < 25) {
      alertMsg = 'Alerte trésorerie — Moins de 25% de carburant. Surveillez le BFR.';
    } else if (m.bfr > 50) {
      alertMsg = 'BFR excessif — Les stocks et créances absorbent tout votre cash.';
    } else if (m.marge < 35) {
      alertMsg = 'Marge dégradée — Les achats en urgence compressent votre rentabilité.';
    }

    if (cockpitAlert) {
      cockpitAlert.style.opacity = alertMsg ? '1' : '0';
      if (alertText && alertMsg) alertText.textContent = alertMsg;
    }

    // ── Effet visuel sur les jauges selon l'état ───────
    const gaugeUnits = document.querySelectorAll('.gauge-unit');
    if (gaugeUnits[0]) { // vitesse
      gaugeUnits[0].classList.toggle('gauge-danger', speedPct > 75);
      gaugeUnits[0].classList.toggle('gauge-warn',   speedPct > 50 && speedPct <= 75);
    }
    if (gaugeUnits[2]) { // tréso (index 2, le centre est à l'index 1)
      gaugeUnits[2].classList.toggle('gauge-danger', m.tresoRatio < 15);
      gaugeUnits[2].classList.toggle('gauge-warn',   m.tresoRatio < 35 && m.tresoRatio >= 15);
    }

    // Ré-initialiser les icônes Lucide après mise à jour innerHTML
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  /**
   * Initialise les jauges à leur état de départ (appelé au premier affichage
   * du simulateur, pas au chargement de la page pour éviter de travailler sur
   * des éléments SVG non encore rendus).
   */
  function initGauges() {
    if (gaugesInited) return;
    gaugesInited = true;

    // Dessiner l'arc fond gris des deux jauges
    if (speedArc) {
      speedArc.setAttribute('d', makeArcPath(0));
    }
    if (cashArc) {
      cashArc.setAttribute('d', makeArcPath(100));
    }

    // Forcer une première mise à jour complète
    updateCockpit();
  }

  // Écouter les mouvements du curseur
  slider.addEventListener('input', updateCockpit);

  // Si le simulateur est déjà visible au chargement (rare), on initialise
  if (sectionSimulator && sectionSimulator.style.display !== 'none') {
    initGauges();
  }

}); // fin DOMContentLoaded