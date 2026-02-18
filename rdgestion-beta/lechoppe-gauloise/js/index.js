/**
 * PAGE D'ACCUEIL - L'Échoppe Gauloise
 * Version corrigée - Problème de timing résolu
 */

(function() {
  'use strict';

  // ============================================
  // CONFIGURATION
  // ============================================
  const BADGE_CONFIG = {
    'Nouveau': { color: 'info', icon: '✨' },
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

  // ============================================
  // ÉTAT GLOBAL
  // ============================================
  let featuredProducts = [];
  let currentFilter = 'all';
  let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

  // ============================================
  // INITIALISATION DE LA PAGE - VERSION CORRIGÉE
  // ============================================
  async function initPage() {
    console.log('🍺 Initialisation de la page d\'accueil avec Supabase');
    
    // Attendre que Supabase soit disponible
    if (!window.supabase) {
      console.error('Supabase non disponible');
      setTimeout(initPage, 100);
      return;
    }
    
    try {
      // Initialiser Lucide icons pour les éléments statiques
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
      
      // Charger les produits phares
      await loadFeaturedProducts();
      
      // Initialiser les écouteurs d'événements (MAINTENANT que les cartes existent)
      initEventListeners();
      
      // NE PAS appeler updateWishlistIcons ici - fait dans displayFeaturedProducts
      
      // Initialiser Google Translate
      initGoogleTranslate();
      
      console.log('✅ Page d\'accueil initialisée avec', featuredProducts.length, 'produits');
      
    } catch (error) {
      console.error('❌ Erreur d\'initialisation:', error);
      showError('Impossible de charger les produits phares.');
    }
  }

  // ============================================
  // CHARGEMENT DES PRODUITS PHARES
  // ============================================
  async function loadFeaturedProducts() {
    console.log('📦 Chargement des produits phares depuis Supabase...');
    
    if (!window.supabase) {
      console.error('Supabase non initialisé');
      return;
    }

    try {
      // Charger les bières phares
      const { data: bieres, error: bieresError } = await window.supabase
        .from('bieres')
        .select('*')
        .eq('is_active', true)
        .eq('featured', true)
        .order('rating', { ascending: false })
        .limit(4);

      if (bieresError) {
        console.error('Erreur lors du chargement des bières:', bieresError);
      }

      // Charger les vins phares
      const { data: vins, error: vinsError } = await window.supabase
        .from('vins')
        .select('*')
        .eq('is_active', true)
        .eq('featured', true)
        .order('rating', { ascending: false })
        .limit(4);

      if (vinsError) {
        console.error('Erreur lors du chargement des vins:', vinsError);
      }

      // Combiner et mélanger les produits
      let products = [];
      
      if (bieres && bieres.length > 0) {
        products = products.concat(bieres.map(b => ({
          ...b,
          type: 'beer',
          productType: 'Bière'
        })));
      }
      
      if (vins && vins.length > 0) {
        products = products.concat(vins.map(v => ({
          ...v,
          type: 'wine',
          productType: 'Vin'
        })));
      }

      // Trier par rating et prendre les 4 meilleurs
      featuredProducts = products
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 4);

      console.log(`${featuredProducts.length} produits phares chargés`);
      
      // Afficher les produits
      displayFeaturedProducts();
      
    } catch (err) {
      console.error('Exception lors du chargement des produits:', err);
      throw err;
    }
  }

  // ============================================
  // AFFICHAGE DES PRODUITS PHARES
  // ============================================
  function displayFeaturedProducts() {
    const grid = document.querySelector('.products-grid');
    if (!grid) {
      console.error('Élément .products-grid non trouvé');
      return;
    }

    if (featuredProducts.length === 0) {
      // Fallback vers les produits statiques si Supabase est vide
      console.warn('Aucun produit phare trouvé, utilisation du fallback statique');
      return;
    }

    grid.innerHTML = featuredProducts.map(product => 
      renderProductCard(product)
    ).join('');

    // Recréer les icônes Lucide POUR LES NOUVELLES CARTES
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    // Maintenant que les cartes existent, mettre à jour les icônes de wishlist
    updateWishlistIcons();
    
    // Initialiser le filtrage
    initProductFilter();
  }

  // ============================================
  // RENDU D'UNE CARTE PRODUIT (UNIFIÉ)
  // ============================================
  function renderProductCard(product) {
    const badgeHtml = renderBadge(product);
    const price = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(product.price);
    
    // Image par défaut selon le type
    const defaultImage = product.type === 'beer' 
      ? '/assets/products/bieres/default.svg'
      : '/assets/products/vins/default.svg';
    
    // Type de produit (catégorie)
    const productCategory = product.type === 'beer' 
      ? getBeerCategoryLabel(product.category)
      : getWineCategoryLabel(product.category);
    
    // Métadonnées spécifiques
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
    
    // Score Parker pour les vins
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
    
    const config = BADGE_CONFIG[product.badge] || { color: 'info', icon: '✨' };
    const color = product.badge_color || config.color;
    
    return `
      <span class="product-badge badge-${color}">
        <span class="badge-icon">${config.icon}</span>
        <span class="badge-text">${product.badge}</span>
      </span>
    `;
  }

  // ============================================
  // GESTION DES FILTRES
  // ============================================
  function initProductFilter() {
    const navDots = document.querySelectorAll('.nav-dot');
    if (!navDots.length) return;
    
    navDots.forEach(dot => {
      dot.addEventListener('click', handleProductFilter);
    });
  }

  function handleProductFilter(e) {
    const filter = e.currentTarget.dataset.filter;
    
    // Mettre à jour les points actifs
    document.querySelectorAll('.nav-dot').forEach(dot => {
      dot.classList.toggle('active', dot === e.currentTarget);
    });
    
    // Filtrer les produits
    filterProducts(filter);
  }

  function filterProducts(filter) {
    currentFilter = filter;
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
      const category = card.dataset.category;
      const shouldShow = filter === 'all' || category === filter;
      
      if (shouldShow) {
        card.style.display = 'block';
        setTimeout(() => {
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, 100);
      } else {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
          card.style.display = 'none';
        }, 300);
      }
    });
  }

  // ============================================
  // GESTION DES ÉVÉNEMENTS - VERSION CORRIGÉE
  // ============================================
  function initEventListeners() {
    // DÉLÉGATION D'ÉVÉNEMENTS pour éviter les problèmes de timing
    document.addEventListener('click', function(e) {
      // Boutons "Ajouter au panier"
      if (e.target.closest('.btn-add-to-cart')) {
        e.preventDefault();
        e.stopPropagation();
        
        const button = e.target.closest('.btn-add-to-cart');
        handleAddToCart(button);
      }
      
      // Boutons "Favoris"
      if (e.target.closest('.wishlist-btn')) {
        e.preventDefault();
        e.stopPropagation();
        
        const button = e.target.closest('.wishlist-btn');
        handleWishlistToggle(button);
      }
    });

    // Navigation fluide
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', handleSmoothScroll);
    });

    // Formulaire newsletter
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
      newsletterForm.addEventListener('submit', handleNewsletterSubmit);
    }
    
    // Écouter les mises à jour du panier
    window.addEventListener('cart-updated', () => {
      console.log('🔄 Panier mis à jour sur la page d\'accueil');
    });
  }

  // ============================================
  // PANIER - VERSION CORRIGÉE
  // ============================================
 function handleAddToCart(button) {
  if (!button) return;
  
  const productId = button.dataset.productId;
  
  // Vérifier que l'ID est valide
  if (!productId || productId === 'undefined' || productId === 'NaN') {
    console.error('❌ ID produit invalide:', productId);
    showNotification('ID produit invalide', 'error');
    return;
  }
  
  // Convertir l'ID en nombre (attention aux chaînes)
  const id = parseInt(productId);
  
  // Trouver le produit dans les produits chargés
  const product = featuredProducts.find(p => 
    p.id === id || 
    p.id.toString() === productId || 
    p.id === productId
  );
  
  if (!product) {
    console.error('❌ Produit non trouvé avec ID:', productId, 'Type:', typeof productId);
    console.error('IDs disponibles:', featuredProducts.map(p => ({id: p.id, type: typeof p.id})));
    showNotification('Produit non trouvé', 'error');
    return;
  }

  console.log('➕ Ajout au panier depuis index.js:', product.name);
  
  // Désactiver le bouton immédiatement
  button.disabled = true;
  
  // Utiliser le module panier commun
  if (window.CartModule && CartModule.addToCart) {
    const productData = {
      id: product.id.toString(), // Toujours utiliser string pour l'ID
      name: product.name,
      price: product.price,
      image: product.image_main || '',
      category: product.type === 'beer' ? 'bieres' : 'vins',
      type: product.type,
      rating: product.rating,
      quantity: 1
    };
    
    const success = CartModule.addToCart(productData);
    
    if (success) {
      // Animation du bouton
      showAddToCartAnimation(button);
      showNotification(`${product.name} ajouté au panier`, 'success');
      
      // Réactiver après animation
      setTimeout(() => {
        button.disabled = false;
      }, 2000);
    } else {
      showNotification('Erreur lors de l\'ajout au panier', 'error');
      button.disabled = false;
    }
  } else {
    // Fallback si le module n'est pas disponible
    console.error('❌ CartModule non disponible');
    showNotification('Erreur système', 'error');
    button.disabled = false;
  }
}

  // ============================================
  // WISHLIST - VERSION CORRIGÉE (évite l'erreur "style")
  // ============================================
  function handleWishlistToggle(button) {
    if (!button) return;
    
    const productCard = button.closest('.product-card');
    if (!productCard) return;
    
    const productId = parseInt(productCard.dataset.productId);
    const icon = button.querySelector('i');
    
    if (!icon) return;
    
    if (wishlist.includes(productId)) {
      // Retirer des favoris
      wishlist = wishlist.filter(id => id !== productId);
      icon.style.fill = 'none';
      icon.style.strokeWidth = '1.5';
      button.setAttribute('aria-label', 'Ajouter aux favoris');
      showNotification('Retiré des favoris', 'info');
    } else {
      // Ajouter aux favoris
      wishlist.push(productId);
      icon.style.fill = 'currentColor';
      icon.style.strokeWidth = '0';
      button.setAttribute('aria-label', 'Retirer des favoris');
      showNotification('Ajouté aux favoris', 'success');
    }
    
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }

  function updateWishlistIcons() {
    // VÉRIFIER si les cartes existent avant de manipuler
    const wishlistButtons = document.querySelectorAll('.wishlist-btn');
    if (wishlistButtons.length === 0) {
      console.log('⚠️ Aucun bouton wishlist trouvé - cartes non encore créées');
      return;
    }
    
    wishlistButtons.forEach(button => {
      const productCard = button.closest('.product-card');
      if (!productCard) return;
      
      const productId = parseInt(productCard.dataset.productId);
      const icon = button.querySelector('i');
      
      if (!icon) return;
      
      // SAFE: Vérifier que l'élément existe avant de manipuler style
      if (wishlist.includes(productId)) {
        icon.style.fill = 'currentColor';
        icon.style.strokeWidth = '0';
        button.setAttribute('aria-label', 'Retirer des favoris');
      } else {
        icon.style.fill = 'none';
        icon.style.strokeWidth = '1.5';
        button.setAttribute('aria-label', 'Ajouter aux favoris');
      }
    });
  }

  // ============================================
  // UTILITAIRES
  // ============================================
  function getBeerCategoryLabel(category) {
    const labels = {
      'ipa': 'IPA',
      'blonde': 'Blonde',
      'ambree': 'Ambrée',
      'brune': 'Brune',
      'speciales': 'Spéciale',
      'saison': 'Saison',
      'stout': 'Stout',
      'blanche': 'Blanche'
    };
    return labels[category] || 'Bière';
  }

  function getWineCategoryLabel(category) {
    const labels = {
      'rouge': 'Vin Rouge',
      'blanc': 'Vin Blanc',
      'rose': 'Rosé',
      'champagne': 'Champagne',
      'bio': 'Bio',
      'grandcru': 'Grand Cru'
    };
    return labels[category] || 'Vin';
  }

  function getWineRegionLabel(region) {
    const regions = {
      'bordeaux': 'Bordeaux',
      'bourgogne': 'Bourgogne',
      'champagne': 'Champagne',
      'rhone': 'Vallée du Rhône',
      'provence': 'Provence',
      'loire': 'Loire',
      'alsace': 'Alsace'
    };
    return regions[region] || region || 'France';
  }

  function truncate(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }

  // ============================================
  // FONCTIONS D'ANIMATION ET UI
  // ============================================
  function showAddToCartAnimation(button) {
    const originalContent = button.innerHTML;
    const originalBackground = button.style.background;
    
    button.innerHTML = '<i data-lucide="check" size="18"></i>';
    button.style.background = '#10B981';
    button.style.transform = 'scale(0.9)';
    
    setTimeout(() => {
      button.innerHTML = originalContent;
      button.style.background = originalBackground;
      button.style.transform = 'scale(1)';
      
      // Recréer les icônes Lucide
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }, 1000);
  }

  function showNotification(message, type = 'info') {
    // Supprimer les notifications existantes
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    // Créer la notification
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
      <i data-lucide="${getNotificationIcon(type)}" size="20"></i>
      <span>${message}</span>
    `;
    
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: ${getNotificationColor(type)};
      color: white;
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      gap: var(--space-3);
      box-shadow: var(--shadow-lg);
      z-index: 1000;
      animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  function getNotificationIcon(type) {
    switch (type) {
      case 'success': return 'check-circle';
      case 'error': return 'alert-circle';
      case 'warning': return 'alert-triangle';
      default: return 'info';
    }
  }

  function getNotificationColor(type) {
    switch (type) {
      case 'success': return '#10B981';
      case 'error': return '#EF4444';
      case 'warning': return '#F59E0B';
      default: return 'var(--primary)';
    }
  }

  function handleNewsletterSubmit(e) {
    e.preventDefault();
    
    const form = e.currentTarget;
    const emailInput = form.querySelector('input[type="email"]');
    const email = emailInput.value.trim();
    
    if (!isValidEmail(email)) {
      showNotification('Veuillez entrer un email valide', 'error');
      emailInput.focus();
      return;
    }
    
    const subscribers = JSON.parse(localStorage.getItem('newsletterSubscribers')) || [];
    
    if (!subscribers.includes(email)) {
      subscribers.push(email);
      localStorage.setItem('newsletterSubscribers', JSON.stringify(subscribers));
      
      showNotification('Merci pour votre inscription !', 'success');
      form.reset();
    } else {
      showNotification('Cet email est déjà inscrit', 'info');
    }
  }

  function handleSmoothScroll(e) {
    const href = e.currentTarget.getAttribute('href');
    
    if (href === '#' || !href.startsWith('#')) return;
    
    e.preventDefault();
    
    const targetId = href.substring(1);
    const targetElement = document.getElementById(targetId);
    
    if (targetElement) {
      window.scrollTo({
        top: targetElement.offsetTop - 100,
        behavior: 'smooth'
      });
    }
  }

  function initGoogleTranslate() {
    if (typeof google !== 'undefined' && google.translate) {
      const style = document.createElement('style');
      style.textContent = `
        .goog-te-banner-frame { display: none !important; }
        .goog-te-menu-value { color: var(--text-primary) !important; }
        .skiptranslate { display: none !important; }
      `;
      document.head.appendChild(style);
    }
  }

  function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  function showError(message) {
    const grid = document.querySelector('.products-grid');
    if (grid) {
      grid.innerHTML = `
        <div class="error-message" style="grid-column: 1/-1; text-align: center; padding: 3rem;">
          <i data-lucide="alert-circle" size="48"></i>
          <h3>Erreur de chargement</h3>
          <p>${message}</p>
        </div>
      `;
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }
  }

  // ============================================
  // DÉMARRAGE - VERSION CORRIGÉE
  // ============================================
  // Attendre que le DOM soit chargé
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      // Donner un peu de temps à Supabase de se charger
      setTimeout(initPage, 1000);
    });
  } else {
    // DOM déjà chargé, attendre un peu
    setTimeout(initPage, 1000);
  }

  // Exposer globalement
  window.HomePage = {
    init: initPage,
    loadFeaturedProducts,
    handleAddToCart,
    showNotification,
    updateWishlistIcons
  };

  console.log(`
    ╔════════════════════════════════════════════════════════════════════════════════════╗
    ║                                                                                    ║
    ║                    🍺 PAGE D'ACCUEIL AVEC SUPABASE 🍷                             ║
    ║                                                                                    ║
    ║               L'Échoppe Gauloise - Excellence Française                            ║ 
    ║           Page pédagogique développée par Rodulfo DOMINGUEZ                        ║
    ║                                                                                    ║
    ╚════════════════════════════════════════════════════════════════════════════════════╝
  `);

})();