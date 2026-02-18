/**
 * EXPORT PAGE - Gestion de la carte interactive, formulaires et témoignages
 * L'Échoppe Gauloise
 */

// Données des pays desservis
const paysData = [
  {
    id: 1,
    name: "Belgique",
    code: "BE",
    zone: "ue",
    flag: "https://flagcdn.com/be.svg",
    clients: 85,
    depuis: 2002,
    delai: "2-3 jours",
    coordinate: { x: 49, y: 40 }, // Position sur le globe
    featured: true
  },
  {
    id: 2,
    name: "Allemagne",
    code: "DE",
    zone: "ue",
    flag: "https://flagcdn.com/de.svg",
    clients: 120,
    depuis: 2003,
    delai: "3-4 jours",
    coordinate: { x: 50, y: 40 },
    featured: true
  },
  {
    id: 3,
    name: "Royaume-Uni",
    code: "GB",
    zone: "hors-ue",
    flag: "https://flagcdn.com/gb.svg",
    clients: 95,
    depuis: 2005,
    delai: "4-5 jours",
    coordinate: { x: 47, y: 39 },
    featured: true
  },
  {
    id: 4,
    name: "Suisse",
    code: "CH",
    zone: "hors-ue",
    flag: "https://flagcdn.com/ch.svg",
    clients: 65,
    depuis: 2006,
    delai: "3-4 jours",
    coordinate: { x: 50, y: 42 },
    featured: false
  },
  {
    id: 5,
    name: "Espagne",
    code: "ES",
    zone: "ue",
    flag: "https://flagcdn.com/es.svg",
    clients: 75,
    depuis: 2008,
    delai: "4-6 jours",
    coordinate: { x: 46, y: 44 },
    featured: false
  },
  {
    id: 6,
    name: "Italie",
    code: "IT",
    zone: "ue",
    flag: "https://flagcdn.com/it.svg",
    clients: 80,
    depuis: 2009,
    delai: "4-5 jours",
    coordinate: { x: 59, y: 44 },
    featured: false
  },
  {
    id: 7,
    name: "Pays-Bas",
    code: "NL",
    zone: "ue",
    flag: "https://flagcdn.com/nl.svg",
    clients: 70,
    depuis: 2004,
    delai: "2-3 jours",
    coordinate: { x: 49, y: 39 },
    featured: false
  },
  {
    id: 8,
    name: "États-Unis",
    code: "US",
    zone: "amerique",
    flag: "https://flagcdn.com/us.svg",
    clients: 150,
    depuis: 2012,
    delai: "7-10 jours",
    coordinate: { x: 18, y: 44 },
    featured: true
  },
  {
    id: 9,
    name: "Canada",
    code: "CA",
    zone: "amerique",
    flag: "https://flagcdn.com/ca.svg",
    clients: 90,
    depuis: 2013,
    delai: "8-12 jours",
    coordinate: { x: 18, y: 37 },
    featured: false
  },
  {
    id: 10,
    name: "Japon",
    code: "JP",
    zone: "asie",
    flag: "https://flagcdn.com/jp.svg",
    clients: 110,
    depuis: 2015,
    delai: "10-14 jours",
    coordinate: { x: 86, y: 45 },
    featured: true
  },
  {
    id: 11,
    name: "Australie",
    code: "AU",
    zone: "asie",
    flag: "https://flagcdn.com/au.svg",
    clients: 60,
    depuis: 2016,
    delai: "12-16 jours",
    coordinate: { x: 85, y: 65 },
    featured: false
  },
  {
    id: 12,
    name: "Singapour",
    code: "SG",
    zone: "asie",
    flag: "https://flagcdn.com/sg.svg",
    clients: 45,
    depuis: 2017,
    delai: "10-12 jours",
    coordinate: { x: 76, y: 56 },
    featured: false
  },
  {
    id: 13,
    name: "Émirats Arabes Unis",
    code: "AE",
    zone: "moyen-orient",
    flag: "https://flagcdn.com/ae.svg",
    clients: 55,
    depuis: 2018,
    delai: "8-10 jours",
    coordinate: { x: 62, y: 50 },
    featured: true
  },
  {
    id: 14,
    name: "Suède",
    code: "SE",
    zone: "ue",
    flag: "https://flagcdn.com/se.svg",
    clients: 40,
    depuis: 2011,
    delai: "4-6 jours",
    coordinate: { x: 52, y: 35 },
    featured: false
  },
  {
    id: 15,
    name: "Danemark",
    code: "DK",
    zone: "ue",
    flag: "https://flagcdn.com/dk.svg",
    clients: 35,
    depuis: 2010,
    delai: "3-5 jours",
    coordinate: { x: 50, y: 38 },
    featured: false
  }
];

// Données des témoignages
const temoignagesData = [
  {
    id: 1,
    nom: "Michael Schmidt",
    entreprise: "Weinhandlung Schmidt",
    pays: "Allemagne",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    note: 5,
    contenu: "L'Échoppe Gauloise a transformé notre offre de vins français. Leur expertise logistique et leur sélection de produits sont exceptionnelles. Nos clients sont ravis !",
    date: "15/03/2024"
  },
  {
    id: 2,
    nom: "Sophie Williams",
    entreprise: "Artisan Beers Ltd",
    pays: "Royaume-Uni",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop",
    note: 5,
    contenu: "Nous travaillons avec eux depuis 3 ans. Leur service client est impeccable et leurs bières artisanales sont un véritable succès sur le marché britannique.",
    date: "02/04/2024"
  },
  {
    id: 3,
    nom: "Kenji Tanaka",
    entreprise: "French Delights Tokyo",
    pays: "Japon",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    note: 5,
    contenu: "Importateur de produits français depuis 15 ans, je n'ai jamais vu un service aussi professionnel. Les certifications douanières sont parfaites.",
    date: "28/02/2024"
  },
  {
    id: 4,
    nom: "Emma Dubois",
    entreprise: "Caviste du Vieux Port",
    pays: "Canada",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
    note: 4,
    contenu: "Leur accompagnement pour les réglementations canadiennes a été précieux. Les vins arrivent toujours en parfait état.",
    date: "10/01/2024"
  },
  {
    id: 5,
    nom: "Ahmed Al Mansoori",
    entreprise: "Luxe Beverages Dubai",
    pays: "Émirats Arabes Unis",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    note: 5,
    contenu: "Leur connaissance des certifications HALAL et des marchés du Golfe est impressionnante. Partenaire de confiance.",
    date: "22/12/2023"
  }
];

// Variables globales
let currentPays = null;
let currentTemoignageIndex = 0;
const temoignagesParSlide = 1;

// DOM Elements
const interactiveGlobe = document.getElementById('interactiveGlobe');
const paysGrid = document.getElementById('paysGrid');
const paysSelect = document.getElementById('pays');
const expertPaysSelect = document.getElementById('expert-pays');
const volumeSlider = document.getElementById('volume');
const volumeValue = document.getElementById('volumeValue');
const temoignagesTrack = document.getElementById('temoignagesTrack');
const sliderDots = document.getElementById('sliderDots');
const prevTemoignageBtn = document.getElementById('prevTemoignage');
const nextTemoignageBtn = document.getElementById('nextTemoignage');
const contactExpertModal = document.getElementById('contactExpertModal');
const contactExpertBtn = document.getElementById('contactExportBtn');
const devisBtn = document.getElementById('devisBtn');
const modalClose = document.getElementById('modalClose');
const faqQuestions = document.querySelectorAll('.faq-question');

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  initGlobe();
  initPays();
  initTemoignages();
  initFormulaires();
  initFAQ();
  initModal();
  updateCartBadge();
});

// Dans la fonction initGlobe(), modifiez la création des marqueurs :
function initGlobe() {
  if (!interactiveGlobe) return;
  
  // Créer les marqueurs de pays
  paysData.forEach(pays => {
    const marker = document.createElement('div');
    marker.className = 'country-marker';
    marker.dataset.countryId = pays.id;
    marker.dataset.countryName = pays.name;
    marker.style.left = `${pays.coordinate.x}%`;
    marker.style.top = `${pays.coordinate.y}%`;
    
    // Ajouter un tooltip
    const tooltip = document.createElement('span');
    tooltip.className = 'country-tooltip';
    tooltip.textContent = pays.name;
    marker.appendChild(tooltip);
    
    marker.addEventListener('click', () => {
      // Retirer la classe active de tous les marqueurs
      document.querySelectorAll('.country-marker').forEach(m => {
        m.classList.remove('active');
        m.style.zIndex = '1';
      });
      
      // Ajouter la classe active au marqueur cliqué
      marker.classList.add('active');
      marker.style.zIndex = '20';
      
      // Mettre à jour la sélection dans la grille
      selectPaysCard(pays.id);
      
      // Scroll vers la section pays
      document.querySelector('.pays-desservis').scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    });
    
    marker.addEventListener('mouseenter', () => {
      if (!marker.classList.contains('active')) {
        marker.style.transform = 'translate(-50%, -50%) scale(1.3)';
        marker.style.zIndex = '15';
      }
    });
    
    marker.addEventListener('mouseleave', () => {
      if (!marker.classList.contains('active')) {
        marker.style.transform = 'translate(-50%, -50%)';
        marker.style.zIndex = '1';
      }
    });
    
    interactiveGlobe.appendChild(marker);
  });
}

// Initialisation des cartes de pays
function initPays() {
  if (!paysGrid) return;
  
  // Générer les cartes de pays
  paysGrid.innerHTML = paysData.map(pays => createPaysCard(pays)).join('');
  
  // Remplir les select de pays
  const selectOptions = paysData.map(pays => 
    `<option value="${pays.code}">${pays.name}</option>`
  ).join('');
  
  if (paysSelect) {
    paysSelect.innerHTML = '<option value="">Sélectionnez un pays</option>' + selectOptions;
  }
  
  if (expertPaysSelect) {
    expertPaysSelect.innerHTML = '<option value="">Sélectionnez un pays</option>' + selectOptions;
  }
  
  // Ajouter les écouteurs d'événements aux cartes
  document.querySelectorAll('.pays-card').forEach(card => {
    card.addEventListener('click', function() {
      const paysId = parseInt(this.dataset.countryId);
      selectPaysCard(paysId);
      
      // Mettre à jour le globe
      updateGlobeMarker(paysId);
    });
  });
}

// Création d'une carte de pays
function createPaysCard(pays) {
  const zoneClass = getZoneClass(pays.zone);
  
  return `
    <div class="pays-card ${zoneClass}" data-country-id="${pays.id}">
      ${pays.featured ? '<span class="pays-badge">★ Top</span>' : ''}
      <div class="pays-flag">
        <img src="${pays.flag}" alt="Drapeau ${pays.name}" loading="lazy">
      </div>
      <h3>${pays.name}</h3>
      <div class="pays-info">
        <span>Export depuis ${pays.depuis}</span>
      </div>
      <div class="pays-stats">
        <div class="pays-stat">
          <strong>${pays.clients}+</strong>
          <span>Clients</span>
        </div>
        <div class="pays-stat">
          <strong>${pays.delai}</strong>
          <span>Livraison</span>
        </div>
      </div>
    </div>
  `;
}

// Obtenir la classe CSS pour la zone
function getZoneClass(zone) {
  const zoneClasses = {
    'ue': 'zone-ue',
    'amerique': 'zone-amerique',
    'asie': 'zone-asie',
    'moyen-orient': 'zone-moyen-orient',
    'hors-ue': 'zone-hors-ue'
  };
  return zoneClasses[zone] || '';
}

// Sélectionner une carte de pays
function selectPaysCard(paysId) {
  // Retirer la classe active de toutes les cartes
  document.querySelectorAll('.pays-card').forEach(card => {
    card.classList.remove('active');
  });
  
  // Ajouter la classe active à la carte sélectionnée
  const selectedCard = document.querySelector(`.pays-card[data-country-id="${paysId}"]`);
  if (selectedCard) {
    selectedCard.classList.add('active');
    currentPays = paysId;
  }
}

// Mettre à jour le marqueur sur le globe
function updateGlobeMarker(paysId) {
  // Retirer la classe active de tous les marqueurs
  document.querySelectorAll('.country-marker').forEach(marker => {
    marker.classList.remove('active');
  });
  
  // Ajouter la classe active au marqueur correspondant
  const selectedMarker = document.querySelector(`.country-marker[data-country-id="${paysId}"]`);
  if (selectedMarker) {
    selectedMarker.classList.add('active');
    selectedMarker.classList.add('pulse-animation');
    
    // Arrêter l'animation après 2 secondes
    setTimeout(() => {
      selectedMarker.classList.remove('pulse-animation');
    }, 2000);
  }
}

// Initialisation des témoignages
function initTemoignages() {
  if (!temoignagesTrack || !sliderDots) return;
  
  // Générer les slides de témoignages
  temoignagesTrack.innerHTML = temoignagesData.map(temoignage => createTemoignageSlide(temoignage)).join('');
  
  // Générer les dots de navigation
  sliderDots.innerHTML = temoignagesData.map((_, index) => 
    `<span class="slider-dot ${index === 0 ? 'active' : ''}" data-index="${index}"></span>`
  ).join('');
  
  // Ajouter les écouteurs d'événements aux dots
  document.querySelectorAll('.slider-dot').forEach(dot => {
    dot.addEventListener('click', function() {
      const index = parseInt(this.dataset.index);
      goToTemoignage(index);
    });
  });
  
  // Configurer les boutons de navigation
  if (prevTemoignageBtn && nextTemoignageBtn) {
    prevTemoignageBtn.addEventListener('click', () => {
      if (currentTemoignageIndex > 0) {
        goToTemoignage(currentTemoignageIndex - 1);
      }
    });
    
    nextTemoignageBtn.addEventListener('click', () => {
      if (currentTemoignageIndex < temoignagesData.length - 1) {
        goToTemoignage(currentTemoignageIndex + 1);
      }
    });
  }
  
  // Initialiser le slider
  updateSliderControls();
}

// Création d'un slide de témoignage
function createTemoignageSlide(temoignage) {
  const stars = '★'.repeat(temoignage.note) + '☆'.repeat(5 - temoignage.note);
  
  return `
    <div class="temoignage-card">
      <div class="temoignage-header">
        <div class="temoignage-avatar">
          <img src="${temoignage.avatar}" alt="${temoignage.nom}" loading="lazy">
        </div>
        <div class="temoignage-info">
          <h4>${temoignage.nom}</h4>
          <span>${temoignage.entreprise}</span>
          <div class="temoignage-rating">
            ${stars.split('').map(star => 
              `<i data-lucide="${star === '★' ? 'star' : 'star'}" size="16" ${star === '★' ? 'fill="currentColor"' : ''}></i>`
            ).join('')}
          </div>
        </div>
      </div>
      <div class="temoignage-content">
        ${temoignage.contenu}
      </div>
      <div class="temoignage-footer">
        <div class="temoignage-pays">
          <i data-lucide="map-pin" size="16"></i>
          <span>${temoignage.pays}</span>
        </div>
        <div class="temoignage-date">
          ${temoignage.date}
        </div>
      </div>
    </div>
  `;
}

// Naviguer vers un témoignage spécifique
function goToTemoignage(index) {
  currentTemoignageIndex = index;
  
  // Mettre à jour la position du slider
  const trackWidth = temoignagesTrack.clientWidth;
  temoignagesTrack.style.transform = `translateX(-${index * trackWidth}px)`;
  
  // Mettre à jour les dots actifs
  document.querySelectorAll('.slider-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
  });
  
  // Mettre à jour les contrôles
  updateSliderControls();
  
  // Recréer les icônes Lucide
  lucide.createIcons();
}

// Mettre à jour les contrôles du slider
function updateSliderControls() {
  if (prevTemoignageBtn && nextTemoignageBtn) {
    prevTemoignageBtn.disabled = currentTemoignageIndex === 0;
    nextTemoignageBtn.disabled = currentTemoignageIndex === temoignagesData.length - 1;
  }
}

// Initialisation des formulaires
function initFormulaires() {
  // Gestion du slider de volume
  if (volumeSlider && volumeValue) {
    volumeSlider.addEventListener('input', function() {
      const value = parseInt(this.value);
      volumeValue.textContent = `${value.toLocaleString()} unités`;
      
      // Mettre à jour la couleur du slider thumb
      const percentage = (value - 50) / (10000 - 50) * 100;
      this.style.background = `linear-gradient(to right, var(--accent) 0%, var(--accent) ${percentage}%, var(--border) ${percentage}%, var(--border) 100%)`;
    });
    
    // Initialiser la valeur
    volumeValue.textContent = `${parseInt(volumeSlider.value).toLocaleString()} unités`;
  }
  
  // Gestion du formulaire principal
  const exportForm = document.getElementById('exportForm');
  if (exportForm) {
    exportForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      if (validateExportForm(this)) {
        submitExportForm(this);
      }
    });
  }
  
  // Gestion du formulaire expert
  const expertForm = document.getElementById('expertForm');
  if (expertForm) {
    expertForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      if (validateExpertForm(this)) {
        submitExpertForm(this);
      }
    });
  }
  
  // Gestion du formulaire newsletter
  const newsletterForm = document.getElementById('exportNewsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const email = this.querySelector('input[type="email"]').value;
      if (validateEmail(email)) {
        submitNewsletterForm(email);
      } else {
        showNotification('Veuillez entrer une adresse email valide.', 'error');
      }
    });
  }
}

// Validation du formulaire principal
function validateExportForm(form) {
  const requiredFields = form.querySelectorAll('[required]');
  let isValid = true;
  
  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      isValid = false;
      highlightError(field);
    } else {
      removeError(field);
    }
    
    // Validation spécifique pour l'email
    if (field.type === 'email' && field.value.trim()) {
      if (!validateEmail(field.value)) {
        isValid = false;
        highlightError(field, 'Email invalide');
      }
    }
  });
  
  // Vérifier la case à cocher
  const consent = form.querySelector('#consent');
  if (consent && !consent.checked) {
    isValid = false;
    highlightError(consent, 'Veuillez accepter les conditions');
  }
  
  return isValid;
}

// Validation du formulaire expert
function validateExpertForm(form) {
  const requiredFields = form.querySelectorAll('[required]');
  let isValid = true;
  
  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      isValid = false;
      highlightError(field);
    } else {
      removeError(field);
    }
    
    // Validation spécifique pour l'email
    if (field.type === 'email' && field.value.trim()) {
      if (!validateEmail(field.value)) {
        isValid = false;
        highlightError(field, 'Email invalide');
      }
    }
    
    // Validation spécifique pour le téléphone
    if (field.type === 'tel' && field.value.trim()) {
      if (!validatePhone(field.value)) {
        isValid = false;
        highlightError(field, 'Téléphone invalide');
      }
    }
  });
  
  return isValid;
}

// Validation d'email
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Validation de téléphone
function validatePhone(phone) {
  const re = /^[\+]?[0-9\s\-\(\)\.]{10,}$/;
  return re.test(phone);
}

// Mettre en évidence une erreur
function highlightError(field, message = 'Ce champ est requis') {
  field.style.borderColor = '#EF4444';
  
  // Créer ou mettre à jour le message d'erreur
  let errorElement = field.parentElement.querySelector('.error-message');
  if (!errorElement) {
    errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.style.color = '#EF4444';
    errorElement.style.fontSize = '12px';
    errorElement.style.marginTop = '4px';
    field.parentElement.appendChild(errorElement);
  }
  
  errorElement.textContent = message;
}

// Supprimer l'erreur
function removeError(field) {
  field.style.borderColor = '';
  
  const errorElement = field.parentElement.querySelector('.error-message');
  if (errorElement) {
    errorElement.remove();
  }
}

// Soumission du formulaire principal
function submitExportForm(form) {
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  
  // Simulation d'envoi
  console.log('Formulaire export soumis:', data);
  
  // Afficher une notification
  showNotification('Votre demande de devis a été envoyée ! Nous vous répondrons sous 48h.');
  
  // Réinitialiser le formulaire
  form.reset();
  volumeValue.textContent = '500 unités';
  
  // Sauvegarder dans localStorage (simulation)
  saveExportRequest(data);
}

// Soumission du formulaire expert
function submitExpertForm(form) {
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  
  // Simulation d'envoi
  console.log('Formulaire expert soumis:', data);
  
  // Afficher une notification
  showNotification('Votre demande de rappel a été enregistrée. Un expert vous contactera sous 24h.');
  
  // Fermer la modal
  closeModal();
  
  // Réinitialiser le formulaire
  form.reset();
  
  // Sauvegarder dans localStorage (simulation)
  saveExpertRequest(data);
}

// Soumission du formulaire newsletter
function submitNewsletterForm(email) {
  // Simulation d'envoi
  console.log('Newsletter export soumise:', email);
  
  // Afficher une notification
  showNotification('Merci ! Le guide export a été envoyé à votre adresse email.');
  
  // Sauvegarder dans localStorage
  saveNewsletterSubscription(email);
}

// Sauvegarder une demande d'export
function saveExportRequest(data) {
  let requests = JSON.parse(localStorage.getItem('exportRequests')) || [];
  requests.push({
    ...data,
    date: new Date().toISOString(),
    status: 'pending'
  });
  localStorage.setItem('exportRequests', JSON.stringify(requests));
}

// Sauvegarder une demande expert
function saveExpertRequest(data) {
  let requests = JSON.parse(localStorage.getItem('expertRequests')) || [];
  requests.push({
    ...data,
    date: new Date().toISOString(),
    status: 'pending'
  });
  localStorage.setItem('expertRequests', JSON.stringify(requests));
}

// Sauvegarder une inscription newsletter
function saveNewsletterSubscription(email) {
  let subscriptions = JSON.parse(localStorage.getItem('exportNewsletter')) || [];
  if (!subscriptions.includes(email)) {
    subscriptions.push(email);
    localStorage.setItem('exportNewsletter', JSON.stringify(subscriptions));
  }
}

// Initialisation de la FAQ
function initFAQ() {
  faqQuestions.forEach(question => {
    question.addEventListener('click', function() {
      const answer = this.nextElementSibling;
      const isActive = this.classList.contains('active');
      
      // Fermer toutes les autres questions
      faqQuestions.forEach(q => {
        if (q !== this) {
          q.classList.remove('active');
          q.nextElementSibling.classList.remove('active');
        }
      });
      
      // Basculer l'état de la question actuelle
      this.classList.toggle('active', !isActive);
      answer.classList.toggle('active', !isActive);
      
      // Animer l'icône
      const icon = this.querySelector('i');
      icon.style.transform = !isActive ? 'rotate(180deg)' : 'rotate(0deg)';
    });
  });
}

// Initialisation de la modal
function initModal() {
  if (!contactExpertBtn || !contactExpertModal || !modalClose) return;
  
  // Bouton "Parler à un expert"
  contactExpertBtn.addEventListener('click', () => {
    openModal();
  });
  
  // Bouton "Demander un devis"
  if (devisBtn) {
    devisBtn.addEventListener('click', () => {
      document.getElementById('formulaireDevis').scrollIntoView({
        behavior: 'smooth'
      });
    });
  }
  
  // Fermer la modal
  modalClose.addEventListener('click', closeModal);
  
  // Fermer en cliquant en dehors
  contactExpertModal.addEventListener('click', (e) => {
    if (e.target === contactExpertModal) {
      closeModal();
    }
  });
  
  // Fermer avec la touche ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && contactExpertModal.classList.contains('active')) {
      closeModal();
    }
  });
}

// Ouvrir la modal
function openModal() {
  contactExpertModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Fermer la modal
function closeModal() {
  contactExpertModal.classList.remove('active');
  document.body.style.overflow = '';
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

// Auto-play du slider de témoignages
function initAutoPlaySlider() {
  setInterval(() => {
    if (currentTemoignageIndex < temoignagesData.length - 1) {
      goToTemoignage(currentTemoignageIndex + 1);
    } else {
      goToTemoignage(0);
    }
  }, 5000); // Change toutes les 5 secondes
}

// Démarrer l'auto-play
initAutoPlaySlider();

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
  
  .zone-ue {
    border-left: 4px solid #3B82F6;
  }
  
  .zone-amerique {
    border-left: 4px solid #10B981;
  }
  
  .zone-asie {
    border-left: 4px solid #F59E0B;
  }
  
  .zone-moyen-orient {
    border-left: 4px solid #8B5CF6;
  }
  
  .zone-hors-ue {
    border-left: 4px solid #64748B;
  }
  
  .pays-card.active {
    border-left-width: 8px;
    transform: scale(1.02);
  }
  
  .toast-notification.error {
    background: #EF4444 !important;
  }
  
  .toast-notification.success {
    background: var(--primary) !important;
  }
  
  /* Animation pour les cartes de pays */
  .pays-card {
    transition: all 0.3s ease;
  }
  
  .pays-card:hover .pays-flag {
    transform: scale(1.1);
  }
  
  .pays-flag {
    transition: transform 0.3s ease;
  }
  
  /* Animation pour les avantages */
  .avantage-card:hover .avantage-icon {
    transform: rotate(10deg) scale(1.1);
  }
  
  .avantage-icon {
    transition: all 0.3s ease;
  }
  
  /* Animation pour les étapes du processus */
  .processus-step:hover .step-number {
    transform: translateX(-50%) scale(1.2);
    box-shadow: 0 0 0 8px rgba(245, 158, 11, 0.2);
  }
  
  .step-number {
    transition: all 0.3s ease;
  }
`;
document.head.appendChild(style);