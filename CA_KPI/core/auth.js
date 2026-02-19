// core/auth.js – Gestion de l'authentification (inscription / connexion)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('auth-form');
  const messageContainer = document.getElementById('message-container');

  // Vérifier que les variables Supabase sont définies
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    messageContainer.innerHTML = '<div class="alert-box" style="color: var(--danger);">⚠️ Configuration Supabase manquante. Veuillez renseigner core/config.js.</div>';
    return;
  }

  const supabase = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    messageContainer.innerHTML = '';

    const civilite = document.getElementById('civilite').value;
    const nom = document.getElementById('nom').value.trim();
    const prenom = document.getElementById('prenom').value.trim();
    const email = document.getElementById('email').value.trim();

    // Validation basique
    if (!nom || !prenom || !email) {
      messageContainer.innerHTML = '<div class="alert-box" style="color: var(--danger);">Tous les champs sont requis.</div>';
      return;
    }

    try {
      // Vérifier si l'utilisateur existe déjà
      const { data: existingUser, error: selectError } = await supabase
        .from('cours_kpi_users')
        .select('*')
        .eq('email', email);

      if (selectError) throw selectError;

      if (existingUser && existingUser.length > 0) {
        // Connexion (utilisateur existant)
        const user = existingUser[0];
        localStorage.setItem('kpi_user', JSON.stringify(user));
        messageContainer.innerHTML = '<div class="info-box" style="color: var(--success);">Connexion réussie. Redirection...</div>';
        setTimeout(() => { window.location.href = 'page1.html'; }, 1500);
      } else {
        // Inscription (nouvel utilisateur)
        const { data: newUser, error: insertError } = await supabase
          .from('cours_kpi_users')
          .insert([{ civilite, nom, prenom, email }])
          .select();

        if (insertError) throw insertError;

        const user = newUser[0];
        localStorage.setItem('kpi_user', JSON.stringify(user));
        messageContainer.innerHTML = '<div class="info-box" style="color: var(--success);">Inscription réussie. Bienvenue !</div>';
        setTimeout(() => { window.location.href = 'page1.html'; }, 1500);
      }
    } catch (error) {
      console.error('Erreur Supabase:', error);
      messageContainer.innerHTML = '<div class="alert-box" style="color: var(--danger);">Erreur de communication avec le serveur. Vérifiez votre configuration Supabase.</div>';
    }
  });
});