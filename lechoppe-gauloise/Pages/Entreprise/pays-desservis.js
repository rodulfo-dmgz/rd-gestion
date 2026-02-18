/**
 * PAYS DESSERVIS - Page simplifiée avec carte interactive
 * L'Échoppe Gauloise
 */

// Données des pays (version simplifiée)
const paysData = [
  {
    id: 1,
    name: "Belgique",
    code: "BE",
    continent: "europe",
    flag: "https://flagcdn.com/be.svg",
    clients: 85,
    depuis: 2002,
    delai: "2-3 jours",
    produits: ["Blonde Tradition", "IPA Gauloise", "Bordeaux Réserve"],
    coordinate: "M 350 200 l -10 -5 l -5 -10 l 5 -10 l 10 -5 l 10 5 l 5 10 l -5 10 Z"
  },
  {
    id: 2,
    name: "Allemagne",
    code: "DE",
    continent: "europe",
    flag: "https://flagcdn.com/de.svg",
    clients: 120,
    depuis: 2003,
    delai: "3-4 jours",
    produits: ["Bordeaux Réserve", "Chardonnay Bourgogne", "Blonde Tradition"],
    coordinate: "M 380 180 l -20 0 l 0 -15 l 20 0 Z"
  },
  {
    id: 3,
    name: "Royaume-Uni",
    code: "GB",
    continent: "europe",
    flag: "https://flagcdn.com/gb.svg",
    clients: 95,
    depuis: 2005,
    delai: "4-5 jours",
    produits: ["IPA Gauloise", "Champagne Brut", "Stout Impériale"],
    coordinate: "M 320 170 l -15 0 l 0 -10 l 15 0 Z"
  },
  {
    id: 4,
    name: "Suisse",
    code: "CH",
    continent: "europe",
    flag: "https://flagcdn.com/ch.svg",
    clients: 65,
    depuis: 2006,
    delai: "3-4 jours",
    produits: ["Chardonnay Bourgogne", "Bordeaux Réserve", "Rosé de Provence"],
    coordinate: "M 370 210 l -5 0 l 0 -5 l 5 0 Z"
  },
  {
    id: 5,
    name: "Espagne",
    code: "ES",
    continent: "europe",
    flag: "https://flagcdn.com/es.svg",
    clients: 75,
    depuis: 2008,
    delai: "4-6 jours",
    produits: ["Rosé de Provence", "Bordeaux Réserve", "Blonde Tradition"],
    coordinate: "M 300 240 l -20 10 l 10 15 l 20 -10 Z"
  },
  {
    id: 6,
    name: "Italie",
    code: "IT",
    continent: "europe",
    flag: "https://flagcdn.com/it.svg",
    clients: 80,
    depuis: 2009,
    delai: "4-5 jours",
    produits: ["Chardonnay Bourgogne", "Bordeaux Réserve", "IPA Gauloise"],
    coordinate: "M 380 220 l -10 5 l 5 10 l 10 -5 Z"
  },
  {
    id: 7,
    name: "États-Unis",
    code: "US",
    continent: "amerique",
    flag: "https://flagcdn.com/us.svg",
    clients: 150,
    depuis: 2012,
    delai: "7-10 jours",
    produits: ["IPA Gauloise", "Stout Impériale", "Champagne Brut"],
    coordinate: "M 150 160 l -30 0 l 0 -20 l 30 0 Z"
  },
  {
    id: 8,
    name: "Canada",
    code: "CA",
    continent: "amerique",
    flag: "https://flagcdn.com/ca.svg",
    clients: 90,
    depuis: 2013,
    delai: "8-12 jours",
    produits: ["Bordeaux Réserve", "Chardonnay Bourgogne", "Blonde Tradition"],
    coordinate: "M 160 130 l -20 0 l 0 -15 l 20 0 Z"
  },
  {
    id: 9,
    name: "Japon",
    code: "JP",
    continent: "asie",
    flag: "https://flagcdn.com/jp.svg",
    clients: 110,
    depuis: 2015,
    delai: "10-14 jours",
    produits: ["Champagne Brut", "Bordeaux Réserve", "Sauternes 2015"],
    coordinate: "M 600 180 l -10 0 l 0 -10 l 10 0 Z"
  },
  {
    id: 10,
    name: "Australie",
    code: "AU",
    continent: "asie",
    flag: "https://flagcdn.com/au.svg",
    clients: 60,
    depuis: 2016,
    delai: "12-16 jours",
    produits: ["Shiraz", "Chardonnay Bourgogne", "IPA Gauloise"],
    coordinate: "M 620 320 l -20 0 l 0 -15 l 20 0 Z"
  },
  {
    id: 11,
    name: "Émirats Arabes Unis",
    code: "AE",
    continent: "moyen-orient",
    flag: "https://flagcdn.com/ae.svg",
    clients: 55,
    depuis: 2018,
    delai: "8-10 jours",
    produits: ["Champagne Brut", "Bordeaux Réserve", "Rosé de Provence"],
    coordinate: "M 450 220 l -5 0 l 0 -5 l 5 0 Z"
  }
];

// Variables globales
let selectedPays = null;
let currentContinent = 'all';
let currentTri = 'nom';

// DOM Elements
const carteMonde = document.getElementById('carteMonde');
const detailsContent = document.getElementById('detailsContent');
const paysTableBody = document.getElementById('paysTableBody');
const continentBtns = document.querySelectorAll('.continent-btn');
const searchInput = document.getElementById('searchPays');
const triSelect = document.getElementById('triPays');
const suggestionBtn = document.getElementById('suggestionBtn');
const newsletterForm = document.getElementById('newsletterPaysForm');

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  initCarte();
  initTable();
  initFiltres();
  initNewsletter();
  updateCartBadge();
});

// Initialisation de la carte
function initCarte() {
  if (!carteMonde) return;
  
  // Créer les éléments SVG pour chaque pays
  paysData.forEach(pays => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pays.coordinate);
    path.setAttribute('class', `pays-svg ${pays.continent}`);
    path.setAttribute('data-pays-id', pays.id);
    path.setAttribute('data-pays-name', pays.name);
    
    // Tooltip
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.textContent = pays.name;
    path.appendChild(title);
    
    // Événements
    path.addEventListener('click', () => selectPays(pays.id));
    path.addEventListener('mouseenter', () => highlightPays(pays.id));
    path.addEventListener('mouseleave', () => unhighlightPays(pays.id));
    
    carteMonde.appendChild(path);
  });
}

// Initialisation du tableau
function initTable() {
  if (!paysTableBody) return;
  
  updateTable();
}

// Mise à jour du tableau
function updateTable() {
  let filteredPays = [...paysData];
  
  // Filtrer par continent
  if (currentContinent !== 'all') {
    filteredPays = filteredPays.filter(pays => pays.continent === currentContinent);
  }
  
  // Filtrer par recherche
  if (searchInput && searchInput.value.trim()) {
    const searchTerm = searchInput.value.toLowerCase();
    filteredPays = filteredPays.filter(pays => 
      pays.name.toLowerCase().includes(searchTerm) ||
      pays.code.toLowerCase().includes(searchTerm)
    );
  }
  
  // Trier
  filteredPays.sort((a, b) => {
    switch (currentTri) {
      case 'nom':
        return a.name.localeCompare(b.name);
      case 'clients':
        return b.clients - a.clients;
      case 'depuis':
        return a.depuis - b.depuis;
      case 'delai':
        return parseInt(a.delai) - parseInt(b.delai);
      default:
        return 0;
    }
  });
  
  // Générer les lignes du tableau
  paysTableBody.innerHTML = filteredPays.map(pays => createTableRow(pays)).join('');
  
  // Ajouter les écouteurs d'événements
  document.querySelectorAll('.view-pays-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const paysId = parseInt(this.dataset.paysId);
      selectPays(paysId);
      
      // Scroll vers les détails
      document.getElementById('detailsPays').scrollIntoView({
        behavior: 'smooth'
      });
    });
  });
}

// Création d'une ligne de tableau
function createTableRow(pays) {
  return `
    <tr data-pays-id="${pays.id}">
      <td>
        <div class="pays-cell">
          <div class="pays-flag">
            <img src="${pays.flag}" alt="${pays.name}" loading="lazy">
          </div>
          <span class="pays-name">${pays.name}</span>
        </div>
      </td>
      <td>${pays.depuis}</td>
      <td>${pays.clients}+ clients</td>
      <td>${pays.delai}</td>
      <td>
        <div class="products-list">
          ${pays.produits.slice(0, 2).map(prod => `<span>${prod}</span>`).join('')}
          ${pays.produits.length > 2 ? '<span>...</span>' : ''}
        </div>
      </td>
      <td>
        <div class="pays-actions">
          <button class="btn-small btn-secondary view-pays-btn" data-pays-id="${pays.id}">
            <i data-lucide="eye" size="14"></i>
          </button>
          <button class="btn-small btn-secondary" onclick="window.location.href='export.html'">
            <i data-lucide="shopping-cart" size="14"></i>
          </button>
        </div>
      </td>
    </tr>
  `;
}

// Initialisation des filtres
function initFiltres() {
  // Boutons continent
  continentBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      // Retirer active de tous les boutons
      continentBtns.forEach(b => b.classList.remove('active'));
      // Ajouter active au bouton cliqué
      this.classList.add('active');
      currentContinent = this.dataset.continent;
      updateTable();
      updateCarte();
    });
  });
  
  // Recherche
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      updateTable();
    });
  }
  
  // Tri
  if (triSelect) {
    triSelect.addEventListener('change', function() {
      currentTri = this.value;
      updateTable();
    });
  }
  
  // Bouton suggestion
  if (suggestionBtn) {
    suggestionBtn.addEventListener('click', () => {
      const pays = prompt('Quel pays aimeriez-vous que nous desservions ?');
      if (pays) {
        showNotification(`Merci pour votre suggestion : ${pays} ! Nous l'étudierons.`);
        saveSuggestion(pays);
      }
    });
  }
}

// Sauvegarder une suggestion
function saveSuggestion(pays) {
  let suggestions = JSON.parse(localStorage.getItem('paysSuggestions')) || [];
  suggestions.push({
    pays: pays,
    date: new Date().toISOString()
  });
  localStorage.setItem('paysSuggestions', JSON.stringify(suggestions));
}

// Mettre à jour la carte selon le filtre
function updateCarte() {
  const paths = carteMonde.querySelectorAll('.pays-svg');
  
  paths.forEach(path => {
    const paysId = parseInt(path.dataset.paysId);
    const pays = paysData.find(p => p.id === paysId);
    
    if (currentContinent === 'all' || pays.continent === currentContinent) {
      path.style.display = 'block';
      path.style.opacity = '1';
    } else {
      path.style.display = 'none';
    }
  });
}

// Sélectionner un pays
function selectPays(paysId) {
  const pays = paysData.find(p => p.id === paysId);
  if (!pays) return;
  
  selectedPays = pays;
  
  // Mettre à jour la carte
  updateCarteSelection(paysId);
  
  // Mettre à jour les détails
  updateDetails(pays);
  
  // Mettre à jour le tableau
  highlightTableRow(paysId);
}

// Mettre à jour la sélection sur la carte
function updateCarteSelection(paysId) {
  // Retirer la classe selected de tous les pays
  const paths = carteMonde.querySelectorAll('.pays-svg');
  paths.forEach(path => path.classList.remove('selected'));
  
  // Ajouter la classe selected au pays sélectionné
  const selectedPath = carteMonde.querySelector(`.pays-svg[data-pays-id="${paysId}"]`);
  if (selectedPath) {
    selectedPath.classList.add('selected');
    selectedPath.classList.add('pays-highlight');
    
    // Arrêter l'animation après 1 seconde
    setTimeout(() => {
      selectedPath.classList.remove('pays-highlight');
    }, 1000);
  }
  
  // Mettre à jour le texte sélectionné
  const selectedText = carteMonde.querySelector('#selectedCountry');
  if (selectedText) {
    selectedText.textContent = `Pays sélectionné : ${paysData.find(p => p.id === paysId).name}`;
  }
}

// Survol d'un pays
function highlightPays(paysId) {
  const path = carteMonde.querySelector(`.pays-svg[data-pays-id="${paysId}"]`);
  if (path && !path.classList.contains('selected')) {
    path.style.opacity = '0.8';
    path.style.strokeWidth = '2';
  }
}

// Fin du survol
function unhighlightPays(paysId) {
  const path = carteMonde.querySelector(`.pays-svg[data-pays-id="${paysId}"]`);
  if (path && !path.classList.contains('selected')) {
    path.style.opacity = '1';
    path.style.strokeWidth = '1';
  }
}

// Mettre à jour les détails du pays
function updateDetails(pays) {
  detailsContent.innerHTML = createDetailsHTML(pays);
  lucide.createIcons();
}

// Création du HTML des détails
function createDetailsHTML(pays) {
  const produitsHTML = pays.produits.map(prod => `<li>${prod}</li>`).join('');
  
  return `
    <div class="pays-details">
      <div class="pays-details-header">
        <div class="pays-details-flag">
          <img src="${pays.flag}" alt="${pays.name}" loading="lazy">
        </div>
        <h3 class="pays-details-name">${pays.name}</h3>
        <span class="pays-details-code">${pays.code}</span>
      </div>
      
      <div class="pays-details-info">
        <div class="pays-details-stats">
          <div class="pays-details-stat">
            <strong>${pays.depuis}</strong>
            <span>Export depuis</span>
          </div>
          <div class="pays-details-stat">
            <strong>${pays.clients}+</strong>
            <span>Clients</span>
          </div>
          <div class="pays-details-stat">
            <strong>${pays.delai}</strong>
            <span>Livraison</span>
          </div>
        </div>
        
        <div class="pays-details-products">
          <h4>Produits populaires</h4>
          <ul class="products-list">
            ${produitsHTML}
          </ul>
        </div>
        
        <div class="pays-details-actions">
          <button class="btn btn-secondary" onclick="window.location.href='export.html'">
            <i data-lucide="shopping-cart" size="18"></i>
            Demander un devis
          </button>
          <button class="btn btn-secondary" onclick="window.open('https://en.wikipedia.org/wiki/${pays.name}', '_blank')">
            <i data-lucide="external-link" size="18"></i>
            En savoir plus
          </button>
        </div>
      </div>
    </div>
  `;
}

// Mettre en surbrillance la ligne du tableau
function highlightTableRow(paysId) {
  // Retirer la surbrillance de toutes les lignes
  const rows = paysTableBody.querySelectorAll('tr');
  rows.forEach(row => row.style.background = '');
  
  // Surbrillance de la ligne sélectionnée
  const selectedRow = paysTableBody.querySelector(`tr[data-pays-id="${paysId}"]`);
  if (selectedRow) {
    selectedRow.style.background = 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)';
    
    // Scroll vers la ligne si elle n'est pas visible
    selectedRow.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }
}

// Initialisation de la newsletter
function initNewsletter() {
  if (!newsletterForm) return;
  
  newsletterForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = this.querySelector('input[type="email"]').value;
    
    if (validateEmail(email)) {
      showNotification('Merci pour votre inscription ! Le guide des marchés vous sera envoyé par email.');
      this.reset();
      saveNewsletterSubscription(email);
    } else {
      showNotification('Veuillez entrer une adresse email valide.', 'error');
    }
  });
}

// Validation email
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Sauvegarder l'inscription newsletter
function saveNewsletterSubscription(email) {
  let subscriptions = JSON.parse(localStorage.getItem('paysNewsletter')) || [];
  if (!subscriptions.includes(email)) {
    subscriptions.push(email);
    localStorage.setItem('paysNewsletter', JSON.stringify(subscriptions));
  }
}

// Mise à jour du badge du panier
function updateCartBadge() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  const cartBadge = document.getElementById('cartBadge');
  if (cartBadge) {
    cartBadge.textContent = totalItems;
    cartBadge.style.display = totalItems > 0 ? 'flex' : 'none';
  }
}

// Notification
function showNotification(message, type = 'success') {
  // Créer une notification toast
  const toast = document.createElement('div');
  toast.className = `toast-notification ${type}`;
  toast.innerHTML = `
    <i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}" size="20"></i>
    <span>${message}</span>
  `;
  
  // Styles pour la notification
  toast.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: ${type === 'success' ? 'var(--primary)' : '#EF4444'};
    color: white;
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    gap: var(--space-3);
    box-shadow: var(--shadow-lg);
    z-index: 1000;
    animation: slideInRight 0.3s ease-out;
    max-width: 400px;
  `;
  
  document.body.appendChild(toast);
  lucide.createIcons();
  
  // Supprimer après 5 secondes
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

// Styles CSS pour les animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
  
  .toast-notification.error {
    background: #EF4444 !important;
  }
  
  .toast-notification.success {
    background: var(--primary) !important;
  }
  
  .btn-small {
    padding: var(--space-1) var(--space-2);
    font-size: var(--text-xs);
    border-radius: var(--radius-sm);
  }
  
  .pays-details-actions {
    display: flex;
    gap: var(--space-4);
    margin-top: var(--space-6);
  }
  
  @media (max-width: 640px) {
    .pays-details-actions {
      flex-direction: column;
    }
    
    .pays-details-actions .btn {
      width: 100%;
      justify-content: center;
    }
  }
`;
document.head.appendChild(style);

// Sélection automatique d'un pays au chargement (Belgique par défaut)
setTimeout(() => {
  selectPays(1); // Belgique
}, 1000);