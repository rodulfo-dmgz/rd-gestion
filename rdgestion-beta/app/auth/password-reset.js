// ============================================================================
// RÉINITIALISATION MOT DE PASSE
// ============================================================================

import { supabase } from '../../core/config/supabase.js';

const form = document.getElementById('resetForm');
const errorEl = document.getElementById('error');
const messageEl = document.getElementById('message');
const submitBtn = document.getElementById('submitBtn');
const emailInput = document.getElementById('email');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  submitBtn.disabled = true;
  submitBtn.textContent = 'Envoi en cours...';
  errorEl.style.display = 'none';
  messageEl.style.display = 'none';

  const email = emailInput.value.trim();

  try {
    // Déterminer l'URL de redirection selon l'environnement
    const isProduction = window.location.hostname === 'rodulfo-dmgz.github.io';
    const redirectUrl = isProduction
      ? 'https://rodulfo-dmgz.github.io/rd-gestion/rdgestion-beta/app/auth/update-password.html'
      : `${window.location.origin}/app/auth/update-password.html`;

    console.log('📧 Envoi email de réinitialisation à:', email);
    console.log('🔗 URL de redirection:', redirectUrl);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });

    if (error) throw error;

    console.log('✅ Email envoyé avec succès');

    messageEl.textContent = '✅ Email envoyé ! Vérifiez votre boîte de réception.';
    messageEl.style.display = 'block';
    form.reset();
    
    submitBtn.textContent = 'Email envoyé';
    submitBtn.disabled = true;

  } catch (error) {
    console.error('❌ Erreur:', error);
    
    let message = error.message;
    
    if (error.message?.includes('Unable to validate email')) {
      message = 'Adresse email invalide';
    } else if (error.message?.includes('User not found')) {
      message = 'Aucun compte associé à cet email';
    }
    
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    
    submitBtn.disabled = false;
    submitBtn.textContent = 'Envoyer le lien';
  }
});