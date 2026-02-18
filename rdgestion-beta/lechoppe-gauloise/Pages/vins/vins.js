/**
 * VINS MODULE - Supabase Integration
 * Système de badges unifié
 * L'Echoppe Gauloise
 */

(function(window) {
  'use strict';

  // ============================================
  // CONFIGURATION DES BADGES
  // ============================================
  const BADGE_CONFIG = {
    'Grand Cru': { color: 'primary', icon: '👑' },
    'Premier Cru': { color: 'primary', icon: '⭐' },
    'Bio': { color: 'success', icon: '🌱' },
    'Nouveau': { color: 'info', icon: '✨' },
    'Rare': { color: 'warning', icon: '💎' },
    'Prestige': { color: 'primary', icon: '🏆' },
    'Meilleur rapport': { color: 'success', icon: '💰' },
    'Celebration': { color: 'danger', icon: '🎉' },
    'Parker 96+': { color: 'warning', icon: '🍷' }
  };

  // ============================================
  // ÉTAT GLOBAL
  // ============================================
  let currentFilters = {
    category: 'all',
    region: 'all',
    year: 'all'
  };
  let allVins = [];
  let currentPage = 1;
  const itemsPerPage = 4;

  // ============================================
  // INITIALISATION DE LA PAGE
  // ============================================
  async function initPage() {
    console.log('Initialisation de la page Vins...');
    
    // Attendre que Supabase soit disponible
    if (!window.supabase) {
      console.error('Supabase non disponible');
      setTimeout(initPage, 100);
      return;
    }
    
    try {
      // Charger tous les vins
      allVins = await loadVins();
      console.log(`${allVins.length} vins chargés`);
      
      // Initialiser les filtres
      initFilters();
      
      // Initialiser la pagination
      initPagination();
      
      // Afficher la première page
      displayCurrentPage();
      
      // Initialiser les boutons d'ajout au panier
      initAddToCartButtons();
      
    } catch (error) {
      console.error('Erreur d\'initialisation:', error);
      showError('Impossible de charger les vins. Veuillez réessayer.');
    }
  }

  // ============================================
  // CHARGEMENT DES VINS
  // ============================================
  async function loadVins() {
    console.log('Chargement des vins depuis Supabase...');
    
    if (!window.supabase) {
      console.error('Supabase non initialisé');
      return [];
    }

    try {
      const { data, error } = await window.supabase
        .from('vins')
        .select('*')
        .eq('is_active', true)
        .order('featured', { ascending: false })
        .order('rating', { ascending: false });

      if (error) {
        console.error('Erreur Supabase:', error);
        return [];
      }

      return data || [];

    } catch (err) {
      console.error('Exception:', err);
      return [];
    }
  }

  // ============================================
  // FILTRAGE ET TRI
  // ============================================
  function getFilteredVins() {
    let filtered = [...allVins];

    // Filtre par catégorie
    if (currentFilters.category && currentFilters.category !== 'all') {
      filtered = filtered.filter(vin => vin.category === currentFilters.category);
    }

    // Filtre par région
    if (currentFilters.region && currentFilters.region !== 'all') {
      filtered = filtered.filter(vin => vin.region === currentFilters.region);
    }

    // Filtre par année
    if (currentFilters.year && currentFilters.year !== 'all') {
      if (currentFilters.year === '2020') {
        filtered = filtered.filter(vin => vin.year >= 2020);
      } else if (currentFilters.year === '2018') {
        filtered = filtered.filter(vin => vin.year >= 2018 && vin.year <= 2019);
      } else if (currentFilters.year === '2016') {
        filtered = filtered.filter(vin => vin.year >= 2016 && vin.year <= 2017);
      } else if (currentFilters.year === '2015') {
        filtered = filtered.filter(vin => vin.year <= 2015);
      }
    }

    // Tri
    const sortBy = document.getElementById('sort-filter')?.value || 'popular';
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'year-desc':
        filtered.sort((a, b) => b.year - a.year);
        break;
      default:
        filtered.sort((a, b) => b.featured - a.featured || b.rating - a.rating);
    }

    return filtered;
  }

  // ============================================
  // AFFICHAGE
  // ============================================
  function displayCurrentPage() {
    const grid = document.getElementById('vinsGrid');
    if (!grid) {
      console.error('Élément #vinsGrid non trouvé');
      return;
    }

    const filteredVins = getFilteredVins();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageVins = filteredVins.slice(startIndex, endIndex);

    // Mettre à jour la pagination
    updatePagination(filteredVins.length);

    // Afficher les vins
    if (pageVins.length === 0) {
      grid.innerHTML = `
        <div class="no-results">
          <i data-lucide="wine" size="48"></i>
          <h3>Aucun vin trouvé</h3>
          <p>Essayez de modifier vos filtres</p>
          <button class="btn btn-primary" onclick="resetFilters()">
            Réinitialiser les filtres
          </button>
        </div>
      `;
      lucide.createIcons();
    } else {
      grid.innerHTML = pageVins.map(vin => renderVinCard(vin)).join('');
      lucide.createIcons();
      initAddToCartButtons(); // Réinitialiser les boutons
    }
  }

  function renderVinCard(vin) {
    const badgeHtml = renderBadge(vin);
    const parkerHtml = vin.parker_score >= 90 ? 
      `<div class="parker-score" title="Score Parker">🍷 ${vin.parker_score}</div>` : '';
    
    // Formatage du prix
    const price = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(vin.price);
    
    return `
      <article class="wine-card" data-id="${vin.id}" data-category="${vin.category}">
        <div class="wine-image-container">
          <img 
            src="${vin.image_main || '/assets/products/vins/default.svg'}" 
            alt="${vin.name}"
            onerror="this.src='/assets/products/vins/default.svg'"
            loading="lazy"
          >
          ${badgeHtml}
          ${parkerHtml}
        </div>
        
        <div class="wine-info">
          <div class="wine-header">
            <span class="wine-type">${vin.type || 'Vin'}</span>
            <span class="wine-year">${vin.year || 'NV'}</span>
          </div>
          
          <h3 class="wine-name">${vin.name}</h3>
          
          <p class="wine-description">${truncate(vin.description || '', 100)}</p>
          
          <div class="wine-meta">
            <span class="wine-region">📍 ${formatRegion(vin.region)}</span>
            <span class="wine-volume">${vin.volume || '75cl'}</span>
            <span class="wine-alcohol">${vin.alcohol || '13'}% vol.</span>
          </div>
          
          <div class="wine-footer">
            <div class="wine-rating">
              ${renderStars(vin.rating || 0)}
              <span class="rating-value">${(vin.rating || 0).toFixed(1)}</span>
            </div>
            
            <div class="wine-price-section">
              <span class="wine-price">${price}</span>
              <button 
                class="btn-add-to-cart" 
                data-id="${vin.id}"
                data-name="${vin.name}"
                data-price="${vin.price}"
                data-image="${vin.image_main || ''}"
              >
                <i class="fas fa-shopping-cart"></i>
                Ajouter
              </button>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  function renderBadge(vin) {
    if (!vin.badge) return '';
    
    const config = BADGE_CONFIG[vin.badge] || { color: 'info', icon: '✨' };
    const color = vin.badge_color || config.color;
    
    return `
      <div class="wine-badge badge-${color}" title="${vin.badge}">
        <span class="badge-icon">${config.icon}</span>
        <span class="badge-text">${vin.badge}</span>
      </div>
    `;
  }

  function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let html = '';
    for (let i = 0; i < fullStars; i++) html += '<i class="fas fa-star"></i>';
    if (hasHalfStar) html += '<i class="fas fa-star-half-alt"></i>';
    for (let i = 0; i < emptyStars; i++) html += '<i class="far fa-star"></i>';
    
    return html;
  }

  // ============================================
  // GESTION DES FILTRES
  // ============================================
  function initFilters() {
    // Filtres rapides
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        // Retirer la classe active de tous les boutons
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        // Ajouter active au bouton cliqué
        this.classList.add('active');
        
        // Mettre à jour le filtre
        const filter = this.dataset.filter;
        currentFilters.category = filter === 'all' ? 'all' : filter;
        currentPage = 1;
        displayCurrentPage();
      });
    });

    // Filtres avancés
    document.getElementById('region-filter')?.addEventListener('change', function() {
      currentFilters.region = this.value;
      currentPage = 1;
      displayCurrentPage();
    });

    document.getElementById('year-filter')?.addEventListener('change', function() {
      currentFilters.year = this.value;
      currentPage = 1;
      displayCurrentPage();
    });

    document.getElementById('sort-filter')?.addEventListener('change', function() {
      currentPage = 1;
      displayCurrentPage();
    });
  }

  // ============================================
  // PAGINATION
  // ============================================
  function initPagination() {
    document.getElementById('prevPage')?.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        displayCurrentPage();
      }
    });

    document.getElementById('nextPage')?.addEventListener('click', () => {
      const filteredVins = getFilteredVins();
      const totalPages = Math.ceil(filteredVins.length / itemsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        displayCurrentPage();
      }
    });
  }

  function updatePagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const currentSpan = document.querySelector('.pagination-current');
    const totalSpan = document.querySelector('.pagination-total');

    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
    if (currentSpan) currentSpan.textContent = currentPage;
    if (totalSpan) totalSpan.textContent = totalPages || 1;
  }

  // ============================================
// PANIER - VERSION CORRIGÉE
// ============================================

function initAddToCartButtons() {
  // Supprimer d'abord tous les écouteurs existants pour éviter les doublons
  document.querySelectorAll('.btn-add-to-cart').forEach(btn => {
    btn.replaceWith(btn.cloneNode(true));
  });
  
  // Attacher les nouveaux écouteurs
  document.querySelectorAll('.btn-add-to-cart').forEach(btn => {
    btn.addEventListener('click', handleAddToCart, { once: false });
  });
}

// Nouvelle fonction pour gérer l'ajout au panier
async function handleAddToCart(e) {
  e.stopPropagation();
  e.preventDefault();
  
  const button = e.currentTarget;
  const id = button.dataset.id;
  const name = button.dataset.name;
  const price = parseFloat(button.dataset.price);
  const image = button.dataset.image;
  
  // Désactiver le bouton immédiatement pour éviter les clics multiples
  button.disabled = true;
  
  // Feedback visuel immédiat
  showAddToCartAnimation(button, name);
  
  try {
    // Utiliser CartModule si disponible
    if (window.CartModule && typeof window.CartModule.addToCart === 'function') {
      const productData = {
        id: id,
        name: name,
        price: price,
        image: image,
        category: 'Vins',
        type: button.dataset.type,
        alcohol: button.dataset.alcohol,
        volume: button.dataset.volume,
        quantity: 1
      };
      
      const success = window.CartModule.addToCart(productData);
      if (!success) {
        console.warn('Échec via CartModule, fallback localStorage');
        await addToCartFallback(productData);
      }
    } else if (window.CartModule && typeof window.CartModule.addItem === 'function') {
      window.CartModule.addItem({
        id,
        name,
        price,
        image,
        quantity: 1
      });
    } else {
      await addToCartFallback({
        id,
        name,
        price,
        image,
        category: 'Vins',
        type: button.dataset.type,
        alcohol: button.dataset.alcohol,
        volume: button.dataset.volume
      });
    }
    
    // Mettre à jour le badge du panier
    updateCartBadge();
    
  } catch (error) {
    console.error('Erreur lors de l\'ajout au panier:', error);
    showNotification('Erreur lors de l\'ajout au panier', true);
  }
  
  // Réactiver le bouton après 2 secondes
  setTimeout(() => {
    button.disabled = false;
  }, 2000);
}

// Fonction de fallback pour le panier
function addToCartFallback(productData) {
  try {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Vérifier si le produit existe déjà
    const existingIndex = cart.findIndex(item => item.id === productData.id);
    
    if (existingIndex > -1) {
      cart[existingIndex].quantity += 1;
      console.log('Quantité augmentée pour:', productData.name);
    } else {
      cart.push({
        ...productData,
        quantity: 1,
        addedAt: new Date().toISOString()
      });
      console.log('Nouveau produit ajouté:', productData.name);
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'ajout au panier:', error);
    return false;
  }
}

// Mettre à jour le badge du panier
function updateCartBadge() {
  try {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    
    const cartBadge = document.getElementById('cartBadge');
    if (cartBadge) {
      cartBadge.textContent = totalItems;
      cartBadge.style.display = totalItems > 0 ? 'flex' : 'none';
      
      // Animation de pulse
      cartBadge.classList.add('pulse');
      setTimeout(() => {
        cartBadge.classList.remove('pulse');
      }, 1000);
    }
    
    // Mettre à jour tous les badges sur la page
    document.querySelectorAll('.cart-badge').forEach(badge => {
      badge.textContent = totalItems;
      badge.style.display = totalItems > 0 ? 'flex' : 'none';
    });
    
    return totalItems;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du badge:', error);
    return 0;
  }
}

// Animation d'ajout au panier
function showAddToCartAnimation(button, productName) {
  const originalHTML = button.innerHTML;
  const originalClass = button.className;
  
  // Changer l'apparence du bouton
  button.innerHTML = '<i class="fas fa-check"></i> Ajouté !';
  button.className = originalClass + ' added';
  button.disabled = true;
  
  // Afficher une notification
  showNotification(`${productName} ajouté au panier`);
  
  // Restaurer après 2 secondes
  setTimeout(() => {
    button.innerHTML = originalHTML;
    button.className = originalClass;
    button.disabled = false;
    
    // Recréer les icônes Lucide
    if (window.lucide && window.lucide.createIcons) {
      window.lucide.createIcons();
    }
  }, 2000);
}

// Notification toast
function showNotification(message) {
  // Supprimer les notifications existantes
  document.querySelectorAll('.toast-notification').forEach(toast => toast.remove());
  
  // Créer la notification
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.innerHTML = `
    <i data-lucide="check-circle" size="20"></i>
    <span>${message}</span>
  `;
  
  // Styles supplémentaires
  toast.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: var(--primary, #10B981);
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    animation: slideInRight 0.3s ease-out;
    max-width: 300px;
  `;
  
  document.body.appendChild(toast);
  
  // Recréer les icônes Lucide
  if (window.lucide && window.lucide.createIcons) {
    window.lucide.createIcons();
  }
  
  // Supprimer après 3 secondes
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease-out forwards';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

  // ============================================
  // UTILITAIRES
  // ============================================
  function formatRegion(region) {
    const regions = {
      'bordeaux': 'Bordeaux',
      'bourgogne': 'Bourgogne',
      'champagne': 'Champagne',
      'rhone': 'Vallée du Rhône',
      'provence': 'Provence',
      'loire': 'Loire',
      'alsace': 'Alsace'
    };
    return regions[region] || region?.charAt(0).toUpperCase() + region?.slice(1) || 'France';
  }

  function truncate(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }

  function showError(message) {
    const grid = document.getElementById('vinsGrid');
    if (grid) {
      grid.innerHTML = `
        <div class="error-message">
          <i data-lucide="alert-circle" size="48"></i>
          <h3>Erreur de chargement</h3>
          <p>${message}</p>
        </div>
      `;
      lucide.createIcons();
    }
  }

  function resetFilters() {
    currentFilters = { category: 'all', region: 'all', year: 'all' };
    currentPage = 1;
    
    // Réinitialiser les boutons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.filter === 'all') btn.classList.add('active');
    });
    
    // Réinitialiser les selects
    document.getElementById('region-filter').value = 'all';
    document.getElementById('year-filter').value = 'all';
    document.getElementById('sort-filter').value = 'popular';
    
    displayCurrentPage();
  }

  // ============================================
  // EXPORT GLOBAL
  // ============================================
  window.VinsModule = {
    init: initPage,
    loadVins,
    renderVinCard,
    resetFilters,
    BADGE_CONFIG
  };

  // ============================================
  // DÉMARRAGE
  // ============================================
  // Attendre que le DOM soit chargé
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
  } else {
    setTimeout(initPage, 500); // Donner du temps à Supabase
  }

})(window);