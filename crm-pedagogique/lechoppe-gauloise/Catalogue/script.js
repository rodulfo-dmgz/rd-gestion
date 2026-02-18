/* ============================================
   L'ÉCHOPPE GAULOISE — Flipbook Magazine v3
   Zigzag layout + formes + Supabase
   ============================================ */
(function () {
  'use strict';

  var currentSpread = 0, totalSpreads = 0, isAnimating = false;
  var ANIM = 900;

  var loader     = document.getElementById('loader');
  var wrapper    = document.getElementById('magazine-wrapper');
  var magazine   = document.getElementById('magazine');
  var btnPrev    = document.getElementById('btn-prev');
  var btnNext    = document.getElementById('btn-next');
  var indicator  = document.getElementById('spread-indicator');
  var progressBar = document.querySelector('.mag-progress__bar');

  /* ---- Couleurs alternées pour les cartes ---- */
  var CARD_THEMES_BIERE = ['warm', 'cool', 'neutral', 'fresh'];
  var CARD_THEMES_VIN   = ['wine', 'cool', 'fresh', 'neutral'];

  /* ---- Supabase ---- */
  async function chargerBieres() {
    try {
      var r = await supabaseClient.from('bieres').select('*').eq('is_active', true).order('rating', { ascending: false }).limit(20);
      if (r.error) throw r.error;
      return r.data;
    } catch (e) { console.error('Bières:', e); return []; }
  }

  async function chargerVins() {
    try {
      var r = await supabaseClient.from('vins').select('*').eq('is_active', true).order('rating', { ascending: false }).limit(20);
      if (r.error) throw r.error;
      return r.data;
    } catch (e) { console.error('Vins:', e); return []; }
  }

  /* ---- Helpers ---- */
  function vinPlaceholder(v) {
    var c = (v.category || v.type || '').toLowerCase();
    if (c.includes('rouge')) return '--rouge';
    if (c.includes('blanc') || c.includes('liquoreux')) return '--blanc';
    if (c.includes('rose') || c.includes('rosé')) return '--rose';
    if (c.includes('champagne')) return '--champagne';
    return '--rouge';
  }

  /**
   * Génère une carte bière en zigzag
   * @param {Object} b - données bière
   * @param {number} idx - index pour alterner direction et couleur
   */
  function carteBiere(b, idx) {
    var dir = (idx % 2 === 0) ? 'img-left' : 'img-right';
    var theme = CARD_THEMES_BIERE[idx % CARD_THEMES_BIERE.length];
    var hasImg = b.image_main && b.image_main.trim();
    var imgH = hasImg
      ? '<img class="product-card__img" src="' + b.image_main + '" alt="' + b.name + '" loading="lazy">'
      : '<div class="product-card__img-placeholder product-card__img-placeholder--biere"><i class="ph ph-beer-bottle"></i></div>';
    var badge = b.badge ? '<span class="product-card__badge product-card__badge--vert">' + b.badge + '</span>' : '';

    return '<div class="product-card product-card--' + dir + ' product-card--' + theme + '">' +
      '<div class="product-card__img-wrap">' + imgH + '</div>' +
      '<div class="product-card__body">' +
        '<span class="product-card__type">' + (b.style || b.category || 'Bière') + ' — ' + (b.alcohol || '') + '%</span>' +
        '<h3 class="product-card__name">' + b.name + '</h3>' +
        '<p class="product-card__desc">' + (b.description || '') + '</p>' +
        '<div class="product-card__footer">' +
          '<span class="product-card__price">' + parseFloat(b.price).toFixed(2) + ' €</span>' + badge +
          '<span class="product-card__meta"><i class="ph ph-drop"></i> ' + (b.volume || '33cl') + ' <i class="ph ph-fire"></i> IBU ' + (b.bitterness || '—') + '</span>' +
        '</div></div></div>';
  }

  /**
   * Génère une carte vin en zigzag
   */
  function carteVin(v, idx) {
    var dir = (idx % 2 === 0) ? 'img-left' : 'img-right';
    var theme = CARD_THEMES_VIN[idx % CARD_THEMES_VIN.length];
    var cls = vinPlaceholder(v);
    var hasImg = v.image_main && v.image_main.trim();
    var imgH = hasImg
      ? '<img class="product-card__img" src="' + v.image_main + '" alt="' + v.name + '" loading="lazy">'
      : '<div class="product-card__img-placeholder product-card__img-placeholder' + cls + '"><i class="ph ph-wine"></i></div>';
    var badge = v.badge ? '<span class="product-card__badge">' + v.badge + '</span>' : '';
    var region = v.region ? v.region.charAt(0).toUpperCase() + v.region.slice(1) : '';

    return '<div class="product-card product-card--' + dir + ' product-card--' + theme + '">' +
      '<div class="product-card__img-wrap">' + imgH + '</div>' +
      '<div class="product-card__body">' +
        '<span class="product-card__type">' + (v.type || v.category || 'Vin') + ' — ' + region + '</span>' +
        '<h3 class="product-card__name">' + v.name + '</h3>' +
        '<p class="product-card__desc">' + (v.description || '') + '</p>' +
        '<div class="product-card__footer">' +
          '<span class="product-card__price">' + parseFloat(v.price).toFixed(2) + ' €</span>' + badge +
          '<span class="product-card__meta"><i class="ph ph-calendar"></i> ' + (v.year || '') + ' <i class="ph ph-wine"></i> ' + (v.alcohol || '') + '%</span>' +
        '</div></div></div>';
  }

  /* ---- Points décoratifs SVG ---- */
  function decoDotsHTML(pos) {
    return '<svg class="deco-dots deco-dots--' + pos + '" width="36" height="36" viewBox="0 0 36 36">' +
      '<circle cx="4" cy="4" r="2" fill="currentColor"/>' +
      '<circle cx="18" cy="4" r="2" fill="currentColor"/>' +
      '<circle cx="32" cy="4" r="2" fill="currentColor"/>' +
      '<circle cx="4" cy="18" r="2" fill="currentColor"/>' +
      '<circle cx="18" cy="18" r="2" fill="currentColor"/>' +
      '<circle cx="32" cy="18" r="2" fill="currentColor"/>' +
      '<circle cx="4" cy="32" r="2" fill="currentColor"/>' +
      '<circle cx="18" cy="32" r="2" fill="currentColor"/>' +
      '<circle cx="32" cy="32" r="2" fill="currentColor"/>' +
    '</svg>';
  }

  /* ============================================
     CONSTRUCTION DU MAGAZINE
     ============================================ */
  function construire(bieres, vins) {
    // Grouper par pages de 2
    var bp = [], vp = [], i;
    for (i = 0; i < bieres.length; i += 2) bp.push(bieres.slice(i, i + 2));
    for (i = 0; i < vins.length; i += 2) vp.push(vins.slice(i, i + 2));

    var html = '', pn = 1;

    /* ---- SPREAD 0 : Couverture + Sommaire ---- */
    html += '<div class="spread active" data-spread="0">' +
      '<div class="page-left cover-left">' +
        '<div class="deco-circle"></div><div class="deco-diamond"></div>' +
        '<img src="../assets/Logo.svg" alt="L\'Échoppe Gauloise" class="cover-logo" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';">' +
        '<div class="cover-logo-placeholder" style="display:none;"><i class="ph ph-storefront"></i></div>' +
        '<h1 class="cover-title">L\'Échoppe<br><em>Gauloise</em></h1>' +
        '<p class="cover-season">Catalogue Été 2025</p>' +
        '<div class="cover-divider"></div>' +
        '<p class="cover-tagline">Bières artisanales brassées avec passion & vins de terroir sélectionnés avec exigence.</p>' +
      '</div>' +
      '<div class="page-right cover-right">' +
        '<div class="deco-blob"></div>' +
        '<p class="cover-right__sommaire-label">Sommaire</p>' +
        '<div class="sommaire-item" data-goto="1"><span class="sommaire-item__titre">Notre histoire</span><span class="sommaire-item__page">02 — 03</span></div>' +
        '<div class="sommaire-item" data-goto="2"><span class="sommaire-item__titre">L\'art du brassage</span><span class="sommaire-item__page">04 — 05</span></div>' +
        '<div class="sommaire-item" data-goto="3"><span class="sommaire-item__titre">Nos engagements</span><span class="sommaire-item__page">06 — 07</span></div>' +
        '<div class="sommaire-item" data-goto="4"><span class="sommaire-item__titre">Nos bières</span><span class="sommaire-item__page">08+</span></div>' +
        '<div class="sommaire-item" data-goto="' + (4 + Math.ceil(bp.length / 2)) + '"><span class="sommaire-item__titre">Nos vins</span><span class="sommaire-item__page">' + (8 + bp.length * 2) + '+</span></div>' +
        '<div class="sommaire-item" data-goto="' + (4 + Math.ceil(bp.length / 2) + Math.ceil(vp.length / 2)) + '"><span class="sommaire-item__titre">Contact</span><span class="sommaire-item__page">fin</span></div>' +
        '<span class="page-num">01</span>' +
      '</div></div>';

    /* ---- SPREAD 1 : À propos ---- */
    html += '<div class="spread" data-spread="1">' +
      '<div class="page-left" style="position:relative;">' + decoDotsHTML('tl') +
        '<div class="page-content">' +
          '<span class="section-label"><i class="ph ph-book-open-text"></i> Notre histoire</span>' +
          '<h2 class="section-title">Le goût de<br><em>l\'authenticité</em></h2>' +
          '<p class="section-body">Fondée au cœur de l\'Occitanie, <strong>L\'Échoppe Gauloise</strong> est née d\'une conviction simple : les meilleurs breuvages naissent de la rencontre entre un terroir généreux et un savoir-faire exigeant.</p>' +
          '<p class="section-body">Chaque bouteille raconte une histoire — celle de nos brasseurs qui sélectionnent les houblons les plus aromatiques, celle de nos vignerons partenaires qui cultivent la vigne en agriculture biologique.</p>' +
          '<blockquote class="pull-quote">« Nous ne fabriquons pas des boissons, nous créons des moments de partage. »</blockquote>' +
        '</div><span class="page-num">02</span></div>' +
      '<div class="page-right" style="position:relative;">' + decoDotsHTML('br') +
        '<div class="page-content">' +
          '<span class="section-label"><i class="ph ph-users-three"></i> Philosophie</span>' +
          '<h2 class="section-title">Cave & <em>Brasserie</em></h2>' +
          '<p class="section-body">Notre cave est un lieu de rencontre, de partage et de découverte. Nous y accueillons les curieux comme les connaisseurs.</p>' +
          '<p class="section-body">De la <strong>sélection des matières premières</strong> à la mise en bouteille, chaque étape est guidée par notre quête d\'excellence.</p>' +
          '<p class="section-body">Nous travaillons avec des producteurs locaux, des brasseurs passionnés et des vignerons indépendants du Languedoc et de la Vallée du Rhône.</p>' +
        '</div><span class="page-num">03</span></div></div>';

    /* ---- SPREAD 2 : Production ---- */
    html += '<div class="spread" data-spread="2">' +
      '<div class="page-left" style="position:relative;">' + decoDotsHTML('br') +
        '<div class="page-content">' +
          '<span class="section-label"><i class="ph ph-beer-bottle"></i> Brassage</span>' +
          '<h2 class="section-title">L\'art du<br><em>brassage</em></h2>' +
          '<p class="section-body">Nos bières sont brassées en <strong>petits lots</strong>, selon des recettes développées au fil des saisons avec des malts d\'orge français et houblons aromatiques.</p>' +
          '<p class="section-body">Du concassage du malt à la refermentation en bouteille, chaque étape est menée avec une précision artisanale.</p>' +
        '</div><span class="page-num">04</span></div>' +
      '<div class="page-right" style="position:relative;">' + decoDotsHTML('tl') +
        '<div class="page-content">' +
          '<span class="section-label"><i class="ph ph-wine"></i> Vinification</span>' +
          '<h2 class="section-title">De la vigne<br><em>au verre</em></h2>' +
          '<p class="section-body">Nos vins sont issus de parcelles cultivées en <strong>agriculture biologique</strong> produisant des raisins d\'une intensité aromatique remarquable.</p>' +
          '<p class="section-body">L\'élevage en cuves inox préserve le fruit. Chaque cuvée reflète fidèlement son terroir.</p>' +
          '<blockquote class="pull-quote">« Le vin est la poésie de la terre. »</blockquote>' +
        '</div><span class="page-num">05</span></div></div>';

    /* ---- SPREAD 3 : Valeurs ---- */
    html += '<div class="spread" data-spread="3">' +
      '<div class="page-left"><div class="page-content">' +
        '<span class="section-label"><i class="ph ph-heart"></i> Engagements</span>' +
        '<h2 class="section-title">Nos<br><em>valeurs</em></h2>' +
        '<div class="values-grid">' +
          '<div class="value-card value-card--bio"><div class="value-card__icon"><i class="ph ph-leaf"></i></div><p class="value-card__title">Bio & Naturel</p><p class="value-card__text">Ingrédients certifiés issus de l\'agriculture biologique.</p></div>' +
          '<div class="value-card value-card--local"><div class="value-card__icon"><i class="ph ph-map-pin-area"></i></div><p class="value-card__title">Circuit court</p><p class="value-card__text">Approvisionnement local et partenariats durables.</p></div>' +
          '<div class="value-card value-card--equitable"><div class="value-card__icon"><i class="ph ph-handshake"></i></div><p class="value-card__title">Commerce équitable</p><p class="value-card__text">Rémunération juste pour chaque acteur.</p></div>' +
          '<div class="value-card value-card--innovation"><div class="value-card__icon"><i class="ph ph-lightbulb-filament"></i></div><p class="value-card__title">Innovation</p><p class="value-card__text">Recettes créatives et techniques modernes.</p></div>' +
        '</div>' +
      '</div><span class="page-num">06</span></div>' +
      '<div class="page-right"><div class="page-content" style="justify-content:center;align-items:center;text-align:center;">' +
        '<i class="ph ph-plant" style="font-size:3rem;color:var(--houblon);opacity:0.12;margin-bottom:1.5rem;"></i>' +
        '<p class="section-body" style="max-width:260px;text-align:center;"><strong>Depuis notre création</strong>, nous avons réduit notre empreinte carbone de 40% grâce à des circuits courts et un brassage responsable.</p>' +
        '<div style="margin-top:1.5rem;display:flex;gap:1.8rem;justify-content:center;">' +
          '<div style="text-align:center;"><span style="font-family:var(--font-display);font-weight:700;font-size:1.5rem;color:var(--bordeaux);">100%</span><p style="font-size:0.58rem;color:var(--gris-chaud);margin-top:0.15rem;">Local</p></div>' +
          '<div style="text-align:center;"><span style="font-family:var(--font-display);font-weight:700;font-size:1.5rem;color:var(--houblon);">Bio</span><p style="font-size:0.58rem;color:var(--gris-chaud);margin-top:0.15rem;">Certifié</p></div>' +
          '<div style="text-align:center;"><span style="font-family:var(--font-display);font-weight:700;font-size:1.5rem;color:var(--or-vieilli);">40+</span><p style="font-size:0.58rem;color:var(--gris-chaud);margin-top:0.15rem;">Références</p></div>' +
        '</div>' +
      '</div><span class="page-num">07</span></div></div>';

    /* ---- SPREADS BIÈRES ---- */
    pn = 8;
    var biereGlobalIdx = 0; // compteur global pour alterner zigzag
    for (i = 0; i < bp.length; i += 2) {
      var lp = bp[i] || [];
      var rp = bp[i + 1] || [];
      var si = 4 + (i / 2);

      // Générer cartes gauche avec index global (pour zigzag continu)
      var lH = '';
      lp.forEach(function(b) { lH += carteBiere(b, biereGlobalIdx); biereGlobalIdx++; });

      var rH = '';
      if (rp.length > 0) {
        rp.forEach(function(b) { rH += carteBiere(b, biereGlobalIdx); biereGlobalIdx++; });
      } else {
        rH = '<div style="display:flex;align-items:center;justify-content:center;height:100%;opacity:0.1;"><i class="ph ph-beer-bottle" style="font-size:4rem;color:var(--or-vieilli);"></i></div>';
      }

      html += '<div class="spread" data-spread="' + si + '">' +
        '<div class="page-left" style="position:relative;">' + decoDotsHTML('br') +
          '<div class="page-content" style="padding:1.4rem;">' +
            '<span class="products-label"><i class="ph ph-beer-bottle"></i> Bières artisanales — ' + (i / 2 + 1) + '/' + Math.ceil(bp.length / 2) + '</span>' +
            '<div class="products-stack">' + lH + '</div>' +
          '</div><span class="page-num">' + String(pn).padStart(2, '0') + '</span></div>' +
        '<div class="page-right" style="position:relative;">' + decoDotsHTML('tl') +
          '<div class="page-content" style="padding:1.4rem;">' +
            (rp.length > 0 ? '<span class="products-label"><i class="ph ph-beer-bottle"></i> Suite</span>' : '') +
            '<div class="products-stack">' + rH + '</div>' +
          '</div><span class="page-num">' + String(pn + 1).padStart(2, '0') + '</span></div></div>';
      pn += 2;
    }

    /* ---- SPREADS VINS ---- */
    var vinStart = 4 + Math.ceil(bp.length / 2);
    var vinGlobalIdx = 0;
    for (i = 0; i < vp.length; i += 2) {
      var lp2 = vp[i] || [];
      var rp2 = vp[i + 1] || [];
      var si2 = vinStart + (i / 2);

      var lH2 = '';
      lp2.forEach(function(v) { lH2 += carteVin(v, vinGlobalIdx); vinGlobalIdx++; });

      var rH2 = '';
      if (rp2.length > 0) {
        rp2.forEach(function(v) { rH2 += carteVin(v, vinGlobalIdx); vinGlobalIdx++; });
      } else {
        rH2 = '<div style="display:flex;align-items:center;justify-content:center;height:100%;opacity:0.1;"><i class="ph ph-wine" style="font-size:4rem;color:var(--bordeaux);"></i></div>';
      }

      html += '<div class="spread" data-spread="' + si2 + '">' +
        '<div class="page-left" style="position:relative;">' + decoDotsHTML('tl') +
          '<div class="page-content" style="padding:1.4rem;">' +
            '<span class="products-label"><i class="ph ph-wine"></i> Vins de terroir — ' + (i / 2 + 1) + '/' + Math.ceil(vp.length / 2) + '</span>' +
            '<div class="products-stack">' + lH2 + '</div>' +
          '</div><span class="page-num">' + String(pn).padStart(2, '0') + '</span></div>' +
        '<div class="page-right" style="position:relative;">' + decoDotsHTML('br') +
          '<div class="page-content" style="padding:1.4rem;">' +
            (rp2.length > 0 ? '<span class="products-label"><i class="ph ph-wine"></i> Suite</span>' : '') +
            '<div class="products-stack">' + rH2 + '</div>' +
          '</div><span class="page-num">' + String(pn + 1).padStart(2, '0') + '</span></div></div>';
      pn += 2;
    }

    /* ---- SPREAD FINALE : Contact ---- */
    var lastSi = vinStart + Math.ceil(vp.length / 2);
    html += '<div class="spread" data-spread="' + lastSi + '">' +
      '<div class="page-left back-left">' +
        '<div class="deco-ring"></div>' +
        '<div class="page-content" style="justify-content:center;align-items:center;text-align:center;">' +
          '<p class="back-left__merci">Merci</p>' +
          '<p class="back-left__text">Nous espérons que ce catalogue vous a donné envie de découvrir nos créations. Chaque produit est le fruit d\'un savoir-faire passionné.</p>' +
          '<p class="back-left__text" style="margin-top:1rem;font-style:italic;color:var(--or-vieilli);">À bientôt dans notre cave.</p>' +
        '</div></div>' +
      '<div class="page-right back-right">' +
        '<div class="deco-circle-br"></div>' +
        '<h2 class="back-right__title">Restons en contact</h2>' +
        '<p class="back-right__info">12, rue des Vignerons — 34000 Montpellier</p>' +
        '<p class="back-right__info">contact@echoppe-gauloise.fr</p>' +
        '<p class="back-right__info">+33 (0)4 67 00 00 00</p>' +
        '<div class="back-right__divider"></div>' +
        '<p class="back-right__info">Du mardi au samedi — 10h à 19h</p>' +
        '<div class="back-right__socials">' +
          '<a href="#" aria-label="Instagram"><i class="ph ph-instagram-logo"></i></a>' +
          '<a href="#" aria-label="Facebook"><i class="ph ph-facebook-logo"></i></a>' +
          '<a href="#" aria-label="Email"><i class="ph ph-envelope-simple"></i></a>' +
        '</div>' +
        '<a href="mailto:contact@echoppe-gauloise.fr" class="back-right__cta">Nous écrire <i class="ph ph-arrow-right"></i></a>' +
      '</div></div>';

    magazine.innerHTML = html;
  }

  /* ============================================
     NAVIGATION
     ============================================ */
  function getSpreads() { return document.querySelectorAll('.spread'); }

  function updateUI() {
    var s = getSpreads(); totalSpreads = s.length;
    if (indicator) indicator.textContent = (currentSpread + 1) + ' / ' + totalSpreads;
    if (progressBar) progressBar.style.width = ((currentSpread + 1) / totalSpreads * 100) + '%';
    if (btnPrev) btnPrev.disabled = (currentSpread === 0);
    if (btnNext) btnNext.disabled = (currentSpread === totalSpreads - 1);
  }

  function allerSuivant() {
    var s = getSpreads();
    if (isAnimating || currentSpread >= s.length - 1) return;
    isAnimating = true;
    var curr = s[currentSpread], next = s[currentSpread + 1];
    curr.classList.remove('active'); curr.classList.add('flip-out-forward');
    next.classList.add('flip-in-forward');
    setTimeout(function() {
      curr.classList.remove('flip-out-forward');
      next.classList.remove('flip-in-forward'); next.classList.add('active');
      currentSpread++; updateUI(); isAnimating = false;
    }, ANIM);
  }

  function allerPrecedent() {
    var s = getSpreads();
    if (isAnimating || currentSpread <= 0) return;
    isAnimating = true;
    var curr = s[currentSpread], prev = s[currentSpread - 1];
    curr.classList.remove('active'); curr.classList.add('flip-out-backward');
    prev.classList.add('flip-in-backward');
    setTimeout(function() {
      curr.classList.remove('flip-out-backward');
      prev.classList.remove('flip-in-backward'); prev.classList.add('active');
      currentSpread--; updateUI(); isAnimating = false;
    }, ANIM);
  }

  function allerA(idx) {
    var s = getSpreads();
    if (isAnimating || idx < 0 || idx >= s.length || idx === currentSpread) return;
    isAnimating = true;
    var curr = s[currentSpread], target = s[idx];
    var fwd = idx > currentSpread;
    curr.classList.remove('active');
    curr.classList.add(fwd ? 'flip-out-forward' : 'flip-out-backward');
    target.classList.add(fwd ? 'flip-in-forward' : 'flip-in-backward');
    setTimeout(function() {
      curr.classList.remove('flip-out-forward', 'flip-out-backward');
      target.classList.remove('flip-in-forward', 'flip-in-backward');
      target.classList.add('active');
      currentSpread = idx; updateUI(); isAnimating = false;
    }, ANIM);
  }

  function attachEvents() {
    if (btnPrev) btnPrev.addEventListener('click', allerPrecedent);
    if (btnNext) btnNext.addEventListener('click', allerSuivant);
    document.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); allerSuivant(); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); allerPrecedent(); }
    });
    var sx = 0, sy = 0;
    magazine.addEventListener('touchstart', function(e) { sx = e.changedTouches[0].screenX; sy = e.changedTouches[0].screenY; }, { passive: true });
    magazine.addEventListener('touchend', function(e) {
      var dx = sx - e.changedTouches[0].screenX, dy = sy - e.changedTouches[0].screenY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) { dx > 0 ? allerSuivant() : allerPrecedent(); }
    }, { passive: true });
    document.addEventListener('click', function(e) {
      var item = e.target.closest('.sommaire-item[data-goto]');
      if (item) allerA(parseInt(item.getAttribute('data-goto'), 10));
    });
  }

  /* ---- INIT ---- */
  async function init() {
    try {
      var res = await Promise.all([chargerBieres(), chargerVins()]);
      construire(res[0], res[1]);
      updateUI(); attachEvents();
      if (loader) loader.classList.add('hidden');
      if (wrapper) wrapper.classList.add('visible');
    } catch (err) {
      console.error('Init:', err);
      if (loader) loader.innerHTML = '<div style="text-align:center;color:#9a9088;">' +
        '<i class="ph ph-warning-circle" style="font-size:2rem;color:#5c1a2a;display:block;margin-bottom:0.75rem;"></i>' +
        '<p>Impossible de charger le catalogue.</p></div>';
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();