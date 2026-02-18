/**
 * ═══════════════════════════════════════════════════════════════════════════
 * L'ÉCHOPPE GAULOISE - NEWSLETTER
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Gestion du formulaire de newsletter avec validation
 */

const NewsletterModule = (() => {
  'use strict';

  const API_ENDPOINT = '/api/newsletter/subscribe'; // À remplacer par votre vraie API

  /**
   * Initialize newsletter
   */
  function init() {
    const form = document.getElementById('newsletterForm');
    if (!form) return;

    form.addEventListener('submit', handleSubmit);

    // Real-time validation
    const emailInput = document.getElementById('newsletterEmail');
    if (emailInput) {
      emailInput.addEventListener('blur', validateEmail);
      emailInput.addEventListener('input', clearError);
    }
  }

  /**
   * Handle form submit
   */
  async function handleSubmit(e) {
    e.preventDefault();

    const emailInput = document.getElementById('newsletterEmail');
    const errorElement = document.getElementById('newsletterError');
    const successElement = document.getElementById('newsletterSuccess');
    const submitBtn = e.target.querySelector('button[type="submit"]');

    if (!emailInput) return;

    const email = emailInput.value.trim();

    // Hide previous messages
    if (errorElement) errorElement.style.display = 'none';
    if (successElement) successElement.style.display = 'none';

    // Validate
    if (!Utils.validateEmail(email)) {
      showError('Veuillez entrer une adresse email valide.');
      return;
    }

    // Check if already subscribed
    const subscribers = Utils.storage.get('newsletter_subscribers') || [];
    if (subscribers.includes(email)) {
      showError('Cette adresse email est déjà inscrite.');
      return;
    }

    // Show loading state
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'En cours...';
    submitBtn.disabled = true;

    try {
      // Simulate API call (remplacer par vraie requête)
      await Utils.wait(1500);
      
      // En production, utiliser fetch:
      // const response = await fetch(API_ENDPOINT, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email })
      // });
      //
      // if (!response.ok) throw new Error('Subscription failed');

      // Save to localStorage (simulation)
      subscribers.push(email);
      Utils.storage.set('newsletter_subscribers', subscribers);

      // Show success
      showSuccess('Merci ! Vous êtes maintenant inscrit à notre newsletter. Vérifiez votre email pour confirmer.');
      
      // Clear form
      emailInput.value = '';

      // Track event (Google Analytics)
      if (typeof gtag !== 'undefined') {
        gtag('event', 'newsletter_signup', {
          'event_category': 'engagement',
          'event_label': 'homepage_newsletter'
        });
      }

    } catch (error) {
      console.error('Newsletter subscription error:', error);
      showError('Une erreur est survenue. Veuillez réessayer plus tard.');
    } finally {
      // Reset button
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  }

  /**
   * Validate email on blur
   */
  function validateEmail() {
    const emailInput = document.getElementById('newsletterEmail');
    if (!emailInput) return;

    const email = emailInput.value.trim();

    if (email && !Utils.validateEmail(email)) {
      showError('Format d\'email invalide');
      emailInput.classList.add('form-input--error');
    } else {
      clearError();
      emailInput.classList.remove('form-input--error');
    }
  }

  /**
   * Show error message
   */
  function showError(message) {
    const errorElement = document.getElementById('newsletterError');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }

  /**
   * Show success message
   */
  function showSuccess(message) {
    const successElement = document.getElementById('newsletterSuccess');
    if (successElement) {
      successElement.textContent = message;
      successElement.style.display = 'block';
    }
  }

  /**
   * Clear error message
   */
  function clearError() {
    const errorElement = document.getElementById('newsletterError');
    if (errorElement) {
      errorElement.style.display = 'none';
    }
  }

  // Public API
  return {
    init
  };
})();