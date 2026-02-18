/**
 * BIÈRES MODULE - Supabase Integration
 * Système de badges unifié
 * L'Echoppe Gauloise
 */

(function(window) {
  'use strict';

  // ============================================
  // CONFIGURATION DES BADGES
  // ============================================
  const BADGE_CONFIG = {
    'Nouveau': { color: 'info', icon: '✨' },
    'Best-seller': { color: 'success', icon: '🔥' },
    'Limited': { color: 'warning', icon: '⏳' },
    'Fort': { color: 'danger', icon: '⚡' },
    'Premium': { color: 'primary', icon: '👑' },
    'Bio': { color: 'success', icon: '🌱' },
    'Exclusif': { color: 'primary', icon: '⭐' }
  };

  // ============================================
  // ÉTAT GLOBAL
  // ============================================
  let currentFilters = {
    category: 'all',
    beer: 'all',
    alcohol: 'all',
    style: 'all'
  };
  let allBieres = [];
  let currentPage = 1;
  const itemsPerPage = 4;

  // ============================================
  // INITIALISATION DE LA PAGE
  // ============================================
  async function initPage() {
    console.log('Initialisation de la page Bières...');
    
    // Attendre que Supabase soit disponible
    if (!window.supabase) {
      console.error('Supabase non disponible');
      setTimeout(initPage, 100);
      return;
    }
    
    try {
      // Charger toutes les bières
      allBieres = await loadBieres();
      console.log(`${allBieres.length} bières chargées`);
      
      // Initialiser les filtres
      initFilters();
      
      // Initialiser la pagination
      initPagination();
      
      // Afficher la première page
      displayCurrentPage();
      
      // Initialiser les boutons d'ajout au panier
      initAddToCartButtons();
      
      // Initialiser les boutons wishlist
      initWishlistButtons();
      
      // Mettre à jour le badge du panier
      if (window.CartModule && window.CartModule.updateAllBadges) {
        window.CartModule.updateAllBadges();
      }
      
    } catch (error) {
      console.error('Erreur d\'initialisation:', error);
      showError('Impossible de charger les bières. Veuillez réessayer.');
    }
  }

  // ============================================
  // CHARGEMENT DES BIÈRES
  // ============================================
  async function loadBieres() {
    console.log('Chargement des bières depuis Supabase...');
    
    if (!window.supabase) {
      console.error('Supabase non initialisé');
      return [];
    }

    try {
      const { data, error } = await window.supabase
        .from('bieres')
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
  function getFilteredBieres() {
    let filtered = [...allBieres];

    // Filtre par catégorie
    if (currentFilters.category && currentFilters.category !== 'all') {
      filtered = filtered.filter(biere => biere.category === currentFilters.category);
    }

        // Filtre par type de bière
    if (currentFilters.category && currentFilters.category !== 'all') {
      switch (currentFilters.category) {
        case 'IPA':
            filtered = filtered.filter(biere => biere.category == 'ipa');
            break;
        case 'Blondes':
            filtered = filtered.filter(biere => biere.category === 'blonde');
            break;
        case 'Ambrées':
            filtered = filtered.filter(biere => biere.category === 'ambree');
            break;
        case 'Brunes':
            filtered = filtered.filter(biere => biere.category === 'brune');
            break;
        case 'Les Gauloises':
            // Ici on filtre sur la catégorie 'speciales' de ta DB
            filtered = filtered.filter(biere => biere.category === 'speciales');
            break;
    }
}

    // Filtre par degré d'alcool
    if (currentFilters.alcohol && currentFilters.alcohol !== 'all') {
      switch (currentFilters.alcohol) {
        case 'light':
          filtered = filtered.filter(biere => biere.alcohol < 5);
          break;
        case 'medium':
          filtered = filtered.filter(biere => biere.alcohol >= 5 && biere.alcohol <= 7);
          break;
        case 'strong':
          filtered = filtered.filter(biere => biere.alcohol > 7);
          break;
      }
    }

    // Filtre par style
    if (currentFilters.style && currentFilters.style !== 'all') {
      filtered = filtered.filter(biere => biere.style === currentFilters.style);
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
      case 'alcohol-asc':
        filtered.sort((a, b) => a.alcohol - b.alcohol);
        break;
      case 'alcohol-desc':
        filtered.sort((a, b) => b.alcohol - a.alcohol);
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
    const grid = document.getElementById('bieresGrid');
    if (!grid) {
      console.error('Élément #bieresGrid non trouvé');
      return;
    }

    const filteredBieres = getFilteredBieres();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageBieres = filteredBieres.slice(startIndex, endIndex);

    // Mettre à jour la pagination
    updatePagination(filteredBieres.length);

    // Afficher les bières
    if (pageBieres.length === 0) {
      grid.innerHTML = `
        <div class="no-results">
          <i data-lucide="beer" size="48"></i>
          <h3>Aucune bière trouvée</h3>
          <p>Essayez de modifier vos filtres</p>
          <button class="btn btn-primary" onclick="resetFilters()">
            Réinitialiser les filtres
          </button>
        </div>
      `;
      lucide.createIcons();
    } else {
      grid.innerHTML = pageBieres.map(biere => renderBeerCard(biere)).join('');
      lucide.createIcons();
      initAddToCartButtons(); // Réinitialiser les boutons
      initWishlistButtons(); // Réinitialiser les boutons wishlist
    }
  }

  function renderBeerCard(biere) {
    const badgeHtml = renderBadge(biere);
    const price = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(biere.price);
    
    // IBU si disponible
    const ibuHtml = biere.bitterness ? 
      `<span class="beer-detail-value">${biere.bitterness} IBU</span>` : 
      `<span class="beer-detail-value">-</span>`;
    
    return `
      <article class="beer-card" data-id="${biere.id}" data-category="${biere.category}">
        <div class="beer-image-container">
          <img 
            src="${biere.image_main || '/assets/products/bieres/default.svg'}" 
            alt="${biere.name}"
            onerror="this.src='/assets/products/bieres/default.svg'"
            loading="lazy"
          >
          <button class="wishlist-btn" aria-label="Ajouter aux favoris">
            <i data-lucide="heart" size="18" stroke-width="1.5"></i>
          </button>
          ${badgeHtml}
          <span class="beer-style-badge">${getCategoryLabel(biere.category)}</span>
        </div>
        
        <div class="beer-info">
          <div class="beer-header">
            <span class="beer-brewery">${biere.brewery}</span>
            <span class="beer-volume">${biere.volume}</span>
          </div>
          
          <h3 class="beer-name">${biere.name}</h3>
          
          <p class="beer-description">${truncate(biere.description || '', 100)}</p>
          
          <div class="beer-meta">
            <div class="beer-detail">
              <i data-lucide="flame" size="16"></i>
              <div>
                <span class="beer-detail-label">Alcool</span>
                ${biere.alcohol ? `<span class="beer-detail-value">${biere.alcohol}%</span>` : '<span class="beer-detail-value">-</span>'}
              </div>
            </div>
            <div class="beer-detail">
              <i data-lucide="package" size="16"></i>
              <div>
                <span class="beer-detail-label">Format</span>
                <span class="beer-detail-value">${biere.volume}</span>
              </div>
            </div>
            <div class="beer-detail">
              <i data-lucide="zap" size="16"></i>
              <div>
                <span class="beer-detail-label">IBU</span>
                ${ibuHtml}
              </div>
            </div>
          </div>
          
          <div class="beer-footer">
            <div class="beer-rating">
              ${renderStars(biere.rating || 0)}
              <span class="rating-value">${(biere.rating || 0).toFixed(1)}</span>
            </div>
            
            <div class="beer-price-section">
              <span class="beer-price">${price}</span>
              <button 
                class="btn-add-to-cart" 
                data-id="${biere.id}"
                data-name="${biere.name}"
                data-price="${biere.price}"
                data-image="${biere.image_main || ''}"
                data-category="${biere.category}"
                data-style="${biere.style}"
                data-alcohol="${biere.alcohol}"
                data-volume="${biere.volume}"
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

  function renderBadge(biere) {
    if (!biere.badge) return '';
    
    const config = BADGE_CONFIG[biere.badge] || { color: 'info', icon: '✨' };
    const color = biere.badge_color || config.color;
    
    return `
      <div class="beer-badge badge-${color}" title="${biere.badge}">
        <span class="badge-icon">${config.icon}</span>
        <span class="badge-text">${biere.badge}</span>
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
        document.getElementById('beer-filter')?.addEventListener('change', function() {
      currentFilters.category = this.value;
      currentPage = 1;
      displayCurrentPage();
    });

    document.getElementById('alcohol-filter')?.addEventListener('change', function() {
      currentFilters.alcohol = this.value;
      currentPage = 1;
      displayCurrentPage();
    });

    document.getElementById('style-filter')?.addEventListener('change', function() {
      currentFilters.style = this.value;
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
      const filteredBieres = getFilteredBieres();
      const totalPages = Math.ceil(filteredBieres.length / itemsPerPage);
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
  // WISHLIST
  // ============================================
  function initWishlistButtons() {
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        
        const icon = this.querySelector('i');
        const isActive = icon.getAttribute('fill') === 'currentColor';
        
        if (isActive) {
          icon.removeAttribute('fill');
          icon.style.strokeWidth = '1.5';
          this.setAttribute('aria-label', 'Ajouter aux favoris');
          showNotification('Retiré des favoris');
        } else {
          icon.setAttribute('fill', 'currentColor');
          icon.style.strokeWidth = '0';
          this.setAttribute('aria-label', 'Retirer des favoris');
          showNotification('Ajouté aux favoris');
        }
      });
    });
  }

  // ============================================
  // PANIER
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
        category: 'bieres',
        style: button.dataset.style,
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
        category: 'bieres',
        style: button.dataset.style,
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
  function getCategoryLabel(category) {
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

  function truncate(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }

  function showError(message) {
    const grid = document.getElementById('bieresGrid');
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
    currentFilters = { category: 'all', alcohol: 'all', style: 'all' };
    currentPage = 1;
    
    // Réinitialiser les boutons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.filter === 'all') btn.classList.add('active');
    });
    
    // Réinitialiser les selects
    document.getElementById('beer-filter').value = 'all';
    document.getElementById('alcohol-filter').value = 'all';
    document.getElementById('style-filter').value = 'all';
    document.getElementById('sort-filter').value = 'popular';
    
    displayCurrentPage();
  }

  // ============================================
  // EXPORT GLOBAL
  // ============================================
  window.BieresModule = {
    init: initPage,
    loadBieres,
    renderBeerCard,
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
