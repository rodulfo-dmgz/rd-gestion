/**
 * PAGE PROCESSUS EXPORT - Gestion de la timeline interactive et des étapes
 * L'Échoppe Gauloise
 */

// Données des étapes du processus
const etapesData = [
  {
    id: 1,
    titre: "Consultation Initiale & Analyse",
    description: "Analyse approfondie de vos besoins et du marché cible",
    duree: "24-48h",
    icon: "users",
    couleur: "#3B82F6",
    contenu: {
      livrables: ["Analyse de marché", "Étude des réglementations"],
      equipe: ["Expert export", "Conseiller juridique"],
      checkpoints: [
        "Analyse approfondie du marché cible",
        "Évaluation des réglementations locales",
        "Définition des volumes et fréquences",
        "Identification des certifications nécessaires",
        "Étude des coûts préliminaires"
      ]
    }
  },
  {
    id: 2,
    titre: "Devis Personnalisé & Contrat",
    description: "Proposition commerciale détaillée et contrat sécurisé",
    duree: "48h",
    icon: "file-text",
    couleur: "#10B981",
    contenu: {
      livrables: ["Devis détaillé", "Contrat d'exportation"],
      equipe: ["Commercial", "Expert juridique"],
      checkpoints: [
        "Devis transparent sans coûts cachés",
        "Contrat juridiquement sécurisé",
        "Détail des assurances et garanties",
        "Modalités de paiement flexibles",
        "Conditions de révision du contrat"
      ]
    }
  },
  {
    id: 3,
    titre: "Préparation & Conditionnement",
    description: "Conditionnement spécialisé et documentation complète",
    duree: "3-5 jours",
    icon: "package",
    couleur: "#F59E0B",
    contenu: {
      livrables: ["Produits conditionnés", "Documentation complète"],
      equipe: ["Logisticiens", "Agents douaniers"],
      checkpoints: [
        "Conditionnement spécifique à chaque produit",
        "Contrôle qualité avant emballage",
        "Établissement des documents douaniers",
        "Marquage et étiquetage multilingue",
        "Scan des produits pour suivi"
      ]
    }
  },
  {
    id: 4,
    titre: "Transport & Dédouanement",
    description: "Gestion complète du transport et des formalités douanières",
    duree: "2-10 jours",
    icon: "truck",
    couleur: "#8B5CF6",
    contenu: {
      livrables: ["Certificat de dédouanement", "Suivi en direct"],
      equipe: ["Transitaires", "Agents de douane"],
      checkpoints: [
        "Choix du mode de transport optimal",
        "Gestion complète des formalités",
        "Suivi GPS en temps réel",
        "Assurance tous risques incluse",
        "Communication proactive"
      ]
    }
  },
  {
    id: 5,
    titre: "Livraison & Suivi Post-Vente",
    description: "Distribution finale et accompagnement continu",
    duree: "1-3 jours",
    icon: "check-circle",
    couleur: "#EF4444",
    contenu: {
      livrables: ["Accusé de réception", "Rapport de livraison"],
      equipe: ["Service client", "Expert export"],
      checkpoints: [
        "Livraison à l'adresse exacte",
        "Vérification de l'état des produits",
        "Signature numérique de réception",
        "Enquête de satisfaction",
        "Planification du réapprovisionnement"
      ]
    }
  }
];

// Variables globales
let currentEtape = 1;
let autoPlayInterval;

// DOM Elements
const timelineProgress = document.getElementById('timelineProgress');
const timelineDots = document.querySelectorAll('.timeline-dot');
const timelineItems = document.querySelectorAll('.timeline-item');
const prevStepBtn = document.getElementById('prevStep');
const nextStepBtn = document.getElementById('nextStep');
const contactExpertModal = document.getElementById('contactExpertModal');
const contactExpertBtn = document.getElementById('contactExpertBtn');
const ctaExpertBtn = document.getElementById('ctaExpertBtn');
const modalClose = document.getElementById('modalClose');
const faqQuestions = document.querySelectorAll('.faq-question');
const expertPaysSelect = document.getElementById('expert-pays');
const heroTimelineProgress = document.querySelector('.timeline-progress');

// Données des pays pour les selects
const paysData = [
  { code: "BE", name: "Belgique" },
  { code: "DE", name: "Allemagne" },
  { code: "GB", name: "Royaume-Uni" },
  { code: "CH", name: "Suisse" },
  { code: "ES", name: "Espagne" },
  { code: "IT", name: "Italie" },
  { code: "NL", name: "Pays-Bas" },
  { code: "US", name: "États-Unis" },
  { code: "CA", name: "Canada" },
  { code: "JP", name: "Japon" },
  { code: "AU", name: "Australie" },
  { code: "SG", name: "Singapour" },
  { code: "AE", name: "Émirats Arabes Unis" },
  { code: "SE", name: "Suède" },
  { code: "DK", name: "Danemark" }
];

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  initTimeline();
  initModal();
  initFAQ();
  initNavigation();
  initSmoothScroll();
  updateCartBadge();
  
  // Démarrer l'auto-play
  startAutoPlay();
  
  // Initialiser les icônes Lucide
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
});

// Initialisation de la timeline
function initTimeline() {
  if (!timelineProgress) return;
  
  // Mettre à jour la progression initiale
  updateTimelineProgress();
  
  // Ajouter les écouteurs d'événements aux dots
  timelineDots.forEach(dot => {
    dot.addEventListener('click', function() {
      const step = parseInt(this.dataset.step);
      goToEtape(step);
    });
  });
  
  // Ajouter les écouteurs d'événements aux items de timeline
  timelineItems.forEach(item => {
    item.addEventListener('click', function() {
      const step = parseInt(this.dataset.step);
      goToEtape(step);
    });
  });
  
  // Configurer les boutons de navigation
  if (prevStepBtn && nextStepBtn) {
    prevStepBtn.addEventListener('click', () => {
      if (currentEtape > 1) {
        goToEtape(currentEtape - 1);
      }
    });
    
    nextStepBtn.addEventListener('click', () => {
      if (currentEtape < etapesData.length) {
        goToEtape(currentEtape + 1);
      }
    });
  }
}

// Naviguer vers une étape spécifique
function goToEtape(etapeId) {
  if (etapeId < 1 || etapeId > etapesData.length) return;
  
  currentEtape = etapeId;
  
  // Mettre à jour la timeline
  updateTimelineUI();
  
  // Scroll vers l'étape correspondante
  const etapeElement = document.getElementById(`etape-${etapeId}`);
  if (etapeElement) {
    etapeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
    
    // Ajouter une animation de highlight
    etapeElement.classList.add('highlight-animation');
    setTimeout(() => {
      etapeElement.classList.remove('highlight-animation');
    }, 2000);
  }
}

// Mettre à jour l'interface de la timeline
function updateTimelineUI() {
  // Mettre à jour la progression
  updateTimelineProgress();
  
  // Mettre à jour les dots actifs
  timelineDots.forEach(dot => {
    const dotStep = parseInt(dot.dataset.step);
    dot.classList.toggle('active', dotStep === currentEtape);
  });
  
  // Mettre à jour les items actifs
  timelineItems.forEach(item => {
    const itemStep = parseInt(item.dataset.step);
    item.classList.toggle('active', itemStep === currentEtape);
  });
  
  // Mettre à jour les contrôles
  updateTimelineControls();
}

// Mettre à jour la barre de progression
function updateTimelineProgress() {
  if (timelineProgress) {
    const progress = ((currentEtape - 1) / (etapesData.length - 1)) * 100;
    timelineProgress.style.width = `${progress}%`;
  }
  
  if (heroTimelineProgress) {
    const progress = ((currentEtape - 1) / (etapesData.length - 1)) * 100;
    heroTimelineProgress.style.width = `${progress}%`;
  }
}

// Mettre à jour les contrôles de la timeline
function updateTimelineControls() {
  if (prevStepBtn && nextStepBtn) {
    prevStepBtn.disabled = currentEtape === 1;
    nextStepBtn.disabled = currentEtape === etapesData.length;
  }
}

// Initialisation de la modal
function initModal() {
  // Remplir le select de pays
  if (expertPaysSelect) {
    const selectOptions = paysData.map(pays => 
      `<option value="${pays.code}">${pays.name}</option>`
    ).join('');
    
    expertPaysSelect.innerHTML = '<option value="">Sélectionnez un pays</option>' + selectOptions;
  }
  
  // Bouton "Discuter avec un expert" (hero)
  if (contactExpertBtn) {
    contactExpertBtn.addEventListener('click', openModal);
  }
  
  // Bouton "Planifier un appel" (CTA)
  if (ctaExpertBtn) {
    ctaExpertBtn.addEventListener('click', openModal);
  }
  
  // Fermer la modal
  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }
  
  // Fermer en cliquant en dehors
  if (contactExpertModal) {
    contactExpertModal.addEventListener('click', (e) => {
      if (e.target === contactExpertModal) {
        closeModal();
      }
    });
  }
  
  // Fermer avec la touche ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && contactExpertModal && contactExpertModal.classList.contains('active')) {
      closeModal();
    }
  });
  
  // Gestion du formulaire expert - CORRECTION ICI : utiliser le bon ID
  const expertForm = document.getElementById('verification-form');
  if (expertForm) {
    expertForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      if (validateExpertForm(this)) {
        submitExpertForm(this);
      }
    });
  }
}

// Ouvrir la modal
function openModal() {
  if (contactExpertModal) {
    contactExpertModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

// Fermer la modal
function closeModal() {
  if (contactExpertModal) {
    contactExpertModal.classList.remove('active');
    document.body.style.overflow = '';
  }
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

// Soumission du formulaire expert
function submitExpertForm(form) {
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  
  // Simulation d'envoi
  console.log('Formulaire processus expert soumis:', data);
  
  // Afficher une notification
  showNotification('Votre demande a été enregistrée. Un expert vous contactera sous 24h pour planifier l\'appel.');
  
  // Fermer la modal
  closeModal();
  
  // Réinitialiser le formulaire
  form.reset();
  
  // Sauvegarder dans localStorage (simulation)
  saveProcessusRequest(data);
}

// Sauvegarder une demande processus
function saveProcessusRequest(data) {
  let requests = JSON.parse(localStorage.getItem('processusRequests')) || [];
  requests.push({
    ...data,
    date: new Date().toISOString(),
    status: 'pending'
  });
  localStorage.setItem('processusRequests', JSON.stringify(requests));
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

// Initialisation de la navigation
function initNavigation() {
  // Navigation par clavier
  document.addEventListener('keydown', (e) => {
    switch(e.key) {
      case 'ArrowLeft':
        if (currentEtape > 1) {
          goToEtape(currentEtape - 1);
        }
        break;
      case 'ArrowRight':
        if (currentEtape < etapesData.length) {
          goToEtape(currentEtape + 1);
        }
        break;
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
        const step = parseInt(e.key);
        if (step >= 1 && step <= 5) {
          goToEtape(step);
        }
        break;
    }
  });
}

// Initialisation du scroll fluide
function initSmoothScroll() {
  // Liens d'ancre dans la page
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
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

// Démarrer l'auto-play
function startAutoPlay() {
  // Arrêter l'auto-play existant
  if (autoPlayInterval) {
    clearInterval(autoPlayInterval);
  }
  
  // Démarrer un nouvel auto-play
  autoPlayInterval = setInterval(() => {
    if (currentEtape < etapesData.length) {
      goToEtape(currentEtape + 1);
    } else {
      goToEtape(1);
    }
  }, 8000); // Change toutes les 8 secondes
  
  // Arrêter l'auto-play quand l'utilisateur interagit
  document.addEventListener('mouseenter', stopAutoPlay);
  document.addEventListener('touchstart', stopAutoPlay);
  document.addEventListener('focus', stopAutoPlay);
}

// Arrêter l'auto-play
function stopAutoPlay() {
  if (autoPlayInterval) {
    clearInterval(autoPlayInterval);
    autoPlayInterval = null;
  }
}

// Reprendre l'auto-play
function resumeAutoPlay() {
  if (!autoPlayInterval) {
    startAutoPlay();
  }
}

// Notification
function showNotification(message, type = 'success') {
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
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  // Supprimer après 5 secondes
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

// Styles CSS pour les animations (modifié pour éviter les conflits)
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
  
  @keyframes highlightPulse {
    0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
    70% { box-shadow: 0 0 0 20px rgba(245, 158, 11, 0); }
    100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
  }
  
  .highlight-animation {
    animation: highlightPulse 2s ease-out;
  }
  
  .timeline-dot.active .dot-inner {
    animation: pulse 2s infinite;
  }
  
  .etape-card {
    scroll-margin-top: 100px;
  }
  
  @keyframes pulse {
    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(30, 64, 175, 0.7); }
    70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(30, 64, 175, 0); }
    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(30, 64, 175, 0); }
  }
  
  /* Styles pour les liens actifs dans la navigation */
  .nav-links a.active {
    color: var(--primary);
    font-weight: 600;
  }
  
  .nav-links a.active::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--primary);
    border-radius: var(--radius-full);
  }
  
  /* Animation pour les icônes d'étapes */
  .etape-icon {
    transition: all 0.3s ease;
  }
  
  .etape-card:hover .etape-icon {
    transform: rotate(10deg) scale(1.1);
  }
  
  /* Styles responsifs supplémentaires */
  @media (max-width: 768px) {
    .timeline-dots {
      flex-wrap: wrap;
      justify-content: center;
      gap: var(--space-4);
    }
    
    .timeline-dot {
      flex: 0 0 auto;
    }
    
    .etape-header {
      text-align: center;
    }
  }
  
  /* Styles pour le scroll smooth */
  html {
    scroll-behavior: smooth;
  }
`;
document.head.appendChild(style);

// Intersection Observer pour détecter les étapes visibles
const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.3
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const etapeId = parseInt(entry.target.id.split('-')[1]);
      if (!isNaN(etapeId) && etapeId !== currentEtape) {
        goToEtape(etapeId);
      }
    }
  });
}, observerOptions);

// Observer chaque étape
etapesData.forEach(etape => {
  const element = document.getElementById(`etape-${etape.id}`);
  if (element) {
    observer.observe(element);
  }
});