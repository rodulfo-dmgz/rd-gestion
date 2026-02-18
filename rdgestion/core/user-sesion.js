/**
 * RD GESTION - Gestion de session utilisateur
 * Gère les informations de l'utilisateur connecté et du tenant sélectionné
 */

class UserSession {
  constructor() {
    this.currentUser = null;
    this.currentTenant = null;
    this.isLoaded = false;
  }

  /**
   * Charger les informations complètes de l'utilisateur depuis Supabase
   */
  async loadUserInfo(email) {
    if (!window.supabase) {
      throw new Error('Client Supabase non disponible');
    }

    try {
      // 1. Récupérer l'utilisateur depuis la table users
      const { data: userData, error: userError } = await window.supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (userError) throw userError;
      
      this.currentUser = userData;
      console.log('✅ Utilisateur chargé:', this.currentUser.prenom, this.currentUser.nom);
      
      return this.currentUser;
      
    } catch (error) {
      console.error('❌ Erreur chargement utilisateur:', error);
      throw error;
    }
  }

  /**
   * Charger les informations du tenant (entreprise cliente)
   */
  async loadTenantInfo(tenantCode) {
    if (!window.supabase) {
      throw new Error('Client Supabase non disponible');
    }

    try {
      const { data: tenantData, error: tenantError } = await window.supabase
        .from('tenants')
        .select('*')
        .eq('code', tenantCode)
        .single();

      if (tenantError) throw tenantError;
      
      this.currentTenant = tenantData;
      console.log('✅ Tenant chargé:', this.currentTenant.raison_sociale);
      
      return this.currentTenant;
      
    } catch (error) {
      console.error('❌ Erreur chargement tenant:', error);
      throw error;
    }
  }

  /**
   * Initialiser la session complète après connexion
   */
  async init() {
    try {
      // Récupérer la session Supabase
      const { data: { session } } = await window.supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Pas de session active');
      }

      // Charger les infos utilisateur
      await this.loadUserInfo(session.user.email);

      // Récupérer le tenant sélectionné
      const tenantCode = sessionStorage.getItem('selectedTenant');
      if (tenantCode) {
        await this.loadTenantInfo(tenantCode);
      }

      this.isLoaded = true;
      console.log('✅ Session complète initialisée');
      
      return {
        user: this.currentUser,
        tenant: this.currentTenant
      };
      
    } catch (error) {
      console.error('❌ Erreur initialisation session:', error);
      throw error;
    }
  }

  /**
   * Obtenir le prénom de l'utilisateur
   */
  getUserFirstName() {
    return this.currentUser ? this.currentUser.prenom : 'Utilisateur';
  }

  /**
   * Obtenir le nom complet de l'utilisateur
   */
  getUserFullName() {
    if (!this.currentUser) return 'Utilisateur';
    return `${this.currentUser.prenom} ${this.currentUser.nom}`;
  }

  /**
   * Obtenir la fonction/rôle de l'utilisateur
   */
  getUserRole() {
    return this.currentUser ? 
      (this.currentUser.fonction || this.currentUser.service || 'Collaborateur') 
      : 'Collaborateur';
  }

  /**
   * Obtenir le nom de l'entreprise cliente (tenant)
   */
  getTenantName() {
    return this.currentTenant ? this.currentTenant.raison_sociale : 'Non sélectionné';
  }

  /**
   * Obtenir le code du tenant
   */
  getTenantCode() {
    return this.currentTenant ? this.currentTenant.code : '';
  }

  /**
   * Mettre à jour l'UI avec les informations de session
   */
  updateUI() {
    // Nom de l'application (toujours "RD GESTION")
    const companyNameEl = document.getElementById('company-name');
    if (companyNameEl) {
      companyNameEl.textContent = 'RD GESTION';
    }

    // Message de bienvenue avec le prénom
    const welcomeEl = document.getElementById('welcome');
    if (welcomeEl) {
      welcomeEl.textContent = `Bonjour ${this.getUserFirstName()}`;
    }

    // Fonction/rôle de l'utilisateur
    const userInfoEl = document.getElementById('user-info');
    if (userInfoEl) {
      userInfoEl.textContent = this.getUserRole();
    }

    // Affichage discret du tenant (entreprise cliente)
    this.addTenantBadge();
  }

  /**
   * Ajouter un badge discret montrant l'entreprise cliente
   */
  addTenantBadge() {
    // Vérifier si le badge existe déjà
    if (document.getElementById('tenant-badge')) return;

    // Trouver le header ou un endroit approprié
    const header = document.querySelector('.header') || document.querySelector('header');
    if (!header) return;

    // Créer le badge
    const badge = document.createElement('div');
    badge.id = 'tenant-badge';
    badge.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(31, 69, 144, 0.95);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    `;
    badge.innerHTML = `
      <span style="opacity: 0.8;">Base de données :</span> 
      <strong>${this.getTenantName()}</strong>
    `;

    document.body.appendChild(badge);
  }
}

// Créer l'instance globale
window.userSession = new UserSession();

// Exporter pour utilisation dans d'autres scripts
window.UserSession = UserSession;