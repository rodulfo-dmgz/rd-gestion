/**
 * PAGE CARRIÈRES - L'Échoppe Gauloise
 * Gestion des offres d'emploi et des candidatures
 */

(function() {
  'use strict';

  // ============================================
  // CONFIGURATION
  // ============================================
  const JOBS_DATA = [
    {
      id: 1,
      title: "Assistant(e) Export",
      department: "commerce",
      type: "CDI",
      location: "Paris",
      salary: "35-40K€",
      description: "Assister l'équipe export dans le développement de nos marchés internationaux. Gestion des commandes et relation client à l'international.",
      requirements: ["Bac+3 Commerce International", "Anglais courant", "Expérience 2 ans"],
      badge: "new",
      date: "2024-01-15",
      urgent: false
    },
    {
      id: 2,
      title: "Maître Brasseur",
      department: "production",
      type: "CDI",
      location: "Lille",
      salary: "45-55K€",
      description: "Superviser la production de nos bières artisanales. Développement de nouvelles recettes et contrôle qualité.",
      requirements: ["Diplôme de brasseur", "Expérience 5 ans", "Connaissances HACCP"],
      badge: "urgent",
      date: "2023-12-10",
      urgent: true
    },
    {
      id: 3,
      title: "Chargé(e) de Marketing Digital",
      department: "commerce",
      type: "CDI",
      location: "Paris",
      salary: "38-45K€",
      description: "Développer notre présence digitale en France et à l'international. Gestion des campagnes et analyse des performances.",
      requirements: ["Bac+5 Marketing", "Expérience 3 ans", "Anglais B2"],
      badge: "",
      date: "2024-01-05",
      urgent: false
    },
    {
      id: 4,
      title: "Logisticien(ne) Export",
      department: "logistique",
      type: "CDI",
      location: "Lyon",
      salary: "32-38K€",
      description: "Gérer les flux logistiques vers nos 15 pays d'export. Optimisation des coûts et des délais de livraison.",
      requirements: ["Bac+2 Logistique", "Connaissances douanières", "Anglais B1"],
      badge: "new",
      date: "2024-01-18",
      urgent: false
    },
    {
      id: 5,
      title: "Comptable",
      department: "administratif",
      type: "CDI",
      location: "Paris",
      salary: "35-42K€",
      description: "Gestion comptable complète de l'entreprise. Suivi des opérations export et déclarations TVA intracommunautaire.",
      requirements: ["Bac+3 Comptabilité", "Expérience 3 ans", "Logiciels de gestion"],
      badge: "",
      date: "2023-12-20",
      urgent: false
    },
    {
      id: 6,
      title: "Oenologue",
      department: "production",
      type: "CDI",
      location: "Bordeaux",
      salary: "40-50K€",
      description: "Sélection et contrôle qualité de nos vins. Accompagnement des partenaires viticulteurs et développement des assemblages.",
      requirements: ["Diplôme d'oenologie", "Expérience 4 ans", "Palais développé"],
      badge: "new",
      date: "2024-01-10",
      urgent: false
    },
    {
      id: 7,
      title: "Commercial Export",
      department: "commerce",
      type: "CDI",
      location: "Télétravail",
      salary: "45-55K€ + variable",
      description: "Développement de nouveaux marchés à l'international. Participation aux salons professionnels et négociation avec les distributeurs.",
      requirements: ["Bac+5 Commerce", "Anglais courant + 2ème langue", "Expérience 5 ans"],
      badge: "urgent",
      date: "2023-12-05",
      urgent: true
    },
    {
      id: 8,
      title: "Assistant(e) RH",
      department: "administratif",
      type: "CDI",
      location: "Paris",
      salary: "30-36K€",
      description: "Support au service RH dans le recrutement, la formation et la gestion administrative du personnel.",
      requirements: ["Bac+3 RH", "Maitrise Pack Office", "Sens relationnel"],
      badge: "",
      date: "2024-01-08",
      urgent: false
    }
  ];

  // ============================================
  // ÉTAT GLOBAL
  // ============================================
  let currentFilter = 'all';
  let applications = JSON.parse(localStorage.getItem('career_applications')) || [];

  // ============================================
  // INITIALISATION DE LA PAGE
  // ============================================
  function initPage() {
    console.log('🎯 Initialisation de la page Carrières');
    
    try {
      // Initialiser Lucide icons
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
      
      // Charger et afficher les offres d'emploi
      loadAndDisplayJobs();
      
      // Initialiser les écouteurs d'événements
      initEventListeners();
      
      // Initialiser Google Translate
      initGoogleTranslate();
      
      // Mettre à jour le compteur d'offres
      updateJobsCount();
      
      console.log('✅ Page Carrières initialisée avec', JOBS_DATA.length, 'offres');
      
    } catch (error) {
      console.error('❌ Erreur d\'initialisation:', error);
      showNotification('Erreur lors du chargement des offres', 'error');
    }
  }

  // ============================================
  // CHARGEMENT ET AFFICHAGE DES OFFRES
  // ============================================
  function loadAndDisplayJobs() {
    const grid = document.getElementById('jobsGrid');
    if (!grid) {
      console.error('Élément #jobsGrid non trouvé');
      return;
    }
    
    // Filtrer les offres selon le filtre actuel
    const filteredJobs = currentFilter === 'all' 
      ? JOBS_DATA 
      : JOBS_DATA.filter(job => job.department === currentFilter);
    
    // Trier par date (les plus récentes d'abord)
    const sortedJobs = [...filteredJobs].sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );
    
    // Générer le HTML des offres
    grid.innerHTML = sortedJobs.map(job => renderJobCard(job)).join('');
    
    // Recréer les icônes Lucide
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    // Mettre à jour le compteur
    updateJobsCount();
  }

  function renderJobCard(job) {
    const badgeClass = job.badge ? `job-badge ${job.badge}` : '';
    const badgeText = job.badge === 'new' ? 'Nouveau' : 'Urgent';
    const cardClass = job.badge ? `job-card ${job.badge}` : 'job-card';
    
    return `
      <article class="${cardClass}" data-job-id="${job.id}" data-department="${job.department}">
        <div class="job-header">
          <h3 class="job-title">${job.title}</h3>
          ${job.badge ? `<span class="${badgeClass}">${badgeText}</span>` : ''}
        </div>
        
        <div class="job-meta">
          <span class="job-meta-item">
            <i data-lucide="briefcase" size="16"></i>
            ${job.type}
          </span>
          <span class="job-meta-item">
            <i data-lucide="map-pin" size="16"></i>
            ${job.location}
          </span>
          <span class="job-meta-item">
            <i data-lucide="calendar" size="16"></i>
            Publié le ${formatDate(job.date)}
          </span>
        </div>
        
        <p class="job-description">${job.description}</p>
        
        <div class="job-requirements">
          <strong>Profil recherché :</strong>
          <ul>
            ${job.requirements.map(req => `<li>${req}</li>`).join('')}
          </ul>
        </div>
        
        <div class="job-footer">
          <span class="job-salary">${job.salary}</span>
          <button class="btn btn-secondary apply-btn" data-job-id="${job.id}">
            Postuler
            <i data-lucide="arrow-right" size="16"></i>
          </button>
        </div>
      </article>
    `;
  }

  // ============================================
  // GESTION DES FILTRES
  // ============================================
  function initEventListeners() {
    // Filtres par département
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', handleFilterClick);
    });
    
    // Boutons "Postuler" (délégation d'événements)
    document.addEventListener('click', function(e) {
      if (e.target.closest('.apply-btn')) {
        const btn = e.target.closest('.apply-btn');
        const jobId = parseInt(btn.dataset.jobId);
        openApplicationModal(jobId);
      }
    });
    
    // Bouton candidature spontanée
    const spontaneousBtn = document.getElementById('openSpontaneousModal');
    if (spontaneousBtn) {
      spontaneousBtn.addEventListener('click', () => openApplicationModal(null));
    }
    
    // Bouton contact modal
    const contactBtn = document.getElementById('openContactModal');
    const contactLink = document.getElementById('modalContactLink');
    if (contactBtn) contactBtn.addEventListener('click', openContactModal);
    if (contactLink) contactLink.addEventListener('click', openContactModal);
    
    // Fermeture des modals
    const closeAppModal = document.getElementById('closeApplicationModal');
    const closeContactModal = document.getElementById('closeContactModal');
    
    if (closeAppModal) closeAppModal.addEventListener('click', closeAllModals);
    if (closeContactModal) closeContactModal.addEventListener('click', closeAllModals);
    
    // Fermer modal en cliquant en dehors
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', function(e) {
        if (e.target === this) closeAllModals();
      });
    });
    
    // Formulaire de candidature
    const applicationForm = document.getElementById('applicationForm');
    if (applicationForm) {
      applicationForm.addEventListener('submit', handleApplicationSubmit);
    }
    
    // Formulaire de contact
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
      contactForm.addEventListener('submit', handleContactSubmit);
    }
    
    // Navigation fluide
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', handleSmoothScroll);
    });
    
    // Remplir le select des postes
    populatePositionSelect();
  }

  function handleFilterClick(e) {
    const filter = e.currentTarget.dataset.filter;
    
    // Mettre à jour les boutons actifs
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn === e.currentTarget);
    });
    
    // Appliquer le filtre
    currentFilter = filter;
    loadAndDisplayJobs();
    
    // Scroll vers les offres
    const jobsSection = document.getElementById('offres');
    if (jobsSection) {
      window.scrollTo({
        top: jobsSection.offsetTop - 100,
        behavior: 'smooth'
      });
    }
  }

  // ============================================
  // GESTION DES MODALS
  // ============================================
  function openApplicationModal(jobId) {
    const modal = document.getElementById('applicationModal');
    const select = document.getElementById('jobPosition');
    
    if (modal && select) {
      // Sélectionner le poste correspondant si jobId fourni
      if (jobId) {
        const job = JOBS_DATA.find(j => j.id === jobId);
        if (job) {
          select.value = job.title;
        }
      }
      
      // Afficher le modal
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      
      // Focus sur le premier champ
      setTimeout(() => {
        const firstName = document.getElementById('applicantName');
        if (firstName) firstName.focus();
      }, 100);
    }
  }

  function openContactModal(e) {
    if (e) e.preventDefault();
    
    const modal = document.getElementById('contactModal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.classList.remove('active');
    });
    document.body.style.overflow = '';
  }

  function populatePositionSelect() {
    const select = document.getElementById('jobPosition');
    if (!select) return;
    
    // Ajouter l'option "Candidature spontanée"
    const spontaneousOption = document.createElement('option');
    spontaneousOption.value = 'Candidature spontanée';
    spontaneousOption.textContent = 'Candidature spontanée';
    select.appendChild(spontaneousOption);
    
    // Ajouter toutes les offres actives
    JOBS_DATA.forEach(job => {
      const option = document.createElement('option');
      option.value = job.title;
      option.textContent = `${job.title} (${job.location})`;
      select.appendChild(option);
    });
  }

  // ============================================
  // GESTION DES FORMULAIRES
  // ============================================
  function handleApplicationSubmit(e) {
    e.preventDefault();
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    // Validation basique
    const name = formData.get('name');
    const email = formData.get('email');
    const position = formData.get('position');
    const message = formData.get('message');
    const cv = document.getElementById('applicantCV').files[0];
    
    if (!name || !email || !position || !message || !cv) {
      showNotification('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }
    
    // Vérifier la taille du CV (max 5MB)
    if (cv.size > 5 * 1024 * 1024) {
      showNotification('Le CV ne doit pas dépasser 5MB', 'error');
      return;
    }
    
    // Simuler l'envoi (dans un cas réel, on enverrait au serveur)
    const application = {
      id: Date.now(),
      name,
      email,
      position,
      message,
      cvName: cv.name,
      date: new Date().toISOString(),
      status: 'pending'
    };
    
    // Sauvegarder dans le localStorage
    applications.push(application);
    localStorage.setItem('career_applications', JSON.stringify(applications));
    
    // Réinitialiser le formulaire
    form.reset();
    
    // Fermer le modal
    closeAllModals();
    
    // Afficher confirmation
    showNotification('Votre candidature a bien été envoyée !', 'success');
    
    // Simuler l'envoi d'email
    console.log('📧 Candidature envoyée:', application);
  }

  function handleContactSubmit(e) {
    e.preventDefault();
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const name = formData.get('name');
    const email = formData.get('email');
    const subject = formData.get('subject');
    const message = formData.get('message');
    
    if (!name || !email || !subject || !message) {
      showNotification('Veuillez remplir tous les champs', 'error');
      return;
    }
    
    // Simuler l'envoi
    const contact = {
      name,
      email,
      subject,
      message,
      date: new Date().toISOString()
    };
    
    // Réinitialiser le formulaire
    form.reset();
    
    // Fermer le modal
    closeAllModals();
    
    // Afficher confirmation
    showNotification('Votre message a bien été envoyé !', 'success');
    
    // Simuler l'envoi d'email
    console.log('📧 Message RH envoyé:', contact);
  }

  // ============================================
  // UTILITAIRES
  // ============================================
  function updateJobsCount() {
    const countElement = document.getElementById('jobsCount');
    if (!countElement) return;
    
    const count = currentFilter === 'all' 
      ? JOBS_DATA.length 
      : JOBS_DATA.filter(job => job.department === currentFilter).length;
    
    countElement.textContent = count;
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  function showNotification(message, type = 'info') {
    // Supprimer les notifications existantes
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    // Créer la notification
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

  // ============================================
  // DÉMARRAGE
  // ============================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
  } else {
    initPage();
  }

  // Exposer globalement
  window.CareerPage = {
    init: initPage,
    openApplicationModal,
    openContactModal,
    showNotification
  };

  console.log(`
    ╔════════════════════════════════════════════════════════════════════════════════════╗
    ║                                                                                    ║
    ║                    👔 PAGE CARRIÈRES - L'Échoppe Gauloise 👔                     ║
    ║                                                                                    ║
    ║               Développée par Rodulfo DOMINGUEZ                                      ║ 
    ║           Découvrez nos offres et rejoignez notre équipe !                         ║
    ║                                                                                    ║
    ╚════════════════════════════════════════════════════════════════════════════════════╝
  `);

})();