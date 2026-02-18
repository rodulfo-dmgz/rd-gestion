/**
 * PAGE CONFIDENTIALITÉ - L'Échoppe Gauloise
 * Gestion des interactions et animations pour la Politique de Confidentialité
 */

(function() {
  'use strict';

  // ============================================
  // INITIALISATION
  // ============================================
  function initPage() {
    console.log('🔒 Initialisation de la page Politique de Confidentialité');
    
    try {
      // Initialiser Lucide icons
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
      
      // Initialiser le scroll fluide pour les ancres
      initSmoothScroll();
      
      // Mettre en surbrillance le sommaire au scroll
      initTocHighlight();
      
      // Gestionnaire pour le lien "Gérer mes cookies"
      initCookiePreferences();
      
      // Initialiser Google Translate
      initGoogleTranslate();
      
      // Mettre à jour le badge panier
      updateCartBadge();
      
      console.log('✅ Page Confidentialité initialisée');
      
    } catch (error) {
      console.error('❌ Erreur d\'initialisation:', error);
    }
  }

  // ============================================
  // SCROLL FLUIDE
  // ============================================
  function initSmoothScroll() {
    const tocLinks = document.querySelectorAll('.toc-list a, .footer-legal a[href="#"]');
    
    tocLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        
        if (href && href.startsWith('#') && href.length > 1) {
          e.preventDefault();
          
          const targetId = href.substring(1);
          const targetElement = document.getElementById(targetId);
          
          if (targetElement) {
            const headerHeight = document.getElementById('header')?.offsetHeight || 80;
            const tocHeight = document.querySelector('.privacy-toc')?.offsetHeight || 0;
            const offset = headerHeight + tocHeight + 20;
            
            window.scrollTo({
              top: targetElement.offsetTop - offset,
              behavior: 'smooth'
            });
            
            // Mettre à jour l'URL
            history.pushState(null, null, href);
          }
        }
      });
    });
  }

  // ============================================
  // SURBRILLANCE DU SOMMAIRE
  // ============================================
  function initTocHighlight() {
    const sections = document.querySelectorAll('.privacy-section');
    const tocLinks = document.querySelectorAll('.toc-list a');
    
    if (sections.length === 0 || tocLinks.length === 0) return;
    
    window.addEventListener('scroll', throttle(function() {
      let current = '';
      const scrollPosition = window.scrollY + 150;
      
      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionBottom = sectionTop + section.offsetHeight;
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
          current = section.getAttribute('id');
        }
      });
      
      tocLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href && href.substring(1) === current) {
          link.classList.add('active');
        }
      });
    }, 100));
  }

  // ============================================
  // GESTION DES PRÉFÉRENCES COOKIES 
  // ============================================
  function initCookiePreferences() {
    const cookieLink = document.getElementById('openCookiePreferences');
    
    if (cookieLink) {
      cookieLink.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Simuler l'ouverture d'un gestionnaire de cookies
        // Dans un vrai projet, on ouvrirait un modal ou on redirigerait
        alert('🔧 Fonctionnalité de gestion des cookies .\n\nDans un vrai site, vous pourriez paramétrer vos préférences ici.');
      });
    }
  }

  // ============================================
  // BADGE PANIER
  // ============================================
  function updateCartBadge() {
    const cartBadge = document.getElementById('cartBadge');
    if (cartBadge) {
      try {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const itemCount = cart.reduce((total, item) => total + (item.quantity || 1), 0);
        cartBadge.textContent = itemCount;
        cartBadge.style.display = itemCount > 0 ? 'flex' : 'none';
      } catch (e) {
        console.warn('Erreur badge panier', e);
      }
    }
  }

  // ============================================
  // UTILITAIRES
  // ============================================
  function throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = setTimeout(() => inThrottle = false, limit);
      }
    };
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
    document.addEventListener('DOMContentLoaded', function() {
      initPage();
    });
  } else {
    initPage();
  }

  // Écouter les mises à jour du panier
  window.addEventListener('cart-updated', updateCartBadge);

  // Exposer globalement
  window.PrivacyPage = {
    init: initPage,
    updateCartBadge
  };

  console.log(`
    ╔════════════════════════════════════════════════════════════════════════════════════╗
    ║                                                                                    ║
    ║                    🔒 POLITIQUE DE CONFIDENTIALITÉ - L'Échoppe Gauloise 🔒        ║
    ║                                                                                    ║
    ║               Document pédagogique créé par Rodulfo DOMINGUEZ                      ║ 
    ║                                                                                    ║
    ╚════════════════════════════════════════════════════════════════════════════════════╝
  `);

})();