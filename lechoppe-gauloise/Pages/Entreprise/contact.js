/**
 * PAGE CONTACT - L'Échoppe Gauloise
 * Gestion du formulaire de contact et interactions
 */

(function() {
  'use strict';

  // ============================================
  // INITIALISATION
  // ============================================
  function initPage() {
    console.log('📬 Initialisation de la page Contact');
    
    try {
      // Initialiser Lucide icons
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
      
      // Initialiser le formulaire de contact
      initContactForm();
      
      // Initialiser Google Translate
      initGoogleTranslate();
      
      // Mettre à jour le badge panier
      updateCartBadge();
      
      console.log('✅ Page Contact initialisée');
      
    } catch (error) {
      console.error('❌ Erreur d\'initialisation:', error);
    }
  }

  // ============================================
  // FORMULAIRE DE CONTACT
  // ============================================
  function initContactForm() {
    const form = document.getElementById('contactForm');
    
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Récupération des valeurs
      const firstName = document.getElementById('firstName').value.trim();
      const lastName = document.getElementById('lastName').value.trim();
      const email = document.getElementById('email').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const subject = document.getElementById('subject').value;
      const message = document.getElementById('message').value.trim();
      const consent = document.getElementById('consent').checked;
      
      // Validation basique
      if (!firstName || !lastName || !email || !subject || !message || !consent) {
        showNotification('Veuillez remplir tous les champs obligatoires', 'error');
        return;
      }
      
      if (!isValidEmail(email)) {
        showNotification('Veuillez entrer une adresse email valide', 'error');
        return;
      }
      
      // Simuler l'envoi du formulaire
      const formData = {
        firstName,
        lastName,
        email,
        phone: phone || 'Non renseigné',
        subject,
        message,
        date: new Date().toISOString(),
        source: 'Page Contact'
      };
      
      // Sauvegarder dans localStorage (simulation)
      saveContactMessage(formData);
      
      // Réinitialiser le formulaire
      form.reset();
      
      // Notification de succès
      showNotification('Votre message a bien été envoyé. Nous vous répondrons dans les plus brefs délais.', 'success');
      
      // Log pour la simulation
      console.log('📨 Message de contact envoyé (simulation) :', formData);
    });
  }

  // ============================================
  // SAUVEGARDE LOCALE (SIMULATION)
  // ============================================
  function saveContactMessage(data) {
    try {
      // Récupérer les messages existants
      const messages = JSON.parse(localStorage.getItem('contact_messages')) || [];
      
      // Ajouter le nouveau message
      messages.push(data);
      
      // Conserver uniquement les 50 derniers messages
      if (messages.length > 50) {
        messages.shift();
      }
      
      // Sauvegarder
      localStorage.setItem('contact_messages', JSON.stringify(messages));
      
    } catch (e) {
      console.warn('Erreur lors de la sauvegarde du message', e);
    }
  }

  // ============================================
  // NOTIFICATIONS
  // ============================================
  function showNotification(message, type = 'info') {
    // Supprimer les notifications existantes
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
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
    }, 5000);
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
      default: return '#1e3c4a';
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
  function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
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

  // Écouter les mises à jour du panier
  window.addEventListener('cart-updated', updateCartBadge);

  // Exposer globalement
  window.ContactPage = {
    init: initPage,
    showNotification,
    updateCartBadge
  };

  console.log(`
    ╔════════════════════════════════════════════════════════════════════════════════════╗
    ║                                                                                    ║
    ║                    📬 PAGE CONTACT - L'Échoppe Gauloise 📬                        ║
    ║                                                                                    ║
    ║               Document pédagogique créé par Rodulfo DOMINGUEZ                      ║ 
    ║                                                                                    ║
    ╚════════════════════════════════════════════════════════════════════════════════════╝
  `);

})();