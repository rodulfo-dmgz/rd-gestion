/**
 * PAGE PROMOTIONS - L'Échoppe Gauloise
 * Version corrigée – Gestion des erreurs Supabase 400 (colonnes manquantes)
 */

(function() {
  'use strict';

  // ============================================
  // CONFIGURATION
  // ============================================
  const BADGE_CONFIG = {
    'Promo': { color: 'promo', icon: '🏷️' },
    'Promotion': { color: 'promo', icon: '🏷️' },
    'Soldes': { color: 'promo', icon: '🏷️' },
    '-20%': { color: 'promo', icon: '🔥' },
    '-30%': { color: 'promo', icon: '🔥' },
    '-50%': { color: 'promo', icon: '⚡' }
  };

  // Données de secours – produits en promotion
  const FALLBACK_PRODUCTS = [
    {
      id: 201,
      name: 'Blonde Tradition',
      type: 'beer',
      productType: 'Bière',
      category: 'blonde',
      original_price: 5.90,
      price: 4.50,
      discount: '-24%',
      alcohol: 5.2,
      volume: '33cl',
      brewery: 'Brasserie du Sud',
      rating: 4.5,
      description: 'Blonde équilibrée, notes maltées, offre spéciale.',
      image_main: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&h=500&fit=crop',
      badge: 'Promo'
    },
    {
      id: 202,
      name: 'IPA Sauvage',
      type: 'beer',
      productType: 'Bière',
      category: 'ipa',
      original_price: 6.90,
      price: 5.20,
      discount: '-25%',
      alcohol: 6.5,
      volume: '33cl',
      brewery: 'Brasserie Celtique',
      rating: 4.8,
      description: 'IPA fruitée, houblons aromatiques, édition limitée.',
      image_main: 'https://images.unsplash.com/photo-1586993451228-09818021e309?w=400&h=500&fit=crop',
      badge: '-25%'
    },
    {
      id: 203,
      name: 'Château Grand Millésime 2019',
      type: 'wine',
      productType: 'Vin',
      category: 'rouge',
      region: 'bordeaux',
      original_price: 32.00,
      price: 25.90,
      discount: '-19%',
      alcohol: 13.5,
      year: 2019,
      rating: 4.7,
      description: 'Bordeaux grand cru, tanins élégants, offre exceptionnelle.',
      image_main: 'https://images.unsplash.com/photo-1586370434639-0fe43b2d32e6?w=400&h=500&fit=crop',
      parker_score: 94,
      badge: 'Promo'
    },
    {
      id: 204,
      name: 'Stout Irlandaise',
      type: 'beer',
      productType: 'Bière',
      category: 'stout',
      original_price: 5.90,
      price: 4.90,
      discount: '-17%',
      alcohol: 7.2,
      volume: '50cl',
      brewery: 'Brasserie Atlantique',
      rating: 4.6,
      description: 'Stout crémeuse, arômes de café, prix doux.',
      image_main: 'https://images.unsplash.com/photo-1579202673506-ca3ce28943ef?w=400&h=500&fit=crop',
      badge: '-17%'
    },
    {
      id: 205,
      name: 'Sancerre La Roseraie 2022',
      type: 'wine',
      productType: 'Vin',
      category: 'blanc',
      region: 'loire',
      original_price: 21.50,
      price: 17.90,
      discount: '-17%',
      alcohol: 12.5,
      year: 2022,
      rating: 4.6,
      description: 'Sancerre minéral, notes d\'agrumes, promotion.',
      image_main: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=400&h=500&fit=crop',
      parker_score: 91,
      badge: 'Promo'
    },
    {
      id: 206,
      name: 'Côtes-du-Rhône Prestige',
      type: 'wine',
      productType: 'Vin',
      category: 'rouge',
      region: 'rhone',
      original_price: 18.00,
      price: 14.50,
      discount: '-20%',
      alcohol: 14.0,
      year: 2021,
      rating: 4.5,
      description: 'Grenache-Syrah, épicé, rapport qualité/prix.',
      image_main: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=500&fit=crop',
      badge: '-20%'
    },
    {
      id: 207,
      name: 'Triple Belge',
      type: 'beer',
      productType: 'Bière',
      category: 'speciales',
      original_price: 6.50,
      price: 5.30,
      discount: '-18%',
      alcohol: 8.5,
      volume: '33cl',
      brewery: 'Brasserie du Nord',
      rating: 4.7,
      description: 'Triple blonde, refermentée en bouteille.',
      image_main: 'https://images.unsplash.com/photo-1586993451228-09818021e309?w=400&h=500&fit=crop',
      badge: 'Promo'
    },
    {
      id: 208,
      name: 'Champagne Brut Réserve',
      type: 'wine',
      productType: 'Vin',
      category: 'champagne',
      region: 'champagne',
      original_price: 35.00,
      price: 29.90,
      discount: '-15%',
      alcohol: 12.0,
      year: 'NV',
      rating: 4.8,
      description: 'Champagne équilibré, bulles fines, prix fête.',
      image_main: 'https://images.unsplash.com/photo-1606297226969-9a8b7dcaa725?w=400&h=500&fit=crop',
      parker_score: 90,
      badge: '-15%'
    }
  ];

  // ============================================
  // ÉTAT GLOBAL
  // ============================================
  let promosProducts = [];
  let filteredProducts = [];
  let currentFilter = 'all';
  let displayCount = 6;
  let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

  // ============================================
  // INITIALISATION
  // ============================================
  async function initPage() {
    console.log('🏷️ Initialisation de la page Promotions');
    
    try {
      await loadPromosProducts();
      displayProducts();
      attachEventListeners();
      updateProductsCount();
      updateCartBadge();
      
      if (typeof lucide !== 'undefined') lucide.createIcons();
      
      console.log(`✅ Page Promotions initialisée avec ${promosProducts.length} produits`);
    } catch (error) {
      console.error('❌ Erreur d\'initialisation:', error);
      showFallbackProducts();
    }
  }

  // ============================================
  // CHARGEMENT DEPUIS SUPABASE (avec gestion d'erreur 400)
  // ============================================
  async function loadPromosProducts() {
    // Si Supabase n'est pas dispo, fallback immédiat
    if (!window.supabase) {
      console.warn('⚠️ Supabase non disponible – utilisation des données de secours');
      showFallbackProducts();
      return;
    }

    try {
      // Tenter de charger les bières avec le filtre is_promotion
      // Si la colonne n'existe pas, Supabase renvoie 400 -> on catch et on passe au fallback
      let bieres = [];
      let vins = [];

      try {
        const { data, error } = await window.supabase
          .from('bieres')
          .select('*')
          .eq('is_active', true)
          .eq('is_promotion', true)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (error) {
          // Erreur 400 = colonne manquante, on ignore silencieusement
          if (error.code === 'PGRST116' || error.status === 400) {
            console.debug('ℹ️ Colonne is_promotion inexistante dans "bieres" – utilisation du fallback');
          } else {
            console.warn('Erreur Supabase (bières):', error.message);
          }
        } else {
          bieres = data || [];
        }
      } catch (e) {
        // Ignorer et continuer
        console.debug('Exception lors du chargement des bières promotionnelles:', e.message);
      }

      try {
        const { data, error } = await window.supabase
          .from('vins')
          .select('*')
          .eq('is_active', true)
          .eq('is_promotion', true)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (error) {
          if (error.code === 'PGRST116' || error.status === 400) {
            console.debug('ℹ️ Colonne is_promotion inexistante dans "vins" – utilisation du fallback');
          } else {
            console.warn('Erreur Supabase (vins):', error.message);
          }
        } else {
          vins = data || [];
        }
      } catch (e) {
        console.debug('Exception lors du chargement des vins promotionnels:', e.message);
      }

      // Construire la liste des produits
      let products = [];
      
      if (bieres.length > 0) {
        products.push(...bieres.map(b => ({ 
          ...b, 
          type: 'beer', 
          productType: 'Bière',
          // Si les champs promo n'existent pas, on génère des données factices
          original_price: b.original_price || (b.price ? b.price * 1.2 : 5.90),
          discount: b.discount || (b.original_price ? calculateDiscount(b.original_price, b.price) : '-20%'),
          badge: b.badge || 'Promo'
        })));
      }

      if (vins.length > 0) {
        products.push(...vins.map(v => ({ 
          ...v, 
          type: 'wine', 
          productType: 'Vin',
          original_price: v.original_price || (v.price ? v.price * 1.2 : 18.00),
          discount: v.discount || (v.original_price ? calculateDiscount(v.original_price, v.price) : '-20%'),
          badge: v.badge || 'Promo'
        })));
      }

      // Si on a récupéré au moins un produit, on les utilise ; sinon fallback
      if (products.length > 0) {
        promosProducts = products;
        console.log(`📦 ${products.length} produits en promotion chargés depuis Supabase`);
      } else {
        console.log('📋 Aucun produit promotionnel trouvé – utilisation des données de secours');
        showFallbackProducts();
      }

    } catch (err) {
      console.debug('Erreur générale lors du chargement Supabase:', err.message);
      showFallbackProducts();
    }
  }

  // Calcule le pourcentage de réduction
  function calculateDiscount(original, current) {
    if (!original || !current || original <= 0) return '-20%';
    const reduction = Math.round((1 - current / original) * 100);
    return `-${reduction}%`;
  }

  function showFallbackProducts() {
    console.log('📋 Utilisation des données de secours (8 produits)');
    promosProducts = [...FALLBACK_PRODUCTS];
  }

  // ============================================
  // AFFICHAGE
  // ============================================
  function displayProducts(reset = true) {
    const grid = document.getElementById('productsGrid');
    const noProductsMsg = document.getElementById('noProductsMessage');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    
    if (!grid) {
      console.error('❌ Élément #productsGrid introuvable');
      return;
    }

    filteredProducts = (currentFilter === 'all')
      ? promosProducts
      : promosProducts.filter(p => p.type === currentFilter);

    console.log(`🔍 Filtre appliqué : ${currentFilter} – ${filteredProducts.length} produits trouvés`);

    const productsToShow = filteredProducts.slice(0, displayCount);

    if (productsToShow.length === 0) {
      grid.innerHTML = '';
      if (noProductsMsg) noProductsMsg.style.display = 'block';
      if (loadMoreBtn) loadMoreBtn.style.display = 'none';
      return;
    }
    if (noProductsMsg) noProductsMsg.style.display = 'none';

    grid.innerHTML = productsToShow.map(product => renderProductCard(product)).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();

    updateWishlistIcons();
    updateProductsCount();

    if (loadMoreBtn) {
      loadMoreBtn.style.display = displayCount < filteredProducts.length ? 'inline-flex' : 'none';
    }
  }

  // ============================================
  // RENDU CARTE PRODUIT (version promotion)
  // ============================================
  function renderProductCard(product) {
    const badgeHtml = renderBadge(product);
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

    // Prix original et promo
    const originalPrice = product.original_price 
      ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(product.original_price)
      : '';
    
    const promoPrice = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(product.price);
    
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
            <div class="product-price-container">
              ${originalPrice ? `<span class="original-price">${originalPrice}</span>` : ''}
              <span class="promo-price">${promoPrice}</span>
            </div>
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
    if (!product.badge && !product.discount) return '';
    
    let badgeText = product.discount || product.badge || 'Promo';
    let config = BADGE_CONFIG[badgeText] || BADGE_CONFIG['Promo'] || { color: 'promo', icon: '🏷️' };
    
    return `
      <span class="product-badge badge-${config.color}">
        <span class="badge-icon">${config.icon}</span>
        <span class="badge-text">${badgeText}</span>
      </span>
    `;
  }

  // ============================================
  // ÉVÉNEMENTS
  // ============================================
  function attachEventListeners() {
    console.log('🔗 Attachement des écouteurs d\'événements');

    // Filtres – délégation
    const filterContainer = document.querySelector('.filter-buttons');
    if (filterContainer) {
      filterContainer.addEventListener('click', function(e) {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;
        e.preventDefault();

        const filter = btn.dataset.filter;
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        currentFilter = filter;
        displayCount = 6;
        displayProducts(true);
      });
    }

    // Bouton Voir plus
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
      const newBtn = loadMoreBtn.cloneNode(true);
      loadMoreBtn.parentNode.replaceChild(newBtn, loadMoreBtn);
      newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        displayCount += 6;
        displayProducts(false);
      });
    }

    // Délégation globale pour panier / wishlist
    document.removeEventListener('click', handleProductActions);
    document.addEventListener('click', handleProductActions);
  }

  function handleProductActions(e) {
    const cartBtn = e.target.closest('.btn-add-to-cart');
    if (cartBtn) {
      e.preventDefault();
      handleAddToCart(cartBtn);
      return;
    }

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
    const product = promosProducts.find(p => p.id == productId);
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
        original_price: product.original_price,
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
      button.style.background = '#9e2a2b';
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
      const count = currentFilter === 'all' ? promosProducts.length : promosProducts.filter(p => p.type === currentFilter).length;
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
    notif.style.cssText = `position:fixed;top:100px;right:20px;background:${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#9e2a2b'};color:white;padding:var(--space-3) var(--space-4);border-radius:var(--radius-md);display:flex;align-items:center;gap:var(--space-3);box-shadow:var(--shadow-lg);z-index:1000;animation:slideInRight 0.3s ease-out;`;
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

  window.PromotionsPage = { init: initPage, displayProducts, showNotification, updateCartBadge };

  console.log(`
    ╔════════════════════════════════════════════════════════════════════════════════════╗
    ║                    🏷️ PROMOTIONS - L'Échoppe Gauloise  🏷️                         ║
    ║                                                                                    ║
    ║               Document pédagogique créé par Rodulfo DOMINGUEZ                      ║ 
    ║                                                                                    ║
    ╚════════════════════════════════════════════════════════════════════════════════════╝
  `);

})();