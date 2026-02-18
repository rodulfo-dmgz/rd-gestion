/**
 * PANIER PAGE - Affichage et gestion de la page panier
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialiser le panier
    const cart = CartModule.getCart();
    
    // Afficher le contenu du panier
    renderCart();
    
    // Écouter les mises à jour du panier
    window.addEventListener('cart-updated', renderCart);
    
    // Vider le panier
    document.getElementById('viderPanier')?.addEventListener('click', function() {
        if (confirm('Voulez-vous vraiment vider votre panier ?')) {
            CartModule.clearCart();
        }
    });
    
    // Gérer la commande
    document.getElementById('passerCommande')?.addEventListener('click', function() {
        if (CartModule.getTotalItems() === 0) {
            alert('Votre panier est vide. Ajoutez des produits avant de passer commande.');
            return;
        }
        // Rediriger vers la page de paiement (à créer)
        window.location.href = '/Pages/commande/checkout.html';
    });
    
    // Gérer les options de livraison
    document.querySelectorAll('input[name="livraison"]').forEach(radio => {
        radio.addEventListener('change', updateLivraison);
    });
    
    // Gérer le code promo
    document.getElementById('appliquerCode')?.addEventListener('click', appliquerCodePromo);
    
    // Initialiser les suggestions
    loadSuggestions();
});

/**
 * Afficher le contenu du panier
 */
function renderCart() {
    const cart = CartModule.getCart();
    const panierVide = document.getElementById('panierVide');
    const listeArticles = document.getElementById('listeArticles');
    const articleCount = document.getElementById('articleCount');
    
    // Vérifier si le panier est vide
    if (cart.length === 0) {
        panierVide.style.display = 'block';
        listeArticles.style.display = 'none';
        articleCount.textContent = '(0 articles)';
        updateTotals();
        return;
    }
    
    // Panier non vide
    panierVide.style.display = 'none';
    listeArticles.style.display = 'block';
    
    // Mettre à jour le compteur
    const totalItems = CartModule.getTotalItems();
    articleCount.textContent = `(${totalItems} article${totalItems > 1 ? 's' : ''})`;
    
    // Générer le HTML des articles
    let html = '';
    
    cart.forEach(item => {
        const total = (item.price * item.quantity).toFixed(2);
        html += `
            <div class="article-item" data-id="${item.id}">
                <div class="article-image">
                    <img src="${item.image || '/assets/products/placeholder.jpg'}" alt="${item.name}" onerror="this.src='/assets/products/vins/default.svg'">
                </div>
                <div class="article-details">
                    <h4 class="article-name">${item.name}</h4>
                    <p class="article-category">${item.category}</p>
                    <div class="article-actions">
                        <button class="btn-quantity" data-action="decrease" data-id="${item.id}" ${item.quantity <= 1 ? 'disabled' : ''}>
                            <i data-lucide="minus" size="14"></i>
                        </button>
                        <span class="article-quantity">${item.quantity}</span>
                        <button class="btn-quantity" data-action="increase" data-id="${item.id}">
                            <i data-lucide="plus" size="14"></i>
                        </button>
                        <button class="btn-remove" data-id="${item.id}" title="Supprimer">
                            <i data-lucide="trash-2" size="14"></i>
                        </button>
                    </div>
                </div>
                <div class="article-price">
                    <span class="article-price-total">${total} €</span>
                    <span class="article-price-unit">${item.price.toFixed(2)} € / unité</span>
                </div>
            </div>
        `;
    });
    
    listeArticles.innerHTML = html;
    
    // Ajouter les événements aux boutons
    document.querySelectorAll('.btn-quantity').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const action = this.getAttribute('data-action');
            const item = cart.find(item => item.id === id);
            
            if (item) {
                let newQuantity = item.quantity;
                if (action === 'increase') {
                    newQuantity += 1;
                } else if (action === 'decrease') {
                    newQuantity = Math.max(1, item.quantity - 1);
                }
                CartModule.updateQuantity(id, newQuantity);
            }
        });
    });
    
    document.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            if (confirm('Supprimer cet article du panier ?')) {
                CartModule.removeFromCart(id);
            }
        });
    });
    
    // Mettre à jour les totaux
    updateTotals();
    
    // Actualiser les icônes Lucide
    setTimeout(() => lucide.createIcons(), 100);
}

function updateTotals() {
    const totalPanier = CartModule.getTotalPrice();
    
    const livraisonElement = document.getElementById('livraison');
    const tvaElement = document.getElementById('tva');
    const totalElement = document.getElementById('total');
    const sousTotalElement = document.getElementById('sousTotal');
    
    let livraison = 0;
    const expressRadio = document.getElementById('express');
    if (expressRadio && expressRadio.checked) {
        livraison = 9.90;
    }
    
    // Sous-total HT (articles + livraison)
    const sousTotalHT = totalPanier + livraison;
    
    // TVA (20% sur le sous-total HT)
    const tva = sousTotalHT * 0.20;
    
    // Total TTC
    const totalTTC = sousTotalHT + tva;
    
    // Mettre à jour l'affichage
    sousTotalElement.textContent = `${sousTotalHT.toFixed(2)} €`; // Articles + livraison
    livraisonElement.textContent = `${livraison.toFixed(2)} €`;
    tvaElement.textContent = `${tva.toFixed(2)} €`;
    totalElement.textContent = `${totalTTC.toFixed(2)} €`;
}

/**
 * Mettre à jour les frais de livraison
 */
function updateLivraison() {
    updateTotals();
}

/**
 * Appliquer un code promo
 */
function appliquerCodePromo() {
    const codeInput = document.getElementById('codePromo');
    const code = codeInput.value.trim();
    const messageElement = document.getElementById('codeMessage');
    
    if (!code) {
        messageElement.textContent = 'Veuillez entrer un code promo';
        messageElement.className = 'code-promo-message error';
        return;
    }
    
    // Exemples de codes promo
    const codesPromo = {
        'ECHO10': 0.10,  // 10% de réduction
        'BIERE15': 0.15, // 15% de réduction
        'LIVRAISON': 9.90 // Livraison gratuite
    };
    
    if (codesPromo[code]) {
        messageElement.textContent = `Code "${code}" appliqué avec succès !`;
        messageElement.className = 'code-promo-message success';
        // Ici, vous appliqueriez la réduction au calcul des totaux
        console.log(`Réduction de ${codesPromo[code] * 100}% appliquée`);
    } else {
        messageElement.textContent = 'Code promo invalide ou expiré';
        messageElement.className = 'code-promo-message error';
    }
}

/**
 * Charger les suggestions de produits
 */
function loadSuggestions() {
    const suggestionsContainer = document.getElementById('produitsSuggestions');
    
    if (!suggestionsContainer) return;
    
    // Données de test (remplacer par une API réelle)
    const suggestions = [
        {
            id: 'sugg1',
            name: 'Bière Ambrée Spéciale',
            price: 4.90,
            image: '/assets/images/biere-ambree.jpg',
            category: 'bière'
        },
        {
            id: 'sugg2',
            name: 'Vin Rouge Réserve',
            price: 18.50,
            image: '/assets/images/vin-rouge.jpg',
            category: 'vin'
        },
        {
            id: 'sugg3',
            name: 'Pack Découverte',
            price: 24.90,
            image: '/assets/images/pack-decouverte.jpg',
            category: 'pack'
        },
        {
            id: 'sugg4',
            name: 'Bière Blanche Artisanale',
            price: 3.90,
            image: '/assets/images/biere-blanche.jpg',
            category: 'bière'
        }
    ];
    
    let html = '';
    suggestions.forEach(product => {
        html += `
            <div class="produit-suggestion">
                <div class="produit-suggestion-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="produit-suggestion-content">
                    <h4>${product.name}</h4>
                    <p class="produit-suggestion-category">${product.category}</p>
                    <div class="produit-suggestion-footer">
                        <span class="produit-suggestion-price">${product.price.toFixed(2)} €</span>
                        <button class="btn btn-primary btn-small" onclick="addSuggestionToCart('${product.id}')">
                            <i data-lucide="plus" size="14"></i>
                            Ajouter
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    suggestionsContainer.innerHTML = html;
    lucide.createIcons();
}

/**
 * Ajouter une suggestion au panier
 */
function addSuggestionToCart(productId) {
    // Trouver le produit dans les suggestions (dans un cas réel, vous auriez un objet complet)
    const suggestions = [
        {
            id: 'sugg1',
            name: 'Bière Ambrée Spéciale',
            price: 4.90,
            image: '/assets/images/biere-ambree.jpg',
            category: 'bière'
        },
        {
            id: 'sugg2',
            name: 'Vin Rouge Réserve',
            price: 18.50,
            image: '/assets/images/vin-rouge.jpg',
            category: 'vin'
        },
        {
            id: 'sugg3',
            name: 'Pack Découverte',
            price: 24.90,
            image: '/assets/images/pack-decouverte.jpg',
            category: 'pack'
        },
        {
            id: 'sugg4',
            name: 'Bière Blanche Artisanale',
            price: 3.90,
            image: '/assets/images/biere-blanche.jpg',
            category: 'bière'
        }
    ];
    
    const product = suggestions.find(p => p.id === productId);
    if (product) {
        CartModule.addToCart(product);
        alert(`${product.name} ajouté au panier !`);
    }
}