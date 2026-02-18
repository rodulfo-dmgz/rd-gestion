// ============================================================================
// GESTION DE LA CONNEXION - RD GESTION
// Redirection selon le rôle : admin/formateur → /roles/admin
//                             stagiaire CA    → /roles/ca
//                             stagiaire GCF   → /roles/gcf
// ============================================================================

import { supabase } from '../../core/config/supabase.js';
import { buildPath, navigateTo, getLoginPath, APP_PATHS } from '../../core/utils/Pathutils.js';

// ============================================================================
// ÉLÉMENTS DOM
// ============================================================================

const form          = document.getElementById('loginForm');
const emailInput    = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorEl       = document.getElementById('error');
const submitBtn     = document.getElementById('submitBtn');

// ============================================================================
// REDIRECTION SELON LE RÔLE
// ============================================================================

function redirectToRoleDashboard(profile) {
    const { role, metier } = profile;

    console.log('🔀 Redirection pour rôle:', role, '- métier:', metier);

    // Admin ou Formateur → Dashboard Admin
    if (role === 'admin' || role === 'formateur') {
        console.log('👉 Redirection → Dashboard Admin');
        navigateTo(APP_PATHS.DASHBOARD_ADMIN);
        return;
    }

    // Stagiaire → selon le métier
    if (role === 'stagiaire') {
        if (metier === 'comptable_assistant') {
            console.log('👉 Redirection → Dashboard CA (Comptable Assistant)');
            navigateTo(APP_PATHS.DASHBOARD_CA);
            return;
        }
        if (metier === 'gestionnaire_comptable_fiscal') {
            console.log('👉 Redirection → Dashboard GCF');
            navigateTo(APP_PATHS.DASHBOARD_GCF);
            return;
        }
    }

    // Fallback sécurisé : afficher erreur, pas de redirection en boucle
    console.warn('⚠️ Rôle/métier non reconnu :', role, metier);
    showError(`Rôle non reconnu (${role} / ${metier || 'non défini'}). Contactez votre administrateur.`);
}

// ============================================================================
// GESTION DES ERREURS UI
// ============================================================================

function showError(message) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
}

function hideError() {
    errorEl.textContent = '';
    errorEl.style.display = 'none';
}

function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading ? 'Connexion...' : 'Accéder au dashboard';
}

// ============================================================================
// VÉRIFIER SI DÉJÀ CONNECTÉ (sans boucle)
// ============================================================================

async function checkIfAlreadyLoggedIn() {
    console.log('🔍 Vérification session existante...');

    try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            console.error('❌ Erreur récupération session:', error);
            return; // On reste sur la page de login
        }

        if (!session) {
            console.log('ℹ️ Aucune session active');
            return;
        }

        console.log('✅ Session active détectée:', session.user.email);

        // Vérifier les données en localStorage
        const profile    = JSON.parse(localStorage.getItem('user_profile') || 'null');
        const entreprise = JSON.parse(localStorage.getItem('current_entreprise') || 'null');

        if (profile && entreprise) {
            // Tout est en ordre → rediriger directement
            console.log('✅ Profil et entreprise présents en localStorage, redirection...');
            redirectToRoleDashboard(profile);
        } else {
            // Session Supabase présente MAIS données locales manquantes
            // → On déconnecte proprement sans recharger (évite boucle infinie)
            console.warn('⚠️ Session active mais données localStorage incomplètes → déconnexion propre');
            await cleanLogout();
            console.log('ℹ️ Déconnecté. Veuillez vous reconnecter.');
        }
    } catch (err) {
        console.error('❌ Exception dans checkIfAlreadyLoggedIn:', err);
        // On ne fait rien → l'utilisateur reste sur la page de login
    }
}

// ============================================================================
// DÉCONNEXION PROPRE
// ============================================================================

async function cleanLogout() {
    try {
        await supabase.auth.signOut();
    } catch (e) {
        console.warn('Erreur signOut:', e);
    }
    localStorage.removeItem('user_profile');
    localStorage.removeItem('current_entreprise');
}

// ============================================================================
// RÉCUPÉRATION DE L'ENTREPRISE
// ============================================================================

async function fetchEntreprise(profile) {
    // Tentative 1 : entreprise liée directement à l'utilisateur (via user_id)
    console.log('🔎 Recherche entreprise par user_id:', profile.id);
    
    const { data: byUser, error: errUser } = await supabase
        .from('entreprises')
        .select('*')
        .eq('user_id', profile.id);

    if (errUser) {
        throw new Error('Impossible de récupérer l\'entreprise (user_id) : ' + errUser.message);
    }

    if (byUser && byUser.length > 0) {
        if (byUser.length > 1) {
            console.warn('⚠️ Plusieurs entreprises pour cet utilisateur, utilisation de la première');
        }
        console.log('✅ Entreprise récupérée (user_id):', byUser[0].raison_sociale);
        return byUser[0];
    }

    // Tentative 2 : entreprise liée via entreprise_id sur le profil utilisateur
    if (profile.entreprise_id) {
        console.log('🔎 Recherche entreprise par profile.entreprise_id:', profile.entreprise_id);
        
        const { data: byEnt, error: errEnt } = await supabase
            .from('entreprises')
            .select('*')
            .eq('id', profile.entreprise_id);

        if (!errEnt && byEnt && byEnt.length > 0) {
            console.log('✅ Entreprise récupérée (entreprise_id):', byEnt[0].raison_sociale);
            return byEnt[0];
        }
    }

    // Tentative 3 : première entreprise disponible (fallback universel)
    console.warn('⚠️ Aucune entreprise directement liée → prise de la première disponible');
    
    const { data: fallback, error: errFallback } = await supabase
        .from('entreprises')
        .select('*')
        .limit(1);

    if (errFallback) {
        throw new Error('Impossible de récupérer l\'entreprise (fallback) : ' + errFallback.message);
    }
    
    if (!fallback || fallback.length === 0) {
        throw new Error('Aucune entreprise trouvée dans la base');
    }

    console.log('✅ Entreprise récupérée (fallback):', fallback[0].raison_sociale);
    return fallback[0];
}

// ============================================================================
// SOUMISSION DU FORMULAIRE
// ============================================================================

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // UI : début de chargement
    setLoading(true);
    hideError();

    const email    = emailInput.value.trim();
    const password = passwordInput.value;

    console.log('👤 Tentative de connexion :', email);

    try {
        // ── 1. Authentification Supabase ──────────────────────────────────────
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ 
            email, 
            password 
        });

        if (authError) throw authError;
        console.log('✅ Auth réussie :', authData.user.email);

        // ── 2. Récupération du profil utilisateur ─────────────────────────────
        const { data: profiles, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email);

        if (profileError) throw profileError;

        if (!profiles || profiles.length === 0) {
            await cleanLogout();
            throw new Error('Profil utilisateur introuvable pour cet email');
        }

        if (profiles.length > 1) {
            console.warn('⚠️ Plusieurs profils pour le même email, utilisation du premier');
        }

        const profile = profiles[0];
        console.log('✅ Profil récupéré :', profile);

        // ── 3. Vérification compte actif ──────────────────────────────────────
        if (!profile.actif) {
            await cleanLogout();
            throw new Error('Compte désactivé. Contactez votre formateur.');
        }

        // ── 4. Stockage profil ────────────────────────────────────────────────
        localStorage.setItem('user_profile', JSON.stringify(profile));
        console.log('✅ user_profile stocké');

        // ── 5. Récupération et stockage de l'entreprise ───────────────────────
        const entreprise = await fetchEntreprise(profile);
        localStorage.setItem('current_entreprise', JSON.stringify(entreprise));
        console.log('✅ current_entreprise stocké :', entreprise.raison_sociale);

        // ── 6. Redirection (délai court pour garantir l'écriture localStorage)
        console.log('🔄 Redirection dans 300ms...');
        setTimeout(() => redirectToRoleDashboard(profile), 300);

    } catch (error) {
        console.error('❌ Erreur de connexion:', error);

        // Messages d'erreur localisés
        let message = error.message || 'Erreur inconnue';
        
        if (message.includes('Invalid login credentials')) {
            message = 'Email ou mot de passe incorrect';
        } else if (message.includes('Email not confirmed')) {
            message = 'Veuillez confirmer votre email';
        } else if (message.includes('User not found')) {
            message = 'Utilisateur non trouvé';
        } else if (message.includes('Too many requests')) {
            message = 'Trop de tentatives. Réessayez dans quelques minutes.';
        } else if (message.includes('Network')) {
            message = 'Erreur réseau. Vérifiez votre connexion internet.';
        }

        showError(message);
        setLoading(false);
    }
});

// ============================================================================
// POINT D'ENTRÉE : vérification session au chargement
// ============================================================================

checkIfAlreadyLoggedIn();