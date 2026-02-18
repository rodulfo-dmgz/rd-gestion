/**
 * PAGE MENTIONS LÉGALES - L'Échoppe Gauloise
 * Gestion des interactions et animations
 */

(function() {
  'use strict';

  // ============================================
  // INITIALISATION
  // ============================================
  function initPage() {
    console.log('⚖️ Initialisation de la page Mentions Légales');
    
    try {
      // Initialiser Lucide icons (au cas où)
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
      
      // Initialiser le scroll fluide pour les ancres
      initSmoothScroll();
      
      // Gérer la mise en surbrillance du sommaire au scroll
      initTocHighlight();
      
      // Initialiser Google Translate
      initGoogleTranslate();
      
      console.log('✅ Page Mentions Légales initialisée');
      
    } catch (error) {
      console.error('❌ Erreur d\'initialisation:', error);
    }
  }

  // ============================================
  // SCROLL FLUIDE VERS LES SECTIONS
  // ============================================
  function initSmoothScroll() {
    const tocLinks = document.querySelectorAll('.toc-list a, .footer-legal a[href="#"]');
    
    tocLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        
        // Ne traiter que les ancres internes (commençant par #)
        if (href && href.startsWith('#') && href.length > 1) {
          e.preventDefault();
          
          const targetId = href.substring(1);
          const targetElement = document.getElementById(targetId);
          
          if (targetElement) {
            const headerHeight = document.getElementById('header')?.offsetHeight || 80;
            const tocHeight = document.querySelector('.legal-toc')?.offsetHeight || 0;
            const offset = headerHeight + tocHeight + 20;
            
            window.scrollTo({
              top: targetElement.offsetTop - offset,
              behavior: 'smooth'
            });
            
            // Mettre à jour l'URL sans recharger
            history.pushState(null, null, href);
          }
        }
      });
    });
  }

  // ============================================
  // SURBRILLANCE DU SOMMAIRE AU SCROLL
  // ============================================
  function initTocHighlight() {
    const sections = document.querySelectorAll('.legal-section');
    const tocLinks = document.querySelectorAll('.toc-list a');
    
    if (sections.length === 0 || tocLinks.length === 0) return;
    
    window.addEventListener('scroll', throttle(function() {
      let current = '';
      const scrollPosition = window.scrollY + 150; // offset pour déclencher plus tôt
      
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
    // Masquer les éléments Google Translate par défaut
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
  // GESTION DU BADGE PANIER (si nécessaire)
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
        console.warn('Erreur lors de la mise à jour du badge panier', e);
      }
    }
  }

  // ============================================
  // DÉMARRAGE
  // ============================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initPage();
      updateCartBadge();
    });
  } else {
    initPage();
    updateCartBadge();
  }
  
  // Écouter les mises à jour du panier
  window.addEventListener('cart-updated', updateCartBadge);

  // Exposer certaines fonctions pour débogage
  window.LegalPage = {
    init: initPage,
    updateCartBadge
  };

  console.log(`
    ╔════════════════════════════════════════════════════════════════════════════════════╗
    ║                                                                                    ║
    ║                    ⚖️ MENTIONS LÉGALES - L'Échoppe Gauloise ⚖️                   ║
    ║                                                                                    ║
    ║               Document pédagogique créé par Rodulfo DOMINGUEZ                      ║ 
    ║                                                                                    ║
    ╚════════════════════════════════════════════════════════════════════════════════════╝
  `);

})();