// core/main.js – Gestion de session, message de bienvenue avec imports
import { MESSAGES_HOMME, MESSAGES_FEMME } from './messages.js';

// Récupérer l'utilisateur depuis localStorage
export function getUserSession() {
  const userStr = localStorage.getItem('kpi_user');
  return userStr ? JSON.parse(userStr) : null;
}

// Sauvegarder l'utilisateur
export function setUserSession(user) {
  localStorage.setItem('kpi_user', JSON.stringify(user));
}

// Effacer la session
export function clearUserSession() {
  localStorage.removeItem('kpi_user');
}

// Afficher le message de bienvenue personnalisé
export function afficherMessageBienvenue() {
  const user = getUserSession();
  if (!user) return;

  const welcomeEl = document.getElementById('welcome-message');
  if (!welcomeEl) return;

  // Déterminer le tableau de messages selon la civilité
  let messageList;
  if (user.civilite === 'M' || user.civilite === 'M.') {
    messageList = MESSAGES_HOMME;
  } else if (user.civilite === 'Mme' || user.civilite === 'F' || user.civilite === 'Mlle') {
    messageList = MESSAGES_FEMME;
  } else {
    messageList = MESSAGES_HOMME; // fallback
  }

  // Sélection aléatoire
  const randomIndex = Math.floor(Math.random() * messageList.length);
  const rawMessage = messageList[randomIndex];

  // Remplacer {prenom} par le prénom de l'utilisateur
  const messageAvecPrenom = rawMessage.replace('{prenom}', user.prenom);

  // Construire l'affichage complet (civilité + message)
  const civiliteAffichee = user.civilite === 'M' ? 'M.' : (user.civilite === 'F' ? 'Mme' : user.civilite);
  welcomeEl.innerHTML = `${messageAvecPrenom}`;

  // Si des informations supplémentaires existent (rôle, tenant), on peut les afficher ailleurs
  const userInfoEl = document.getElementById('user-info');
  if (userInfoEl) {
    const role = user.role || (user.civilite === 'stagiaire' ? 'Comptable assistant' : 'Utilisateur');
    userInfoEl.textContent = role;
  }

  const tenantEl = document.getElementById('tenant-context');
  if (tenantEl && user.raison_sociale) {
    tenantEl.textContent = `Vous êtes connecté sur la base de données de : ${user.raison_sociale}`;
  }

  // Recharger les icônes Lucide si présentes
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
}

// Vérification de l'authentification
document.addEventListener('DOMContentLoaded', () => {
  const user = getUserSession();
  const isIndex = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';

  if (!user && !isIndex) {
    window.location.href = 'index.html';
  } else if (user && !isIndex) {
    afficherMessageBienvenue();
  }
});

// Exposer les fonctions globalement si nécessaire (pour les scripts inline)
window.getUserSession = getUserSession;
window.setUserSession = setUserSession;
window.clearUserSession = clearUserSession;
window.afficherMessageBienvenue = afficherMessageBienvenue;