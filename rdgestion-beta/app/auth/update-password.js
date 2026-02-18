// ============================================================================
// MISE À JOUR MOT DE PASSE
// ============================================================================

import { supabase } from '../../core/config/supabase.js';

const form = document.getElementById('updatePasswordForm');
const errorEl = document.getElementById('error');
const submitBtn = document.getElementById('submitBtn');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  errorEl.style.display = 'none';
  submitBtn.disabled = true;
  submitBtn.textContent = 'Enregistrement...';

  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  // Validation
  if (password !== confirmPassword) {
    errorEl.textContent = 'Les mots de passe ne correspondent pas';
    errorEl.style.display = 'block';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Enregistrer';
    return;
  }

  if (password.length < 8) {
    errorEl.textContent = 'Le mot de passe doit contenir au moins 8 caractères';
    errorEl.style.display = 'block';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Enregistrer';
    return;
  }

  try {
    console.log('🔐 Mise à jour du mot de passe...');

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) throw error;

    console.log('✅ Mot de passe mis à jour avec succès');

    alert('✅ Mot de passe mis à jour avec succès !');
    window.location.href = '../../index.html';

  } catch (error) {
    console.error('❌ Erreur:', error);
    
    errorEl.textContent = error.message || 'Erreur lors de la mise à jour du mot de passe';
    errorEl.style.display = 'block';
    
    submitBtn.disabled = false;
    submitBtn.textContent = 'Enregistrer';
  }
});
