/**
 * PAGE LIVRAISON & EXPORT - L'Échoppe Gauloise
 * Gestion interactive de la page livraison
 */

(function() {
  'use strict';

  // Données des pays (avec quelques ajouts pour compléter 15 pays)
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
      coordinate: [50.8503, 4.3517],
      restrictions: "Aucune",
      contact: "export-be@echoppe-gauloise.com"
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
      coordinate: [51.1657, 10.4515],
      restrictions: "Certificat d'origine requis",
      contact: "export-de@echoppe-gauloise.com"
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
      coordinate: [55.3781, -3.4360],
      restrictions: "Documents phytosanitaires",
      contact: "export-uk@echoppe-gauloise.com"
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
      coordinate: [46.8182, 8.2275],
      restrictions: "TVA suisse applicable",
      contact: "export-ch@echoppe-gauloise.com"
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
      coordinate: [40.4637, -3.7492],
      restrictions: "Aucune",
      contact: "export-es@echoppe-gauloise.com"
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
      coordinate: [41.8719, 12.5674],
      restrictions: "Contrôles sanitaires",
      contact: "export-it@echoppe-gauloise.com"
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
      coordinate: [37.0902, -95.7129],
      restrictions: "Importer's Permit obligatoire",
      contact: "export-us@echoppe-gauloise.com"
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
      coordinate: [56.1304, -106.3468],
      restrictions: "Étiquettes bilingues",
      contact: "export-ca@echoppe-gauloise.com"
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
      coordinate: [36.2048, 138.2529],
      restrictions: "Certificat d'analyse complet",
      contact: "export-jp@echoppe-gauloise.com"
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
      coordinate: [-25.2744, 133.7751],
      restrictions: "Quarantaine possible",
      contact: "export-au@echoppe-gauloise.com"
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
      coordinate: [23.4241, 53.8478],
      restrictions: "Certificat Halal optionnel",
      contact: "export-ae@echoppe-gauloise.com"
    },
    {
      id: 12,
      name: "Pays-Bas",
      code: "NL",
      continent: "europe",
      flag: "https://flagcdn.com/nl.svg",
      clients: 70,
      depuis: 2010,
      delai: "2-3 jours",
      produits: ["IPA Gauloise", "Blonde Tradition", "Rosé de Provence"],
      coordinate: [52.1326, 5.2913],
      restrictions: "Aucune",
      contact: "export-nl@echoppe-gauloise.com"
    },
    {
      id: 13,
      name: "Luxembourg",
      code: "LU",
      continent: "europe",
      flag: "https://flagcdn.com/lu.svg",
      clients: 40,
      depuis: 2011,
      delai: "2-3 jours",
      produits: ["Champagne Brut", "Bordeaux Réserve"],
      coordinate: [49.8153, 6.1296],
      restrictions: "Aucune",
      contact: "export-lu@echoppe-gauloise.com"
    },
    {
      id: 14,
      name: "Portugal",
      code: "PT",
      continent: "europe",
      flag: "https://flagcdn.com/pt.svg",
      clients: 45,
      depuis: 2014,
      delai: "5-7 jours",
      produits: ["Rosé de Provence", "Blonde Tradition"],
      coordinate: [39.3999, -8.2245],
      restrictions: "Contrôles douaniers",
      contact: "export-pt@echoppe-gauloise.com"
    },
    {
      id: 15,
      name: "Singapour",
      code: "SG",
      continent: "asie",
      flag: "https://flagcdn.com/sg.svg",
      clients: 35,
      depuis: 2019,
      delai: "10-12 jours",
      produits: ["Champagne Brut", "Bordeaux Réserve", "Sauternes"],
      coordinate: [1.3521, 103.8198],
      restrictions: "Stockage climatisé obligatoire",
      contact: "export-sg@echoppe-gauloise.com"
    }
  ];

  // Variables globales
  let map;
  let markers = [];
  let currentFilter = 'all';

  // Initialisation
  function initLivraisonPage() {
    console.log('🚚 Initialisation de la page Livraison & Export');
    
    // Initialiser Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    // Initialiser la navigation par type de client
    initTypeNavigation();
    
    // Initialiser la carte interactive
    initWorldMap();
    
    // Remplir le tableau des pays
    populateCountriesTable();
    
    // Initialiser les filtres de la carte
    initMapFilters();
    
    // Initialiser le calculateur de devis
    initQuoteCalculator();
    
    // Initialiser la demande de devis
    initQuoteRequest();
    
    console.log('✅ Page Livraison initialisée avec', paysData.length, 'pays');
  }

  // ============================================
  // NAVIGATION PAR TYPE DE CLIENT
  // ============================================
  function initTypeNavigation() {
    const navButtons = document.querySelectorAll('.type-nav-btn');
    const sections = document.querySelectorAll('.client-section');
    
    navButtons.forEach(button => {
      button.addEventListener('click', function() {
        const type = this.dataset.type;
        
        // Mettre à jour les boutons actifs
        navButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        
        // Afficher la section correspondante
        sections.forEach(section => {
          section.classList.remove('active');
          if (section.id === `section-${type}`) {
            section.classList.add('active');
          }
        });
        
        // Faire défiler vers la section
        document.getElementById(`section-${type}`).scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      });
    });
  }

  // ============================================
  // CARTE INTERACTIVE (Leaflet)
  // ============================================
  function initWorldMap() {
    const mapContainer = document.getElementById('worldMap');
    if (!mapContainer) return;
    
    // Initialiser la carte
    map = L.map('worldMap').setView([20, 0], 2);
    
    // Ajouter les tuiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '©OpenStreetMap, ©CartoDB',
      subdomains: 'abcd',
      maxZoom: 6,
      minZoom: 2
    }).addTo(map);
    
    // Créer un cluster de marqueurs
    const markersCluster = L.markerClusterGroup({
      iconCreateFunction: function(cluster) {
        const count = cluster.getChildCount();
        const continent = getDominantContinent(cluster.getAllChildMarkers());
        
        return L.divIcon({
          html: `<div class="marker-cluster ${continent}">${count}</div>`,
          className: 'marker-cluster-container',
          iconSize: L.point(40, 40)
        });
      }
    });
    
    // Ajouter les marqueurs pour chaque pays
    paysData.forEach(country => {
      const marker = L.marker(country.coordinate, {
        icon: L.divIcon({
          html: `<div class="country-marker ${country.continent}"><div class="marker-content"></div></div>`,
          className: 'custom-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })
      });
      
      // Popup avec informations du pays
      marker.bindPopup(`
        <div class="country-popup">
          <div class="popup-header">
            <img src="${country.flag}" alt="${country.name}" width="24">
            <h3>${country.name}</h3>
          </div>
          <div class="popup-content">
            <p><strong>Depuis :</strong> ${country.depuis}</p>
            <p><strong>Clients :</strong> ${country.clients}</p>
            <p><strong>Délai :</strong> ${country.delai}</p>
            <p><strong>Produits populaires :</strong> ${country.produits.slice(0, 2).join(', ')}</p>
            <a href="mailto:${country.contact}" class="popup-contact">
              <i data-lucide="mail" size="14"></i>
              Contacter
            </a>
          </div>
        </div>
      `);
      
      marker.countryData = country;
      markers.push(marker);
      markersCluster.addLayer(marker);
    });
    
    map.addLayer(markersCluster);
    
    // Recentrer la carte sur l'Europe
    map.setView([48.8566, 2.3522], 3);
  }

  function getDominantContinent(markers) {
    const continents = markers.map(m => m.countryData.continent);
    const counts = {};
    continents.forEach(c => counts[c] = (counts[c] || 0) + 1);
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  }

  // ============================================
  // FILTRES DE LA CARTE
  // ============================================
  function initMapFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
      button.addEventListener('click', function() {
        const continent = this.dataset.continent;
        
        // Mettre à jour les boutons actifs
        filterButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        
        // Filtrer les marqueurs
        filterMarkers(continent);
        
        // Mettre à jour le tableau
        filterCountriesTable(continent);
      });
    });
  }

  function filterMarkers(continent) {
    currentFilter = continent;
    
    // Pour une vraie implémentation avec Leaflet, il faudrait gérer le filtrage
    // Pour cette démo, on va juste simuler
    markers.forEach(marker => {
      const shouldShow = continent === 'all' || marker.countryData.continent === continent;
      // Dans une vraie implémentation, on manipulerait les layers de la carte
    });
    
    console.log(`Filtrage de la carte par continent: ${continent}`);
  }

  // ============================================
  // TABLEAU DES PAYS
  // ============================================
  function populateCountriesTable() {
    const tableBody = document.getElementById('countriesTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = paysData.map(country => `
      <tr data-continent="${country.continent}">
        <td>
          <div class="country-cell">
            <img src="${country.flag}" alt="${country.name}">
            <span>${country.name}</span>
          </div>
        </td>
        <td>${country.depuis}</td>
        <td>${country.clients}</td>
        <td><span class="delivery-time">${country.delai}</span></td>
        <td>
          <div class="products-list">
            ${country.produits.map(prod => `<span class="product-tag">${prod}</span>`).join('')}
          </div>
        </td>
        <td>${country.restrictions}</td>
        <td>
          <a href="mailto:${country.contact}" class="btn btn-sm btn-outline">
            <i data-lucide="mail" size="14"></i>
            Email
          </a>
        </td>
      </tr>
    `).join('');
    
    // Recréer les icônes Lucide dans le tableau
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  function filterCountriesTable(continent) {
    const rows = document.querySelectorAll('#countriesTableBody tr');
    
    rows.forEach(row => {
      const rowContinent = row.dataset.continent;
      const shouldShow = continent === 'all' || rowContinent === continent;
      
      if (shouldShow) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  }

  // ============================================
  // CALCULATEUR DE DEVIS
  // ============================================
  function initQuoteCalculator() {
    const countrySelect = document.getElementById('countrySelect');
    const decreaseBtn = document.getElementById('decreaseQty');
    const increaseBtn = document.getElementById('increaseQty');
    const quantityInput = document.getElementById('quantity');
    const calculateBtn = document.getElementById('calculateBtn');
    
    // Remplir la liste des pays
    if (countrySelect) {
      countrySelect.innerHTML = '<option value="">Sélectionnez un pays</option>' +
        paysData.map(country => 
          `<option value="${country.code}">${country.name}</option>`
        ).join('');
    }
    
    // Gérer les boutons de quantité
    if (decreaseBtn && increaseBtn && quantityInput) {
      decreaseBtn.addEventListener('click', () => {
        const currentValue = parseInt(quantityInput.value) || 10;
        if (currentValue > 1) {
          quantityInput.value = currentValue - 1;
        }
      });
      
      increaseBtn.addEventListener('click', () => {
        const currentValue = parseInt(quantityInput.value) || 10;
        if (currentValue < 1000) {
          quantityInput.value = currentValue + 1;
        }
      });
      
      quantityInput.addEventListener('change', function() {
        let value = parseInt(this.value) || 10;
        if (value < 1) value = 1;
        if (value > 1000) value = 1000;
        this.value = value;
      });
    }
    
    // Calculer le devis
    if (calculateBtn) {
      calculateBtn.addEventListener('click', calculateQuote);
    }
    
    // Initialiser un calcul par défaut
    setTimeout(calculateQuote, 1000);
  }

  function calculateQuote() {
    const countryCode = document.getElementById('countrySelect').value;
    const productType = document.getElementById('productType').value;
    const quantity = parseInt(document.getElementById('quantity').value) || 10;
    const clientType = document.getElementById('clientType').value;
    const transportType = document.getElementById('transportType').value;
    const insurance = document.getElementById('insurance').value;
    
    // Trouver le pays sélectionné
    const country = paysData.find(c => c.code === countryCode) || paysData[0];
    
    // Calcul des coûts (simplifié)
    let baseCost;
    
    // Coût de base par caisse selon le type de produit
    if (productType === 'vin') baseCost = 150;
    else if (productType === 'biere') baseCost = 80;
    else baseCost = 120; // mixte
    
    // Ajustement selon le type de client
    if (clientType === 'professionnel') baseCost *= 0.8; // -20% pour les pros
    
    // Coût du transport
    let transportCost;
    if (transportType === 'terrestre') {
      transportCost = quantity * 25;
    } else if (transportType === 'maritime') {
      transportCost = quantity * 15;
    } else {
      transportCost = quantity * 40; // aérien
    }
    
    // Coût des douanes et taxes
    let dutyCost = 0;
    if (country.continent === 'europe' && country.code !== 'GB') {
      dutyCost = 0; // Libre circulation dans l'UE
    } else if (country.code === 'GB') {
      dutyCost = quantity * 30; // Royaume-Uni
    } else if (country.continent === 'amerique') {
      dutyCost = quantity * 50;
    } else {
      dutyCost = quantity * 75; // Asie/Moyen-Orient
    }
    
    // Coût de l'assurance
    const goodsValue = quantity * baseCost;
    let insuranceCost = goodsValue * 0.01; // 1% par défaut
    if (insurance === 'complete') {
      insuranceCost = goodsValue * 0.02; // 2%
    }
    
    // Total
    const totalCost = transportCost + dutyCost + insuranceCost;
    
    // Mettre à jour l'affichage
    document.getElementById('transportCost').textContent = formatCurrency(transportCost);
    document.getElementById('dutyCost').textContent = formatCurrency(dutyCost);
    document.getElementById('insuranceCost').textContent = formatCurrency(insuranceCost);
    document.getElementById('totalCost').textContent = formatCurrency(totalCost);
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  // ============================================
  // DEMANDE DE DEVIS
  // ============================================
  function initQuoteRequest() {
    const requestBtn = document.getElementById('requestQuoteBtn');
    
    if (requestBtn) {
      requestBtn.addEventListener('click', function() {
        const countryCode = document.getElementById('countrySelect').value;
        const country = paysData.find(c => c.code === countryCode);
        const quantity = document.getElementById('quantity').value;
        const clientType = document.getElementById('clientType').value;
        
        if (!countryCode) {
          alert('Veuillez sélectionner un pays de destination.');
          return;
        }
        
        const subject = encodeURIComponent(`Demande de devis export - ${country.name}`);
        const body = encodeURIComponent(
          `Bonjour,\n\nJe souhaite obtenir un devis pour l'export vers ${country.name}.\n\n` +
          `Détails de ma demande:\n` +
          `- Type de client: ${clientType === 'professionnel' ? 'Professionnel' : 'Particulier'}\n` +
          `- Quantité estimée: ${quantity} caisses\n` +
          `- Produits: ${document.getElementById('productType').value}\n` +
          `- Transport: ${document.getElementById('transportType').value}\n\n` +
          `Merci de me faire parvenir un devis détaillé.\n\nCordialement,`
        );
        
        window.location.href = `mailto:export@echoppe-gauloise.com?subject=${subject}&body=${body}`;
      });
    }
  }

  // ============================================
  // UTILITAIRES
  // ============================================
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
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

  // ============================================
  // EXPORT DES FONCTIONNALITÉS
  // ============================================
  function filterByContinent(continent) {
    currentFilter = continent;
    filterMarkers(continent);
    filterCountriesTable(continent);
    
    // Mettre à jour les boutons de filtre
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.continent === continent);
    });
  }

  function showCountryDetails(countryCode) {
    const country = paysData.find(c => c.code === countryCode);
    if (!country || !map) return;
    
    // Centrer la carte sur le pays
    map.setView(country.coordinate, 5);
    
    // Ouvrir le popup du marqueur
    markers.forEach(marker => {
      if (marker.countryData.code === countryCode) {
        marker.openPopup();
      }
    });
    
    // Basculer vers la section export
    document.querySelectorAll('.type-nav-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.type === 'export') {
        btn.classList.add('active');
      }
    });
    
    document.querySelectorAll('.client-section').forEach(section => {
      section.classList.remove('active');
      if (section.id === 'section-export') {
        section.classList.add('active');
      }
    });
    
    // Faire défiler vers la section export
    document.getElementById('section-export').scrollIntoView({
      behavior: 'smooth'
    });
  }

  // ============================================
  // INITIALISATION
  // ============================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLivraisonPage);
  } else {
    initLivraisonPage();
  }

  // Exposer les fonctions globalement
  window.LivraisonModule = {
    init: initLivraisonPage,
    filterByContinent: filterByContinent,
    showCountryDetails: showCountryDetails,
    calculateQuote: calculateQuote,
    showNotification: showNotification,
    paysData: paysData
  };

  console.log(`

    ╔════════════════════════════════════════════════════════════════════════════════════╗
    ║                                                                                    ║
    ║                    🚚 LIVRAISON & EXPORT - L'Échoppe Gauloise 🍷                  ║
    ║                                                                                    ║
    ║         15 pays desservis | Carte interactive | Calculateur de devis               ║ 
    ║               Développé par Rodulfo DOMINGUEZ                                      ║
    ║                                                                                    ║
    ╚════════════════════════════════════════════════════════════════════════════════════╝

  `);

})();