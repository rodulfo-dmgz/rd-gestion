/**
 * masterclass.js — Interactivité complète du manuel comptabilité
 *
 * Architecture :
 *   1. Navigation & barre de progression de lecture
 *   2. Sidebar (ouverture/fermeture + highlight actif)
 *   3. Scroll reveal (Intersection Observer)
 *   4. Onglets intra-fiches indicateurs
 *   5. Accordéon exemples pratiques
 *   6. Calculatrices interactives (TVA, Balance âgée, HS, Amortissement, ICNE, BFR)
 *   7. Quiz pédagogiques
 *   8. Timer de travail autonome
 *   9. Count-up animation sur les KPI
 *  10. Checklist tâches Module 3
 *  11. Utilitaires (format monnaie, format %)
 */

'use strict';

/* ============================================================
   UTILITAIRES
   ============================================================ */

/** Formate un nombre en euros avec la locale française. */
function eur(n) {
  if (isNaN(n) || n === null) return '—';
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 });
}

/** Formate un nombre en pourcentage (1 décimale). */
function pct(n, d = 1) {
  if (isNaN(n)) return '—';
  return n.toFixed(d) + ' %';
}

/** Retourne la classe CSS selon la valeur (positif/négatif/attention). */
function valClass(n, warnThreshold = null) {
  if (warnThreshold !== null && n >= warnThreshold) return 'warn';
  return n >= 0 ? 'pos' : 'neg';
}

/* ============================================================
   1. NAVIGATION & BARRE DE PROGRESSION
   ============================================================ */
(function initNav() {
  const bar   = document.getElementById('progress-bar');
  const links = document.querySelectorAll('.toolbar-nav a[href^="#"], .toolbar-nav a[href*="#"]');

  // Mise à jour de la barre de progression au scroll
  window.addEventListener('scroll', () => {
    if (!bar) return;
    const scrolled = window.scrollY;
    const total    = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (total > 0 ? scrolled / total * 100 : 0) + '%';
  }, { passive: true });

  // Activation du lien de nav en fonction de la section visible
  const sections = document.querySelectorAll('[data-section]');
  if (!sections.length) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const id = e.target.dataset.section;
      links.forEach(l => {
        const href = l.getAttribute('href');
        l.classList.toggle('active', href === '#' + id || href.endsWith('#' + id));
      });
    });
  }, { rootMargin: '-25% 0px -65% 0px' });

  sections.forEach(s => io.observe(s));
})();


/* ============================================================
   2. SIDEBAR
   ============================================================ */
(function initSidebar() {
  const sidebar   = document.getElementById('sidebar');
  const overlay   = document.getElementById('sidebar-overlay');
  const btnToggle = document.getElementById('btn-sidebar-toggle');
  const btnClose  = document.getElementById('btn-sidebar-close');
  if (!sidebar) return;

  const open  = () => { sidebar.classList.add('open');    if (overlay) { overlay.style.display = 'block'; requestAnimationFrame(() => overlay.classList.add('visible')); } };
  const close = () => { sidebar.classList.remove('open'); if (overlay) { overlay.classList.remove('visible'); setTimeout(() => overlay.style.display = 'none', 300); } };

  btnToggle?.addEventListener('click', () => sidebar.classList.contains('open') ? close() : open());
  btnClose?.addEventListener('click', close);
  overlay?.addEventListener('click', close);

  // Mettre en surbrillance le lien courant dans la sidebar au scroll
  const sideLinks = sidebar.querySelectorAll('.sidebar-link[href^="#"]');
  window.addEventListener('scroll', () => {
    let active = '';
    document.querySelectorAll('[data-section]').forEach(s => {
      if (window.scrollY >= s.offsetTop - 130) active = s.dataset.section;
    });
    sideLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + active));
  }, { passive: true });

  // Fermer la sidebar sur mobile après un clic sur un lien
  sidebar.querySelectorAll('.sidebar-link').forEach(l => l.addEventListener('click', close));
})();


/* ============================================================
   3. SCROLL REVEAL
   ============================================================ */
(function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      // Support optionnel d'un délai déclaré en data-delay="0.2" (secondes)
      const delay = parseFloat(e.target.dataset.delay || 0) * 1000;
      setTimeout(() => e.target.classList.add('visible'), delay);
      io.unobserve(e.target);
    });
  }, { threshold: 0.08 });

  els.forEach(el => io.observe(el));
})();


/* ============================================================
   4. ONGLETS INTRA-FICHES INDICATEURS
   ============================================================ */
(function initTabs() {
  document.querySelectorAll('.ind-tabs').forEach(tabGroup => {
    const card  = tabGroup.closest('.ind-card');
    if (!card) return;
    const tabs  = tabGroup.querySelectorAll('.ind-tab');
    const panes = card.querySelectorAll('.ind-pane');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t  => t.classList.remove('active'));
        panes.forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        card.querySelector(`[data-pane="${tab.dataset.tab}"]`)?.classList.add('active');
      });
    });
  });
})();


/* ============================================================
   5. ACCORDÉON EXEMPLES
   ============================================================ */
(function initAccordeon() {
  document.querySelectorAll('.ex-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const body   = btn.nextElementSibling;
      const isOpen = btn.classList.contains('open');

      // Fermer les autres accordéons dans la même fiche
      const parentPane = btn.closest('.ind-pane, .section');
      parentPane?.querySelectorAll('.ex-toggle.open').forEach(other => {
        if (other !== btn) {
          other.classList.remove('open');
          other.nextElementSibling?.classList.remove('open');
        }
      });

      btn.classList.toggle('open', !isOpen);
      body?.classList.toggle('open', !isOpen);
    });
  });
})();


/* ============================================================
   6. CALCULATRICES INTERACTIVES
   ============================================================ */

/* Helper : récupère la valeur numérique d'un input par son ID */
function num(id) { return parseFloat(document.getElementById(id)?.value) || 0; }

/* ── 6a. TVA mensuelle ──────────────────────────────────── */
window.calcTVA = function() {
  const vtHT   = num('c-ventes-ht');
  const achHT  = num('c-achats-ht');
  const immoHT = num('c-immo-ht');
  const taux   = num('c-tva-taux') || 20;

  // La TVA collectée dépend du taux de vente choisi
  const tvaCol   = vtHT * (taux / 100);
  // La TVA déductible est calculée à 20 % sur les achats courants et les immobilisations
  const tvaDedAch  = achHT * 0.20;
  const tvaDedImmo = immoHT * 0.20;   // TVA sur investissement — toujours déductible
  const tvaDed     = tvaDedAch + tvaDedImmo;
  const tvaNet     = tvaCol - tvaDed;

  const resEl  = document.getElementById('r-tva-val');
  const detEl  = document.getElementById('r-tva-detail');
  if (!resEl) return;

  resEl.textContent = eur(tvaNet);
  resEl.className   = 'calc-result-val ' + (tvaNet >= 0 ? '' : 'neg');

  if (detEl) {
    detEl.innerHTML =
      `TVA collectée (${taux}% × ${eur(vtHT)}) : <strong>${eur(tvaCol)}</strong><br>` +
      `TVA déductible achats courants : <strong>${eur(tvaDedAch)}</strong><br>` +
      `TVA déductible sur immobilisation : <strong>${eur(tvaDedImmo)}</strong><br>` +
      (tvaNet >= 0
        ? `→ <strong>Paiement à effectuer : ${eur(tvaNet)}</strong> — à régler avant le 15 du mois suivant via votre espace professionnel impots.gouv.fr.`
        : `→ <strong>Crédit de TVA : ${eur(Math.abs(tvaNet))}</strong> — reportable sur la prochaine CA3 ou remboursable (case 26 + formulaire n°3519).`);
  }
};

/* ── 6b. Balance âgée simplifiée ────────────────────────── */
window.calcBalanceAgee = function() {
  const total  = num('ba-total');
  const t1     = num('ba-0-30');
  const t2     = num('ba-31-60');
  const t3     = num('ba-61-90');
  const t4     = num('ba-90plus');

  const tauxRetard = total > 0 ? (t3 + t4) / total * 100 : 0;
  const tauxSain   = total > 0 ? t1 / total * 100 : 0;

  // Règle de provisionnement prudentielle : 50 % à +60j, 100 % à +90j
  const provision  = t3 * 0.5 + t4 * 1.0;

  // DMP estimé (approximation pondérée par tranche)
  const dmp = total > 0 ? (t1 * 15 + t2 * 45 + t3 * 75 + t4 * 120) / total : 0;

  const resEl = document.getElementById('r-ba-val');
  const detEl = document.getElementById('r-ba-detail');
  if (!resEl) return;

  resEl.textContent = pct(tauxRetard);
  resEl.className   = 'calc-result-val ' + (tauxRetard > 20 ? 'neg' : tauxRetard > 10 ? 'warn' : 'pos');

  let alerte = tauxRetard > 20
    ? 'Situation critique — provisionnement et mise en demeure requis.'
    : tauxRetard > 10
      ? 'Vigilance — relances à déclencher immédiatement.'
      : 'Situation saine.';

  if (detEl) detEl.innerHTML =
    `Créances saines (0–30 j) : <strong>${eur(t1)} (${pct(tauxSain)})</strong><br>` +
    `Créances à risque (+60 j) : <strong>${eur(t3 + t4)} (${pct(tauxRetard)})</strong><br>` +
    `Provision estimée conseillée : <strong>${eur(provision)}</strong><br>` +
    `DMP estimé : <strong>${dmp.toFixed(0)} jours</strong> (norme : 60 j max légal)<br>` +
    `<span style="color:var(--gray-600)">${alerte}</span>`;
};

/* ── 6c. Heures supplémentaires ─────────────────────────── */
window.calcHS = function() {
  const salBrut = num('hs-salaire');
  const hs25    = num('hs-25');
  const hs50    = num('hs-50');

  // 151,67 h = durée mensuelle de référence pour 35 h hebdo (35 × 52 / 12)
  const tH      = salBrut / 151.67;
  const m25     = hs25 * tH * 1.25;
  const m50     = hs50 * tH * 1.50;
  const totalHS = m25 + m50;
  const salTotal = salBrut + totalHS;

  const resEl = document.getElementById('r-hs-val');
  const detEl = document.getElementById('r-hs-detail');
  if (!resEl) return;

  resEl.textContent = eur(totalHS);

  if (detEl) detEl.innerHTML =
    `Taux horaire brut : <strong>${eur(tH)}/h</strong> (${eur(salBrut)} ÷ 151,67)<br>` +
    `HS à 25 % : ${hs25} h × ${eur(tH * 1.25)} = <strong>${eur(m25)}</strong><br>` +
    `HS à 50 % : ${hs50} h × ${eur(tH * 1.50)} = <strong>${eur(m50)}</strong><br>` +
    `<strong>Salaire brut total du mois : ${eur(salTotal)}</strong><br>` +
    `<span style="color:var(--gray-600)">Source : feuilles de pointage validées par le manager + contrat de travail</span>`;
};

/* ── 6d. Amortissements (linéaire / dégressif) ───────────── */
window.calcAmort = function() {
  const valBrute = num('am-val');
  const duree    = parseInt(document.getElementById('am-duree')?.value) || 1;
  const methode  = document.getElementById('am-methode')?.value || 'lineaire';
  const dateStr  = document.getElementById('am-date')?.value;

  // Calcul du pro-rata temporis : nombre de mois restants dans l'année d'acquisition
  let moisProrata = 12;
  if (dateStr) {
    const d = new Date(dateStr);
    // Convention fiscale : on compte les mois entiers restants (mois d'acquisition inclus)
    moisProrata = 12 - d.getMonth();
  }

  const tbody = document.getElementById('am-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  // Coefficients dégréssifs selon la durée (art. 39 A du CGI)
  const coeffTable = { 3: 1.25, 4: 1.75, 5: 1.75, 6: 2.25, 7: 2.25, 8: 2.25 };
  const coeff = coeffTable[duree] || (duree <= 3 ? 1.25 : 2.25);

  let vcn = valBrute;
  for (let an = 1; an <= duree; an++) {
    let annuite = 0;

    if (methode === 'lineaire') {
      annuite = valBrute / duree;
      // Pro-rata uniquement la première année
      if (an === 1 && dateStr) annuite = (valBrute / duree) * (moisProrata / 12);
    } else {
      // Méthode dégressive : on compare le taux dégressif au taux linéaire sur la durée restante
      // et on bascule sur le linéaire dès que celui-ci devient supérieur (règle fiscale)
      const txDeg = (1 / duree) * coeff;
      const txLin = 1 / (duree - an + 1);
      const tx    = Math.max(txDeg, txLin);
      annuite = vcn * tx;
      if (an === 1 && dateStr) annuite *= (moisProrata / 12);
    }

    // On ne dépasse pas la VCN restante (dernière annuité = solde)
    annuite = Math.min(annuite, vcn);
    const cumul = valBrute - (vcn - annuite);
    vcn -= annuite;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>Année ${an}</td>
      <td>${eur(annuite)}</td>
      <td>${eur(cumul)}</td>
      <td class="${vcn < 0.01 ? 't-ok' : ''}">${eur(Math.max(0, vcn))}</td>
    `;
    tbody.appendChild(tr);
  }

  document.getElementById('am-result-table')?.classList.add('visible');
};

/* ── 6e. ICNE sur emprunt ───────────────────────────────── */
window.calcICNE = function() {
  const capital = num('icne-cap');
  const taux    = num('icne-taux');    // taux annuel en %
  const jours   = num('icne-jours');   // nombre de jours courus

  // Formule : Capital × Taux × Jours / 365
  const icne = capital * (taux / 100) * (jours / 365);

  const resEl = document.getElementById('r-icne-val');
  const detEl = document.getElementById('r-icne-detail');
  if (!resEl) return;

  resEl.textContent = eur(icne);

  if (detEl) detEl.innerHTML =
    `${eur(capital)} × ${taux} % × (${jours} ÷ 365)<br>` +
    `= ${eur(capital)} × ${(taux / 100).toFixed(5)} × ${(jours / 365).toFixed(5)}<br>` +
    `<strong>Écriture comptable au 31/12 :</strong><br>` +
    `&nbsp;&nbsp;Débit 6616 (Intérêts des emprunts) : ${eur(icne)}<br>` +
    `&nbsp;&nbsp;Crédit 1688 (Intérêts courus non échus) : ${eur(icne)}<br>` +
    `<strong>Extourne au 01/01 N+1 :</strong> sens inverse.<br>` +
    `<span style="color:var(--gray-600)">Source : tableau d'amortissement fourni par la banque lors de la mise en place de l'emprunt</span>`;
};

/* ── 6f. BFR simplifié ──────────────────────────────────── */
window.calcBFR = function() {
  const stocks  = num('bfr-stocks');
  const clients = num('bfr-clients');
  const fourn   = num('bfr-fourn');
  const frng    = num('bfr-frng');

  const bfr  = stocks + clients - fourn;
  const treso = frng - bfr;

  const resEl = document.getElementById('r-bfr-val');
  const detEl = document.getElementById('r-bfr-detail');
  if (!resEl) return;

  resEl.textContent = eur(bfr);
  resEl.className   = 'calc-result-val ' + (treso >= 0 ? 'pos' : 'neg');

  if (detEl) detEl.innerHTML =
    `BFR = ${eur(stocks)} + ${eur(clients)} − ${eur(fourn)} = <strong>${eur(bfr)}</strong><br>` +
    `Trésorerie nette = FRNG (${eur(frng)}) − BFR (${eur(bfr)}) = ` +
    `<strong class="${treso >= 0 ? 't-ok' : 't-err'}">${eur(treso)}</strong><br>` +
    (treso >= 0
      ? 'La trésorerie couvre le BFR — situation saine.'
      : 'La trésorerie ne couvre pas le BFR — risque de découvert bancaire !');
};


/* ============================================================
   7. QUIZ
   ============================================================ */
(function initQuiz() {
  document.querySelectorAll('.quiz-widget').forEach(widget => {
    const opts     = widget.querySelectorAll('.quiz-opt');
    const fb       = widget.querySelector('.quiz-fb');
    const correct  = widget.dataset.correct;

    opts.forEach(opt => {
      opt.addEventListener('click', function() {
        // Bloquer tous les choix après le premier clic
        opts.forEach(o => o.classList.add('disabled'));

        if (this.dataset.val === correct) {
          this.classList.add('correct');
          if (fb) { fb.classList.add('show', 'ok'); fb.innerHTML = widget.dataset.ok; }
        } else {
          this.classList.add('wrong');
          // Afficher la bonne réponse en vert
          opts.forEach(o => { if (o.dataset.val === correct) o.classList.add('correct'); });
          if (fb) { fb.classList.add('show', 'ko'); fb.innerHTML = widget.dataset.ko; }
        }
      });
    });
  });
})();


/* ============================================================
   8. TIMER DE TRAVAIL AUTONOME
   ============================================================ */
(function initTimer() {
  const disp  = document.getElementById('timer-disp');
  const btnGo = document.getElementById('timer-go');
  const btnPause = document.getElementById('timer-pause');
  const btnReset = document.getElementById('timer-reset');
  if (!disp) return;

  let seconds = 0, iv = null, running = false;

  // Seuil 3h30 = 12 600 secondes
  const GOAL = 12600;

  const fmt = s => {
    const h  = String(Math.floor(s / 3600)).padStart(2, '0');
    const m  = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sc = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${sc}`;
  };

  const tick = () => {
    seconds++;
    disp.textContent = fmt(seconds);
    // Changer la couleur quand l'objectif 3h30 est atteint
    if (seconds >= GOAL) disp.classList.add('reached');
  };

  btnGo?.addEventListener('click', () => {
    if (running) return;
    iv = setInterval(tick, 1000);
    running = true;
    btnGo.disabled = true;
    if (btnGo.querySelector('span')) btnGo.querySelector('span').textContent = 'En cours...';
  });

  btnPause?.addEventListener('click', () => {
    clearInterval(iv); running = false; btnGo.disabled = false;
    if (btnGo.querySelector('span')) btnGo.querySelector('span').textContent = 'Reprendre';
  });

  btnReset?.addEventListener('click', () => {
    clearInterval(iv); running = false; seconds = 0;
    disp.textContent = '00:00:00'; disp.classList.remove('reached');
    btnGo.disabled = false;
    if (btnGo.querySelector('span')) btnGo.querySelector('span').textContent = 'Démarrer';
  });
})();


/* ============================================================
   9. COUNT-UP ANIMATION sur les KPI
   ============================================================ */
(function initCountUp() {
  const els = document.querySelectorAll('[data-count]');
  if (!els.length) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el       = e.target;
      const target   = parseFloat(el.dataset.count);
      const suffix   = el.dataset.suffix  || '';
      const prefix   = el.dataset.prefix  || '';
      const decimals = parseInt(el.dataset.dec || '0');
      const dur      = 1400; // ms
      const t0       = performance.now();

      // Animation easing cubic ease-out
      const animate = now => {
        const p = Math.min((now - t0) / dur, 1);
        const e = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + (target * e).toFixed(decimals) + suffix;
        if (p < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
      io.unobserve(el);
    });
  }, { threshold: 0.5 });

  els.forEach(el => io.observe(el));
})();


/* ============================================================
   10. CHECKLIST TÂCHES MODULE 3
   ============================================================ */
(function initChecklist() {
  const checks = document.querySelectorAll('.task-chk');
  if (!checks.length) return;

  const bar   = document.getElementById('task-bar');
  const lbl   = document.getElementById('task-lbl');
  const done  = document.getElementById('all-done');

  const update = () => {
    const checked = document.querySelectorAll('.task-chk:checked').length;
    const total   = checks.length;
    const p       = Math.round(checked / total * 100);
    if (bar)  bar.style.width = p + '%';
    if (lbl)  lbl.textContent = `${checked} / ${total} tâches complétées (${p} %)`;
    if (done) done.hidden = checked < total;
  };

  checks.forEach(c => c.addEventListener('change', update));
})();


/* ============================================================
   SMOOTH SCROLL sur toutes les ancres internes
   ============================================================ */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = 72; // hauteur toolbar
    window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
  });
});

/* ============================================================
   LOG DE DÉMARRAGE (utile pour débogage en développement)
   ============================================================ */
console.log(
  '%c Masterclass Comptabilité — JS initialisé ',
  'background:#2563EB; color:white; font-weight:bold; border-radius:4px; padding:2px 8px;'
);