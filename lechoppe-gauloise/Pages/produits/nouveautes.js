/**
 * PAGE NOUVEAUTÉS - L'Échoppe Gauloise
 * Version corrigée – Filtres et bouton "Voir plus" opérationnels
 */

(function() {
  'use strict';

  // ============================================
  // CONFIGURATION
  // ============================================
  const BADGE_CONFIG = {
    'Nouveau': { color: 'new', icon: '✨' },
    'Best-seller': { color: 'success', icon: '🔥' },
    'Limited': { color: 'warning', icon: '⏳' },
    'Fort': { color: 'danger', icon: '⚡' },
    'Premium': { color: 'primary', icon: '👑' },
    'Bio': { color: 'success', icon: '🌱' },
    'Exclusif': { color: 'primary', icon: '⭐' },
    'Grand Cru': { color: 'primary', icon: '👑' },
    'Prestige': { color: 'primary', icon: '🏆' },
    'Rare': { color: 'warning', icon: '💎' }
  };

  // Données de secours
  const FALLBACK_PRODUCTS = [
    {
      id: 101,
      name: 'Blonde des Légendes',
      type: 'beer',
      productType: 'Bière',
      category: 'blonde',
      price: 4.90,
      alcohol: 5.5,
      volume: '33cl',
      brewery: 'Brasserie du Nord',
      rating: 4.7,
      description: 'Une blonde fraîche et fruitée aux notes d’agrumes.',
      image_main: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&h=500&fit=crop',
      badge: 'Nouveau',
      is_new: true
    },
    {
      id: 102,
      name: 'IPA Celtique',
      type: 'beer',
      productType: 'Bière',
      category: 'ipa',
      price: 5.90,
      alcohol: 6.8,
      volume: '33cl',
      brewery: 'Brasserie Celtique',
      rating: 4.9,
      description: 'IPA houblonnée aux arômes de fruits tropicaux.',
      image_main: 'https://images.unsplash.com/photo-1586993451228-09818021e309?w=400&h=500&fit=crop',
      badge: 'Nouveau',
      is_new: true
    },
    {
      id: 103,
      name: 'Château Belles Rives 2022',
      type: 'wine',
      productType: 'Vin',
      category: 'rouge',
      region: 'bordeaux',
      price: 24.90,
      alcohol: 13.5,
      year: 2022,
      rating: 4.6,
      description: 'Bordeaux rouge élégant, tanins soyeux, notes de fruits rouges.',
      image_main: 'https://images.unsplash.com/photo-1586370434639-0fe43b2d32e6?w=400&h=500&fit=crop',
      parker_score: 92,
      badge: 'Nouveau',
      is_new: true
    },
    {
      id: 104,
      name: 'Stout Impériale',
      type: 'beer',
      productType: 'Bière',
      category: 'stout',
      price: 6.90,
      alcohol: 8.5,
      volume: '33cl',
      brewery: 'Brasserie Atlantique',
      rating: 4.8,
      description: 'Stout puissante aux notes de café et chocolat.',
      image_main: 'https://images.unsplash.com/photo-1579202673506-ca3ce28943ef?w=400&h=500&fit=crop',
      badge: 'Nouveau',
      is_new: true
    },
    {
      id: 105,
      name: 'Sancerre Blanc 2023',
      type: 'wine',
      productType: 'Vin',
      category: 'blanc',
      region: 'loire',
      price: 18.50,
      alcohol: 12.5,
      year: 2023,
      rating: 4.5,
      description: 'Sancerre minéral et floral, belle fraîcheur.',
      image_main: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=400&h=500&fit=crop',
      parker_score: 90,
      badge: 'Nouveau',
      is_new: true
    },
    {
      id: 106,
      name: 'Côtes du Rhône Prestige',
      type: 'wine',
      productType: 'Vin',
      category: 'rouge',
      region: 'rhone',
      price: 15.90,
      alcohol: 14.0,
      year: 2021,
      rating: 4.7,
      description: 'Grenache-Syrah, épicé et gourmand.',
      image_main: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=500&fit=crop',
      parker_score: 91,
      badge: 'Nouveau',
      is_new: true
    }
  ];

  // ============================================
  // ÉTAT GLOBAL
  // ============================================
  let newProducts = [];
  let filteredProducts = [];
  let currentFilter = 'all';
  let displayCount = 3;
  let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

  // ============================================
  // INITIALISATION
  // ============================================
  async function initPage() {
    console.log('✨ Initialisation de la page Nouveautés');
    
    try {
      // 1. Charger les produits
      await loadNewProducts();
      
      // 2. Afficher les produits
      displayProducts();
      
      // 3. Attacher les écouteurs (toujours après le chargement du DOM)
      attachEventListeners();
      
      // 4. Mettre à jour le compteur et le badge panier
      updateProductsCount();
      updateCartBadge();
      
      // 5. Initialiser Lucide (au cas où)
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
      
      console.log(`✅ Page Nouveautés initialisée avec ${newProducts.length} produits`);
      
    } catch (error) {
      console.error('❌ Erreur d\'initialisation:', error);
      showFallbackProducts();
    }
  }

  // ============================================
  // CHARGEMENT DES PRODUITS
  // ============================================
  async function loadNewProducts() {
    if (!window.supabase) {
      console.warn('⚠️ Supabase non disponible – utilisation des données de secours');
      showFallbackProducts();
      return;
    }

    try {
      // Charger les bières marquées "nouveauté"
      const { data: bieres, error: bieresError } = await window.supabase
        .from('bieres')
        .select('*')
        .eq('is_active', true)
        .eq('is_new', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (bieresError) console.error('Erreur bières:', bieresError);

      // Charger les vins marqués "nouveauté"
      const { data: vins, error: vinsError } = await window.supabase
        .from('vins')
        .select('*')
        .eq('is_active', true)
        .eq('is_new', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (vinsError) console.error('Erreur vins:', vinsError);

      let products = [];
      if (bieres?.length) {
        products.push(...bieres.map(b => ({ ...b, type: 'beer', productType: 'Bière' })));
      }
      if (vins?.length) {
        products.push(...vins.map(v => ({ ...v, type: 'wine', productType: 'Vin' })));
      }

      if (products.length > 0) {
        newProducts = products;
      } else {
        showFallbackProducts();
      }
    } catch (err) {
      console.error('Exception Supabase:', err);
      showFallbackProducts();
    }
  }

  function showFallbackProducts() {
    console.log('📋 Utilisation des données de secours');
    newProducts = [...FALLBACK_PRODUCTS];
  }

  // ============================================
  // AFFICHAGE DES PRODUITS
  // ============================================
  function displayProducts(reset = true) {
    const grid = document.getElementById('productsGrid');
    const noProductsMsg = document.getElementById('noProductsMessage');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    
    if (!grid) {
      console.error('❌ Élément #productsGrid introuvable');
      return;
    }

    // Appliquer le filtre courant
    filteredProducts = (currentFilter === 'all')
      ? newProducts
      : newProducts.filter(p => p.type === currentFilter);

    console.log(`🔍 Filtre appliqué : ${currentFilter} – ${filteredProducts.length} produits trouvés`);

    // Limiter l'affichage
    const productsToShow = filteredProducts.slice(0, displayCount);

    // Gérer le message "aucun produit"
    if (productsToShow.length === 0) {
      grid.innerHTML = '';
      if (noProductsMsg) noProductsMsg.style.display = 'block';
      if (loadMoreBtn) loadMoreBtn.style.display = 'none';
      return;
    }
    if (noProductsMsg) noProductsMsg.style.display = 'none';

    // Générer le HTML
    grid.innerHTML = productsToShow.map(product => renderProductCard(product)).join('');

    // Recréer les icônes Lucide
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    // Mettre à jour les icônes de favoris
    updateWishlistIcons();

    // Mettre à jour le compteur
    updateProductsCount();

    // Afficher / masquer le bouton "Voir plus"
    if (loadMoreBtn) {
      const hasMore = displayCount < filteredProducts.length;
      loadMoreBtn.style.display = hasMore ? 'inline-flex' : 'none';
    }
  }

  // ============================================
  // RENDU D'UNE CARTE PRODUIT
  // ============================================
  function renderProductCard(product) {
    const badgeHtml = renderBadge(product);
    const price = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(product.price);
    
    const defaultImage = product.type === 'beer' 
      ? '/assets/products/bieres/default.svg'
      : '/assets/products/vins/default.svg';
    
    const productCategory = product.type === 'beer' 
      ? getBeerCategoryLabel(product.category)
      : getWineCategoryLabel(product.category);
    
    const metadata = product.type === 'beer'
      ? `
        <span class="product-meta-item">
          <i data-lucide="flame" size="14"></i>
          ${product.alcohol || '?'}%
        </span>
        <span class="product-meta-item">
          <i data-lucide="package" size="14"></i>
          ${product.volume || '33cl'}
        </span>
        ${product.brewery ? `
          <span class="product-meta-item">
            <i data-lucide="factory" size="14"></i>
            ${product.brewery}
          </span>` : ''}
      `
      : `
        <span class="product-meta-item">
          <i data-lucide="calendar" size="14"></i>
          ${product.year || 'NV'}
        </span>
        <span class="product-meta-item">
          <i data-lucide="map-pin" size="14"></i>
          ${getWineRegionLabel(product.region)}
        </span>
        <span class="product-meta-item">
          <i data-lucide="droplet" size="14"></i>
          ${product.alcohol || '13'}%
        </span>
      `;
    
    const parkerHtml = product.type === 'wine' && product.parker_score >= 90
      ? `<div class="parker-score" title="Score Parker">🍷 ${product.parker_score}</div>`
      : '';
    
    return `
      <article class="product-card" data-product-id="${product.id}" data-category="${product.type}">
        <div class="product-image">
          <img 
            src="${product.image_main || defaultImage}" 
            alt="${product.name}"
            onerror="this.src='${defaultImage}'"
            loading="lazy"
          >
          <button class="wishlist-btn" aria-label="Ajouter aux favoris">
            <i data-lucide="heart" size="18" stroke-width="1.5"></i>
          </button>
          ${badgeHtml}
          ${parkerHtml}
          <span class="product-type-badge">${productCategory}</span>
        </div>
        
        <div class="product-info">
          <div class="product-header">
            <div>
              <span class="product-category">${product.productType}</span>
              <h3 class="product-name">${product.name}</h3>
            </div>
            <div class="product-rating">
              <i data-lucide="star" size="14" fill="currentColor"></i>
              <span>${(product.rating || 0).toFixed(1)}</span>
            </div>
          </div>
          
          <p class="product-description">${truncate(product.description || '', 80)}</p>
          
          <div class="product-meta">
            ${metadata}
          </div>
          
          <div class="product-footer">
            <span class="product-price">${price}</span>
            <button 
              class="btn-add-to-cart" 
              data-product-id="${product.id}"
              data-name="${product.name}"
              data-price="${product.price}"
              data-image="${product.image_main || ''}"
              data-type="${product.type}"
              data-category="${product.category}"
            >
              <i class="fas fa-shopping-cart"></i>
              Ajouter
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function renderBadge(product) {
    if (!product.badge) return '';
    const config = BADGE_CONFIG[product.badge] || { color: 'new', icon: '✨' };
    return `
      <span class="product-badge badge-${config.color}">
        <span class="badge-icon">${config.icon}</span>
        <span class="badge-text">${product.badge}</span>
      </span>
    `;
  }

  // ============================================
  // ÉVÉNEMENTS – ATTACHEMENT ROBUSTE
  // ============================================
  function attachEventListeners() {
    console.log('🔗 Attachement des écouteurs d\'événements');

    // 1. Filtres – on utilise le parent .filter-buttons pour la délégation
    const filterContainer = document.querySelector('.filter-buttons');
    if (filterContainer) {
      filterContainer.addEventListener('click', function(e) {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;
        e.preventDefault();

        const filter = btn.dataset.filter;
        if (!filter) return;

        // Mettre à jour la classe active
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Appliquer le filtre
        currentFilter = filter;
        displayCount = 6; // Réinitialiser le nombre affiché
        displayProducts(true);
      });
      console.log('✅ Délégation des filtres installée');
    } else {
      console.error('❌ Conteneur .filter-buttons introuvable');
    }

    // 2. Bouton "Voir plus"
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
      // Supprimer les anciens écouteurs (évite les doublons)
      const newBtn = loadMoreBtn.cloneNode(true);
      loadMoreBtn.parentNode.replaceChild(newBtn, loadMoreBtn);
      newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        displayCount += 6;
        displayProducts(false);
      });
      console.log('✅ Écouteur "Voir plus" installé');
    }

    // 3. Délégation pour les actions panier / wishlist
    document.removeEventListener('click', handleProductActions); // éviter les doublons
    document.addEventListener('click', handleProductActions);
    console.log('✅ Délégation panier/wishlist installée');
  }

  // Gestionnaire global pour les actions sur les produits
  function handleProductActions(e) {
    // Ajout au panier
    const cartBtn = e.target.closest('.btn-add-to-cart');
    if (cartBtn) {
      e.preventDefault();
      handleAddToCart(cartBtn);
      return;
    }

    // Wishlist
    const wishlistBtn = e.target.closest('.wishlist-btn');
    if (wishlistBtn) {
      e.preventDefault();
      handleWishlistToggle(wishlistBtn);
    }
  }

  // ============================================
  // PANIER
  // ============================================
  function handleAddToCart(button) {
    if (!button) return;
    const productId = button.dataset.productId;
    const product = newProducts.find(p => p.id == productId);
    if (!product) {
      showNotification('Produit non trouvé', 'error');
      return;
    }

    button.disabled = true;
    if (window.CartModule?.addToCart) {
      const success = CartModule.addToCart({
        id: product.id.toString(),
        name: product.name,
        price: product.price,
        image: product.image_main || '',
        category: product.type === 'beer' ? 'bieres' : 'vins',
        type: product.type,
        quantity: 1
      });
      if (success) {
        showAddToCartAnimation(button);
        showNotification(`${product.name} ajouté au panier`, 'success');
        setTimeout(() => button.disabled = false, 2000);
      } else {
        showNotification('Erreur lors de l\'ajout', 'error');
        button.disabled = false;
      }
    } else {
      showNotification('Module panier non disponible', 'error');
      button.disabled = false;
    }
  }

  function showAddToCartAnimation(button) {
    const original = button.innerHTML;
    button.innerHTML = '<i data-lucide="check" size="18"></i>';
    button.style.background = '#10B981';
    setTimeout(() => {
      button.innerHTML = original;
      button.style.background = '#2a3f3a';
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 1000);
  }

  // ============================================
  // WISHLIST
  // ============================================
  function handleWishlistToggle(button) {
    const card = button.closest('.product-card');
    if (!card) return;
    const productId = parseInt(card.dataset.productId);
    const icon = button.querySelector('i');
    if (!icon) return;

    if (wishlist.includes(productId)) {
      wishlist = wishlist.filter(id => id !== productId);
      icon.style.fill = 'none';
      icon.style.strokeWidth = '1.5';
      button.setAttribute('aria-label', 'Ajouter aux favoris');
      showNotification('Retiré des favoris', 'info');
    } else {
      wishlist.push(productId);
      icon.style.fill = 'currentColor';
      icon.style.strokeWidth = '0';
      button.setAttribute('aria-label', 'Retirer des favoris');
      showNotification('Ajouté aux favoris', 'success');
    }
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }

  function updateWishlistIcons() {
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
      const card = btn.closest('.product-card');
      if (!card) return;
      const productId = parseInt(card.dataset.productId);
      const icon = btn.querySelector('i');
      if (!icon) return;
      if (wishlist.includes(productId)) {
        icon.style.fill = 'currentColor';
        icon.style.strokeWidth = '0';
        btn.setAttribute('aria-label', 'Retirer des favoris');
      } else {
        icon.style.fill = 'none';
        icon.style.strokeWidth = '1.5';
        btn.setAttribute('aria-label', 'Ajouter aux favoris');
      }
    });
  }

  // ============================================
  // UTILITAIRES
  // ============================================
  function getBeerCategoryLabel(cat) {
    const map = { 'ipa': 'IPA', 'blonde': 'Blonde', 'ambree': 'Ambrée', 'brune': 'Brune', 'speciales': 'Spéciale', 'saison': 'Saison', 'stout': 'Stout', 'blanche': 'Blanche' };
    return map[cat] || 'Bière';
  }
  function getWineCategoryLabel(cat) {
    const map = { 'rouge': 'Vin Rouge', 'blanc': 'Vin Blanc', 'rose': 'Rosé', 'champagne': 'Champagne', 'bio': 'Bio', 'grandcru': 'Grand Cru' };
    return map[cat] || 'Vin';
  }
  function getWineRegionLabel(reg) {
    const map = { 'bordeaux': 'Bordeaux', 'bourgogne': 'Bourgogne', 'champagne': 'Champagne', 'rhone': 'Vallée du Rhône', 'provence': 'Provence', 'loire': 'Loire', 'alsace': 'Alsace' };
    return map[reg] || reg || 'France';
  }
  function truncate(txt, len) {
    if (!txt) return '';
    return txt.length <= len ? txt : txt.substring(0, len).trim() + '...';
  }
  function updateProductsCount() {
    const span = document.getElementById('productsCount');
    if (span) {
      const count = currentFilter === 'all' ? newProducts.length : newProducts.filter(p => p.type === currentFilter).length;
      span.textContent = count;
    }
  }
  function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    if (badge) {
      try {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const count = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
      } catch (e) {}
    }
  }
  function showNotification(msg, type = 'info') {
    document.querySelectorAll('.notification').forEach(n => n.remove());
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.innerHTML = `<i data-lucide="${type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info'}" size="20"></i><span>${msg}</span>`;
    notif.style.cssText = `position:fixed;top:100px;right:20px;background:${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#2a3f3a'};color:white;padding:var(--space-3) var(--space-4);border-radius:var(--radius-md);display:flex;align-items:center;gap:var(--space-3);box-shadow:var(--shadow-lg);z-index:1000;animation:slideInRight 0.3s ease-out;`;
    document.body.appendChild(notif);
    if (typeof lucide !== 'undefined') lucide.createIcons();
    setTimeout(() => { notif.style.animation = 'slideOutRight 0.3s ease-out'; setTimeout(() => notif.remove(), 300); }, 4000);
  }

  // ============================================
  // DÉMARRAGE
  // ============================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
  } else {
    initPage();
  }

  window.addEventListener('cart-updated', updateCartBadge);

  window.NouveautesPage = { init: initPage, displayProducts, showNotification, updateCartBadge };

  console.log(`
    ╔════════════════════════════════════════════════════════════════════════════════════╗
    ║                    ✨ NOUVEAUTÉS - L'Échoppe Gauloise (corrigé) ✨               ║
    ╚════════════════════════════════════════════════════════════════════════════════════╝
  `);
})();