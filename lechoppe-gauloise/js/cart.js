/**
 * ═══════════════════════════════════════════════════════════════════════════
 * L'ÉCHOPPE GAULOISE - PANIER
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Gestion du panier d'achat avec localStorage et multi-devises
 */

const CartModule = (() => {
  'use strict';

  const STORAGE_KEY = 'echoppe_cart';
  let currentCurrency = 'EUR';

  /**
   * Cart object
   */
  const cart = {
    items: [],

    /**
     * Add item to cart
     */
    addItem(product, quantity = 1) {
      const existingItem = this.items.find(item => item.id === product.id);

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        this.items.push({
          id: product.id,
          name: product.name,
          price: parseFloat(product.price),
          image: product.image,
          quantity: quantity
        });
      }

      this.save();
      this.updateUI();
      Utils.showNotification(`${product.name} ajouté au panier`, 'success');
    },

    /**
     * Remove item from cart
     */
    removeItem(productId) {
      this.items = this.items.filter(item => item.id !== productId);
      this.save();
      this.updateUI();
      Utils.showNotification('Produit retiré du panier', 'info');
    },

    /**
     * Update item quantity
     */
    updateQuantity(productId, quantity) {
      const item = this.items.find(item => item.id === productId);
      
      if (item) {
        if (quantity <= 0) {
          this.removeItem(productId);
        } else {
          item.quantity = quantity;
          this.save();
          this.updateUI();
        }
      }
    },

    /**
     * Get total items count
     */
    getItemCount() {
      return this.items.reduce((total, item) => total + item.quantity, 0);
    },

    /**
     * Get total price
     */
    getTotal() {
      return this.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);
    },

    /**
     * Clear cart
     */
    clear() {
      this.items = [];
      this.save();
      this.updateUI();
    },

    /**
     * Save cart to localStorage
     */
    save() {
      Utils.storage.set(STORAGE_KEY, this.items);
    },

    /**
     * Load cart from localStorage
     */
    load() {
      const savedCart = Utils.storage.get(STORAGE_KEY);
      if (savedCart && Array.isArray(savedCart)) {
        this.items = savedCart;
      }
      this.updateUI();
    },

    /**
     * Update UI (badge counter)
     */
    updateUI() {
      const cartBadge = document.getElementById('cartCount');
      if (cartBadge) {
        const count = this.getItemCount();
        cartBadge.textContent = count;
        cartBadge.style.display = count > 0 ? 'flex' : 'none';
      }

      // Update prices if on cart page
      updateCartPage();
    }
  };

  /**
   * Initialize cart
   */
  function init() {
    cart.load();
    setupAddToCartButtons();
    setupCurrencySelector();
  }

  /**
   * Setup "Add to Cart" buttons
   */
  function setupAddToCartButtons() {
    const addToCartButtons = document.querySelectorAll('.add-to-cart');

    addToCartButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();

        const product = {
          id: this.getAttribute('data-id'),
          name: this.getAttribute('data-name'),
          price: this.getAttribute('data-price'),
          image: this.getAttribute('data-image')
        };

        cart.addItem(product, 1);

        // Visual feedback
        button.textContent = '✓ Ajouté';
        button.disabled = true;

        setTimeout(() => {
          button.textContent = 'Ajouter au panier';
          button.disabled = false;
        }, 2000);
      });
    });
  }

  /**
   * Setup currency selector
   */
  function setupCurrencySelector() {
    const currencySelector = document.getElementById('currencySelector');
    if (!currencySelector) return;

    // Load saved currency preference
    const savedCurrency = Utils.getCookie('preferred_currency');
    if (savedCurrency) {
      currentCurrency = savedCurrency;
      currencySelector.value = savedCurrency;
    }

    currencySelector.addEventListener('change', function() {
      currentCurrency = this.value;
      Utils.setCookie('preferred_currency', currentCurrency, 365);
      updateAllPrices();
      cart.updateUI();
    });

    // Initial update
    updateAllPrices();
  }

  /**
   * Update all prices on page
   */
  function updateAllPrices() {
    const priceElements = document.querySelectorAll('[data-price]');

    priceElements.forEach(element => {
      const basePrice = parseFloat(element.getAttribute('data-price'));
      const convertedPrice = Utils.convertPrice(basePrice, currentCurrency);
      element.textContent = Utils.formatPrice(convertedPrice, currentCurrency);
    });
  }

  /**
   * Update cart page (if exists)
   */
  function updateCartPage() {
    const cartItems = document.getElementById('cartItems');
    if (!cartItems) return;

    if (cart.items.length === 0) {
      cartItems.innerHTML = `
        <div style="text-align: center; padding: var(--space-12);">
          <p style="font-size: var(--font-size-lg); color: var(--color-text-muted);">
            Votre panier est vide
          </p>
          <a href="bieres.html" class="btn btn--primary" style="margin-top: var(--space-4);">
            Découvrir nos produits
          </a>
        </div>
      `;
      return;
    }

    cartItems.innerHTML = cart.items.map(item => {
      const itemTotal = item.price * item.quantity;
      const convertedPrice = Utils.convertPrice(item.price, currentCurrency);
      const convertedTotal = Utils.convertPrice(itemTotal, currentCurrency);

      return `
        <div class="cart-item">
          <img src="${item.image}" alt="${item.name}" class="cart-item__image">
          <div class="cart-item__details">
            <h3 class="cart-item__title">${item.name}</h3>
            <p class="cart-item__price">${Utils.formatPrice(convertedPrice, currentCurrency)} × ${item.quantity}</p>
            <div class="cart-item__quantity">
              <button class="cart-item__quantity-btn" data-id="${item.id}" data-action="decrease">-</button>
              <span class="cart-item__quantity-value">${item.quantity}</span>
              <button class="cart-item__quantity-btn" data-id="${item.id}" data-action="increase">+</button>
            </div>
            <p style="font-weight: bold; margin-top: var(--space-2);">
              Total: ${Utils.formatPrice(convertedTotal, currentCurrency)}
            </p>
          </div>
          <button class="cart-item__remove" data-id="${item.id}" aria-label="Retirer ${item.name}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      `;
    }).join('');

    // Setup cart item controls
    setupCartItemControls();
    updateCartSummary();
  }

  /**
   * Setup cart item controls (quantity, remove)
   */
  function setupCartItemControls() {
    // Quantity buttons
    document.querySelectorAll('.cart-item__quantity-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const productId = this.getAttribute('data-id');
        const action = this.getAttribute('data-action');
        const item = cart.items.find(i => i.id === productId);

        if (item) {
          const newQuantity = action === 'increase' 
            ? item.quantity + 1 
            : item.quantity - 1;
          cart.updateQuantity(productId, newQuantity);
        }
      });
    });

    // Remove buttons
    document.querySelectorAll('.cart-item__remove').forEach(btn => {
      btn.addEventListener('click', function() {
        const productId = this.getAttribute('data-id');
        cart.removeItem(productId);
      });
    });
  }

  /**
   * Update cart summary
   */
  function updateCartSummary() {
    const summaryElement = document.getElementById('cartSummary');
    if (!summaryElement) return;

    const subtotal = cart.getTotal();
    const shipping = 0; // Free shipping for now
    const total = subtotal + shipping;

    const convertedSubtotal = Utils.convertPrice(subtotal, currentCurrency);
    const convertedShipping = Utils.convertPrice(shipping, currentCurrency);
    const convertedTotal = Utils.convertPrice(total, currentCurrency);

    summaryElement.innerHTML = `
      <h3 class="cart-summary__title">Résumé</h3>
      <div class="cart-summary__row">
        <span>Sous-total</span>
        <span>${Utils.formatPrice(convertedSubtotal, currentCurrency)}</span>
      </div>
      <div class="cart-summary__row">
        <span>Livraison</span>
        <span>${shipping === 0 ? 'Gratuit' : Utils.formatPrice(convertedShipping, currentCurrency)}</span>
      </div>
      <div class="cart-summary__row cart-summary__row--total">
        <span>Total</span>
        <span>${Utils.formatPrice(convertedTotal, currentCurrency)}</span>
      </div>
      <button class="btn btn--primary btn--full cart-summary__btn">
        Commander
      </button>
      <a href="export.html" class="btn btn--outline btn--full cart-summary__btn">
        Demander un devis export
      </a>
    `;
  }

  // Public API
  return {
    init,
    cart,
    getCurrentCurrency: () => currentCurrency
  };
})();