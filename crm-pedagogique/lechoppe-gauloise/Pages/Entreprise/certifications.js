/**
 * PAGE CERTIFICATIONS - Gestion des filtres, recherche et modals
 * L'Échoppe Gauloise
 */

// Données des certifications
const certificationsData = [
  {
    id: 1,
    nom: "ISO 22000",
    code: "ISO22000-2024-001",
    description: "Système de management de la sécurité des aliments. Certification internationale pour la chaîne alimentaire.",
    categorie: "qualite",
    icon: "award",
    validite: "2024-2027",
    organisme: "AFNOR",
    pays: ["Tous"],
    couleur: "#3B82F6"
  },
  {
    id: 2,
    nom: "HACCP",
    code: "HACCP-FR-2024",
    description: "Analyse des dangers et points critiques pour leur maîtrise. Méthode préventive de sécurité alimentaire.",
    categorie: "securite",
    icon: "shield",
    validite: "Permanente",
    organisme: "SGS",
    pays: ["UE", "CH", "GB"],
    couleur: "#10B981"
  },
  {
    id: 3,
    nom: "Certification HALAL",
    code: "HALAL-EU-024",
    description: "Certification pour les marchés musulmans selon les normes internationales HALAL.",
    categorie: "religieuse",
    icon: "star",
    validite: "2024-2025",
    organisme: "Halal France",
    pays: ["AE", "SA", "QA", "BH"],
    couleur: "#8B5CF6"
  },
  {
    id: 4,
    nom: "FDA Registration",
    code: "FDA-REG-938472",
    description: "Enregistrement FDA pour l'exportation vers les États-Unis. Conformité avec les normes américaines.",
    categorie: "regionale",
    icon: "globe",
    validite: "Annuel",
    organisme: "FDA",
    pays: ["US"],
    couleur: "#EF4444"
  },
  {
    id: 5,
    nom: "IFS Food",
    code: "IFS-8.0-4572",
    description: "Standard international pour l'audit des fournisseurs de produits alimentaires.",
    categorie: "qualite",
    icon: "check-circle",
    validite: "2024-2026",
    organisme: "IFS",
    pays: ["UE", "CH"],
    couleur: "#3B82F6"
  },
  {
    id: 6,
    nom: "BRCGS Food Safety",
    code: "BRCGS-AA-7890",
    description: "Standard mondial pour la sécurité alimentaire de la British Retail Consortium.",
    categorie: "securite",
    icon: "shield-check",
    validite: "2024-2027",
    organisme: "BRCGS",
    pays: ["GB", "AU", "US"],
    couleur: "#10B981"
  },
  {
    id: 7,
    nom: "Certification USDA Organic",
    code: "USDA-ORG-5623",
    description: "Certification biologique du département américain de l'agriculture.",
    categorie: "regionale",
    icon: "leaf",
    validite: "Annuel",
    organisme: "USDA",
    pays: ["US", "CA"],
    couleur: "#EF4444"
  },
  {
    id: 8,
    nom: "Kosher Certification",
    code: "KOSHER-2024-89",
    description: "Certification pour les marchés juifs selon les lois alimentaires juives.",
    categorie: "religieuse",
    icon: "heart",
    validite: "2024-2025",
    organisme: "OU Kosher",
    pays: ["IL", "US", "FR"],
    couleur: "#8B5CF6"
  },
  {
    id: 9,
    nom: "FSSC 22000",
    code: "FSSC-22000-345",
    description: "Système de certification pour la sécurité alimentaire basé sur ISO 22000.",
    categorie: "qualite",
    icon: "award",
    validite: "2024-2027",
    organisme: "FSSC",
    pays: ["Tous"],
    couleur: "#3B82F6"
  },
  {
    id: 10,
    nom: "China GB Standards",
    code: "GB-27887-2024",
    description: "Conformité avec les normes nationales chinoises pour l'importation.",
    categorie: "regionale",
    icon: "flag",
    validite: "2024-2026",
    organisme: "CNCA",
    pays: ["CN"],
    couleur: "#EF4444"
  },
  {
    id: 11,
    nom: "JAS Organic",
    code: "JAS-ORG-2024",
    description: "Certification biologique japonaise pour l'exportation vers le Japon.",
    categorie: "regionale",
    icon: "sun",
    validite: "Annuel",
    organisme: "MAFF",
    pays: ["JP"],
    couleur: "#EF4444"
  },
  {
    id: 12,
    nom: "SQF (Safe Quality Food)",
    code: "SQF-9.0-7890",
    description: "Programme de certification reconnu mondialement pour la sécurité et la qualité alimentaires.",
    categorie: "securite",
    icon: "shield",
    validite: "2024-2027",
    organisme: "SQFI",
    pays: ["US", "CA", "AU"],
    couleur: "#10B981"
  }
];

// Données des pays
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
  { code: "SA", name: "Arabie Saoudite" },
  { code: "CN", name: "Chine" },
  { code: "IL", name: "Israël" },
  { code: "QA", name: "Qatar" },
  { code: "BH", name: "Bahreïn" }
];

// Variables globales
let currentFilter = 'all';
let currentSearch = '';
let selectedCertification = null;

// DOM Elements
const certificationsGrid = document.getElementById('certificationsGrid');
const filterBtns = document.querySelectorAll('.filter-btn');
const certificationSearch = document.getElementById('certificationSearch');
const noResults = document.getElementById('noResults');
const resetFiltersBtn = document.getElementById('resetFilters');
const contactExpertBtn = document.getElementById('contactExpertBtn');
const verifierCertificationBtn = document.getElementById('verifierCertification');
const verificationModal = document.getElementById('verificationModal');
const modalClose = document.getElementById('modalClose');
const faqQuestions = document.querySelectorAll('.faq-question');
const verificationPaysSelect = document.getElementById('verification-pays');
const downloadBtns = document.querySelectorAll('.download-btn');
const verificationForm = document.getElementById('verificationForm');

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  initCertifications();
  initFilters();
  initSearch();
  initModal();
  initFAQ();
  initDownloads();
  updateCartBadge();
  
  // Initialiser les icônes Lucide
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
});

// Initialisation des certifications
function initCertifications() {
  if (!certificationsGrid) return;
  
  // Remplir la grille avec toutes les certifications
  renderCertifications(certificationsData);
  
  // Remplir le select des pays dans la modal
  if (verificationPaysSelect) {
    const selectOptions = paysData.map(pays => 
      `<option value="${pays.code}">${pays.name}</option>`
    ).join('');
    
    verificationPaysSelect.innerHTML = '<option value="">Sélectionnez un pays</option>' + selectOptions;
  }
}

// Rendre les certifications dans la grille
function renderCertifications(certifications) {
  certificationsGrid.innerHTML = certifications.map(cert => createCertificationCard(cert)).join('');
  
  // Afficher/masquer le message "aucun résultat"
  if (certifications.length === 0) {
    noResults.style.display = 'block';
    certificationsGrid.style.display = 'none';
  } else {
    noResults.style.display = 'none';
    certificationsGrid.style.display = 'grid';
  }
}

// Créer une carte de certification
function createCertificationCard(cert) {
  const categorieLabels = {
    'qualite': 'Qualité',
    'securite': 'Sécurité',
    'religieuse': 'Religieuse',
    'regionale': 'Régionale'
  };
  
  return `
    <div class="certification-card" data-category="${cert.categorie}" data-id="${cert.id}">
      <div class="certification-header">
        <span class="certification-badge ${cert.categorie}">${categorieLabels[cert.categorie]}</span>
        <div class="certification-icon">
          <i data-lucide="${cert.icon}" size="24"></i>
        </div>
        <h3>${cert.nom}</h3>
        <div class="certification-code">${cert.code}</div>
      </div>
      <div class="certification-body">
        <p class="certification-description">${cert.description}</p>
        
        <div class="certification-details">
          <div class="certification-detail">
            <strong>Validité</strong>
            <span>${cert.validite}</span>
          </div>
          <div class="certification-detail">
            <strong>Organisme</strong>
            <span>${cert.organisme}</span>
          </div>
        </div>
        
        <div class="certification-actions">
          <button class="btn btn-secondary" onclick="viewCertification(${cert.id})">
            <i data-lucide="eye" size="16"></i>
            Détails
          </button>
          <button class="btn" onclick="downloadCertification(${cert.id})">
            <i data-lucide="download" size="16"></i>
            PDF
          </button>
        </div>
      </div>
    </div>
  `;
}

// Initialisation des filtres
function initFilters() {
  filterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      // Retirer la classe active de tous les boutons
      filterBtns.forEach(b => b.classList.remove('active'));
      // Ajouter la classe active au bouton cliqué
      this.classList.add('active');
      
      // Mettre à jour le filtre courant
      currentFilter = this.dataset.filter;
      
      // Appliquer les filtres
      applyFilters();
    });
  });
  
  // Bouton de réinitialisation
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', resetFilters);
  }
}

// Initialisation de la recherche
function initSearch() {
  if (!certificationSearch) return;
  
  certificationSearch.addEventListener('input', function() {
    currentSearch = this.value.toLowerCase().trim();
    applyFilters();
  });
}

// Appliquer les filtres et la recherche
function applyFilters() {
  let filtered = certificationsData;
  
  // Appliquer le filtre de catégorie
  if (currentFilter !== 'all') {
    filtered = filtered.filter(cert => cert.categorie === currentFilter);
  }
  
  // Appliquer la recherche
  if (currentSearch) {
    filtered = filtered.filter(cert => 
      cert.nom.toLowerCase().includes(currentSearch) ||
      cert.description.toLowerCase().includes(currentSearch) ||
      cert.code.toLowerCase().includes(currentSearch)
    );
  }
  
  // Rendre les certifications filtrées
  renderCertifications(filtered);
  
  // Recréer les icônes Lucide
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Réinitialiser les filtres
function resetFilters() {
  // Réinitialiser les boutons de filtre
  filterBtns.forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.filter === 'all') {
      btn.classList.add('active');
    }
  });
  
  // Réinitialiser la recherche
  if (certificationSearch) {
    certificationSearch.value = '';
  }
  
  // Réinitialiser les variables
  currentFilter = 'all';
  currentSearch = '';
  
  // Rendre toutes les certifications
  renderCertifications(certificationsData);
  
  // Recréer les icônes Lucide
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Initialisation de la modal
function initModal() {
  // Bouton "Vérifier une certification" (hero)
  if (contactExpertBtn) {
    contactExpertBtn.addEventListener('click', openVerificationModal);
  }
  
  // Bouton "Vérifier une certification" (CTA)
  if (verifierCertificationBtn) {
    verifierCertificationBtn.addEventListener('click', openVerificationModal);
  }
  
  // Fermer la modal
  if (modalClose) {
    modalClose.addEventListener('click', closeVerificationModal);
  }
  
  // Fermer en cliquant en dehors
  if (verificationModal) {
    verificationModal.addEventListener('click', (e) => {
      if (e.target === verificationModal) {
        closeVerificationModal();
      }
    });
  }
  
  // Fermer avec la touche ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && verificationModal && verificationModal.classList.contains('active')) {
      closeVerificationModal();
    }
  });
  
  // Gestion du formulaire de vérification
  if (verificationForm) {
    verificationForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      if (validateVerificationForm(this)) {
        submitVerificationForm(this);
      }
    });
  }
}

// Ouvrir la modal de vérification
function openVerificationModal() {
  if (verificationModal) {
    verificationModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

// Fermer la modal de vérification
function closeVerificationModal() {
  if (verificationModal) {
    verificationModal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Validation du formulaire de vérification
function validateVerificationForm(form) {
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
  
  return isValid;
}

// Validation d'email
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
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

// Soumission du formulaire de vérification
function submitVerificationForm(form) {
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  
  // Simulation d'envoi
  console.log('Formulaire vérification soumis:', data);
  
  // Afficher une notification
  showNotification(`Votre demande de vérification pour "${data['verification-certification']}" a été envoyée. Nous vous répondrons sous 24h.`);
  
  // Fermer la modal
  closeVerificationModal();
  
  // Réinitialiser le formulaire
  form.reset();
  
  // Sauvegarder dans localStorage (simulation)
  saveVerificationRequest(data);
}

// Sauvegarder une demande de vérification
function saveVerificationRequest(data) {
  let requests = JSON.parse(localStorage.getItem('verificationRequests')) || [];
  requests.push({
    ...data,
    date: new Date().toISOString(),
    status: 'pending'
  });
  localStorage.setItem('verificationRequests', JSON.stringify(requests));
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

// Initialisation des téléchargements
function initDownloads() {
  downloadBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const certType = this.dataset.cert;
      downloadCertificate(certType);
    });
  });
}

// Télécharger un certificat
function downloadCertificate(certType) {
  // Simulation de téléchargement
  console.log(`Téléchargement du certificat: ${certType}`);
  
  // Afficher une notification
  let message = '';
  switch(certType) {
    case 'iso':
      message = 'Le certificat ISO 22000 est en cours de téléchargement...';
      break;
    case 'haccp':
      message = 'Le certificat HACCP est en cours de téléchargement...';
      break;
    case 'halal':
      message = 'Le certificat HALAL est en cours de téléchargement...';
      break;
    case 'all':
      message = 'Le dossier complet des certifications est en cours de téléchargement...';
      break;
    default:
      message = 'Le document est en cours de téléchargement...';
  }
  
  showNotification(message);
  
  // Simuler un délai de téléchargement
  setTimeout(() => {
    showNotification('Téléchargement terminé ! Vérifiez votre dossier de téléchargements.', 'success');
  }, 1500);
}

// Voir les détails d'une certification
function viewCertification(id) {
  const cert = certificationsData.find(c => c.id === id);
  if (cert) {
    // Ouvrir la modal avec les détails
    openVerificationModal();
    
    // Pré-remplir le formulaire
    const certificationSelect = document.getElementById('verification-certification');
    if (certificationSelect) {
      certificationSelect.value = cert.nom.toLowerCase().includes('iso') ? 'iso' :
                                 cert.nom.toLowerCase().includes('haccp') ? 'haccp' :
                                 cert.nom.toLowerCase().includes('halal') ? 'halal' : 'autre';
    }
    
    // Afficher un message
    showNotification(`Détails de "${cert.nom}" chargés. Remplissez le formulaire pour plus d'informations.`);
  }
}

// Télécharger une certification spécifique
function downloadCertification(id) {
  const cert = certificationsData.find(c => c.id === id);
  if (cert) {
    downloadCertificate(cert.nom.toLowerCase().includes('iso') ? 'iso' :
                       cert.nom.toLowerCase().includes('haccp') ? 'haccp' :
                       cert.nom.toLowerCase().includes('halal') ? 'halal' : 'all');
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
function showNotification(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast-notification ${type}`;
  toast.innerHTML = `
    <i data-lucide="${type === 'success' ? 'check-circle' : 'info'}" size="20"></i>
    <span>${message}</span>
  `;
  
  // Styles pour la notification
  toast.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'};
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
  
  @keyframes cardHighlight {
    0% { transform: translateY(-4px) scale(1); box-shadow: var(--shadow-xl); }
    50% { transform: translateY(-4px) scale(1.02); box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
    100% { transform: translateY(-4px) scale(1); box-shadow: var(--shadow-xl); }
  }
  
  .certification-card:hover {
    animation: cardHighlight 2s infinite;
  }
  
  /* Styles pour les filtres actifs */
  .filter-btn.active {
    position: relative;
  }
  
  .filter-btn.active::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 3px;
    background: var(--primary);
    border-radius: var(--radius-full);
  }
  
  /* Animation pour les badges d'état */
  .certification-badge {
    animation: fadeIn 0.5s ease-out;
  }
  
  /* Styles pour le scroll smooth */
  html {
    scroll-behavior: smooth;
  }
  
  /* Styles pour la modal */
  .modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(8px);
    z-index: 1000;
    align-items: center;
    justify-content: center;
    padding: var(--space-6);
  }
  
  .modal.active {
    display: flex;
    animation: fadeIn 0.3s ease-out;
  }
  
  .modal-content {
    background: white;
    border-radius: var(--radius-xl);
    max-width: 500px;
    width: 100%;
    position: relative;
    animation: scaleIn 0.3s ease-out;
  }
  
  .modal-close {
    position: absolute;
    top: var(--space-4);
    right: var(--space-4);
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-tertiary);
    border-radius: var(--radius-full);
    color: var(--text-primary);
    transition: all var(--transition-fast);
    z-index: 10;
  }
  
  .modal-close:hover {
    background: var(--primary);
    color: white;
  }
  
  .modal-header {
    padding: var(--space-12) var(--space-8) var(--space-8);
    text-align: center;
    background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%);
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  }
  
  .modal-header i {
    color: #059669;
    margin-bottom: var(--space-4);
  }
  
  .modal-header h3 {
    font-size: var(--text-2xl);
    margin-bottom: var(--space-2);
  }
  
  .modal-header p {
    color: var(--text-secondary);
    margin: 0;
  }
  
  .modal-body {
    padding: var(--space-8);
  }
  
  @keyframes scaleIn {
    from { transform: scale(0.9); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
`;
document.head.appendChild(style);