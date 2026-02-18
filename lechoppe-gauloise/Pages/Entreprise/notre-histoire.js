/**
 * NOTRE HISTOIRE - Timeline interactive et modal
 * L'Échoppe Gauloise
 */

// Données de la timeline
const timelineData = [
  {
    year: "1995",
    title: "La Fondation",
    description: "Pierre et Élise ouvrent leur première boutique à Colmar, spécialisée dans les produits artisanaux alsaciens.",
    badge: "Début",
    icon: "store"
  },
  {
    year: "1998",
    title: "Première Brasserie",
    description: "Création de notre première bière artisanale, la \"Blonde Alsacienne\", qui remporte un prix régional.",
    badge: "Innovation",
    icon: "beer"
  },
  {
    year: "2002",
    title: "Premier Export",
    description: "Première exportation vers la Belgique. Début de notre aventure internationale.",
    badge: "International",
    icon: "globe"
  },
  {
    year: "2005",
    title: "Certification Biologique",
    description: "Obtention de la certification ECOCERT pour l'ensemble de notre gamme bière et vin.",
    badge: "Écologie",
    icon: "leaf"
  },
  {
    year: "2010",
    title: "Ouverture de l'Entrepôt",
    description: "Inauguration de notre centre logistique moderne de 5000m² près de Strasbourg.",
    badge: "Croissance",
    icon: "warehouse"
  },
  {
    year: "2015",
    title: "20 Ans d'Expertise",
    description: "Célébration de nos 20 ans avec l'obtention du label \"Entreprise du Patrimoine Vivant\".",
    badge: "Anniversaire",
    icon: "award"
  },
  {
    year: "2018",
    title: "Expansion Majeure",
    description: "Ouverture de 5 nouveaux marchés internationaux dont le Japon et les États-Unis.",
    badge: "Expansion",
    icon: "map-pinned"
  },
  {
    year: "2022",
    title: "Innovation Digitale",
    description: "Lancement de notre plateforme e-commerce et application mobile dédiée.",
    badge: "Digital",
    icon: "smartphone"
  },
  {
    year: "2024",
    title: "Nouvelle Génération",
    description: "Arrivée de la nouvelle génération dans la direction avec des projets innovants.",
    badge: "Renouveau",
    icon: "users"
  },
  {
    year: "2025",
    title: "Vision 2030",
    description: "Lancement de notre stratégie développement durable et objectif 25 pays d'export.",
    badge: "Futur",
    icon: "target"
  }
];

// Variables globales
let currentTimelineIndex = 0;
const timelineItemsPerView = 3;

// DOM Elements
const timeline = document.getElementById('timeline');
const rejoindreBtn = document.getElementById('rejoindreBtn');
const rejoindreModal = document.getElementById('rejoindreModal');
const modalClose = document.getElementById('modalClose');

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  initTimeline();
  initModal();
  setupObservers();
  updateCartBadge();
});

// Initialisation de la timeline
function initTimeline() {
  if (!timeline) return;
  
  timeline.innerHTML = timelineData.map((item, index) => createTimelineItem(item, index)).join('');
  
  // Ajouter les écouteurs d'événements pour les dots
  const dots = document.querySelectorAll('.timeline-dot');
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => scrollToTimelineItem(index));
  });
  
  // Rendre visible les premiers items
  setTimeout(() => {
    const items = document.querySelectorAll('.timeline-item');
    items.forEach((item, index) => {
      setTimeout(() => {
        item.classList.add('visible');
      }, index * 200);
    });
  }, 500);
}

// Création d'un élément de timeline
function createTimelineItem(item, index) {
  return `
    <div class="timeline-item" data-index="${index}">
      <span class="timeline-year">${item.year}</span>
      <div class="timeline-dot" data-index="${index}"></div>
      <div class="timeline-content">
        <span class="timeline-badge">${item.badge}</span>
        <h3>${item.title}</h3>
        <p>${item.description}</p>
        <div class="timeline-icon">
          <i data-lucide="${item.icon}" size="20"></i>
        </div>
      </div>
    </div>
  `;
}

// Scroll vers un élément spécifique de la timeline
function scrollToTimelineItem(index) {
  const items = document.querySelectorAll('.timeline-item');
  if (items[index]) {
    items[index].scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
    
    // Animation de pulse sur le dot
    const dot = document.querySelector(`.timeline-dot[data-index="${index}"]`);
    dot.style.transform = 'translateX(-50%) scale(1.3)';
    dot.style.boxShadow = '0 0 0 12px rgba(245, 158, 11, 0.3)';
    
    setTimeout(() => {
      dot.style.transform = 'translateX(-50%) scale(1)';
      dot.style.boxShadow = '0 0 0 4px rgba(245, 158, 11, 0.2)';
    }, 500);
  }
}

// Initialisation de la modal
function initModal() {
  if (!rejoindreBtn || !rejoindreModal || !modalClose) return;
  
  rejoindreBtn.addEventListener('click', () => {
    rejoindreModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  });
  
  modalClose.addEventListener('click', () => {
    rejoindreModal.classList.remove('active');
    document.body.style.overflow = '';
  });
  
  // Fermer la modal en cliquant en dehors
  rejoindreModal.addEventListener('click', (e) => {
    if (e.target === rejoindreModal) {
      rejoindreModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
  
  // Fermer avec la touche ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && rejoindreModal.classList.contains('active')) {
      rejoindreModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}

// Configuration des observers pour les animations
function setupObservers() {
  // Observer pour la timeline
  const timelineObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, {
    threshold: 0.2,
    rootMargin: '0px 0px -50px 0px'
  });
  
  // Observer pour les cartes valeurs
  const valeursObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, index * 100);
      }
    });
  }, {
    threshold: 0.1
  });
  
  // Observer pour l'équipe
  const equipeObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, index * 150);
      }
    });
  }, {
    threshold: 0.1
  });
  
  // Appliquer les observers
  document.querySelectorAll('.timeline-item').forEach(item => {
    timelineObserver.observe(item);
  });
  
  document.querySelectorAll('.valeur-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'all 0.6s ease-out';
    valeursObserver.observe(card);
  });
  
  document.querySelectorAll('.membre-equipe').forEach(membre => {
    membre.style.opacity = '0';
    membre.style.transform = 'translateY(20px)';
    membre.style.transition = 'all 0.6s ease-out';
    equipeObserver.observe(membre);
  });
}

// Gestion du formulaire newsletter
document.addEventListener('DOMContentLoaded', () => {
  const newsletterForm = document.getElementById('newsletterForm');
  
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const email = this.querySelector('input[type="email"]').value;
      
      if (validateEmail(email)) {
        // Simuler l'envoi
        showNotification('Merci pour votre inscription à notre newsletter !');
        this.reset();
        
        // Sauvegarder dans localStorage
        saveNewsletterSubscription(email);
      } else {
        showNotification('Veuillez entrer une adresse email valide.', 'error');
      }
    });
  }
});

// Validation email
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Sauvegarder l'inscription newsletter
function saveNewsletterSubscription(email) {
  let subscriptions = JSON.parse(localStorage.getItem('newsletterSubscriptions')) || [];
  
  if (!subscriptions.includes(email)) {
    subscriptions.push(email);
    localStorage.setItem('newsletterSubscriptions', JSON.stringify(subscriptions));
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

// Animation de défilement de la timeline
function initTimelineScroll() {
  const timelineContainer = document.querySelector('.timeline-section');
  
  if (timelineContainer) {
    let isScrolling = false;
    
    timelineContainer.addEventListener('wheel', (e) => {
      if (isScrolling) return;
      
      e.preventDefault();
      isScrolling = true;
      
      const direction = e.deltaY > 0 ? 1 : -1;
      const items = document.querySelectorAll('.timeline-item');
      const visibleItems = Array.from(items).filter(item => {
        const rect = item.getBoundingClientRect();
        return rect.top >= 0 && rect.bottom <= window.innerHeight;
      });
      
      if (direction > 0 && currentTimelineIndex < timelineData.length - timelineItemsPerView) {
        currentTimelineIndex++;
      } else if (direction < 0 && currentTimelineIndex > 0) {
        currentTimelineIndex--;
      }
      
      scrollToTimelineItem(currentTimelineIndex);
      
      setTimeout(() => {
        isScrolling = false;
      }, 500);
    });
  }
}

// Initialiser le défilement de la timeline
initTimelineScroll();

document.head.appendChild(style);