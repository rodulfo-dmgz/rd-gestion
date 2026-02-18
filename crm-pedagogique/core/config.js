/* ===============================
   CONFIGURATION DASHBOARDS PAR SERVICE v1.1
   Structure: /roles/{niveau}_{code}/index-{code}.html
   =============================== */

const DASHBOARD_CONFIG = {
  // ═══════════════════════════════════════════════════
  // NIVEAU 1 - DIRECTION (Accès total)
  // ═══════════════════════════════════════════════════
  "Direction": {
    dashboard: "roles/1_Admin/index-admin.html",
    nom: "Direction Générale",
    niveau: 1,
    modules: [
      "clients", 
      "produits", 
      "ventes", 
      "planning", 
      "employes", 
      "paie", 
      "comptabilite", 
      "factures", 
      "statistiques",
      "gestion"
    ]
  },
  
  // ═══════════════════════════════════════════════════
  // NIVEAU 4 - DÉPARTEMENTS OPÉRATIONNELS
  // ═══════════════════════════════════════════════════
  
  // CA - Commercial (ventes, clients, prospection)
  "CA": {
    dashboard: "roles/4_CA/index-ca.html",
    nom: "Service Commercial",
    niveau: 4,
    modules: ["clients", "ventes", "planning", "statistiques"]
  },
  
  // SA - Sales/Ventes (focus ventes et performance)
  "SA": {
    dashboard: "roles/4_SA/index-sa.html",
    nom: "Service Ventes",
    niveau: 4,
    modules: ["ventes", "clients", "produits", "statistiques"]
  },
  
  // ═══════════════════════════════════════════════════
  // NIVEAU 5 - SERVICES SUPPORTS
  // ═══════════════════════════════════════════════════
  
  // ARH - Assistant Ressources Humaines
  "ARH": {
    dashboard: "roles/5_ARH/index-arh.html",
    nom: "Ressources Humaines",
    niveau: 5,
    modules: ["employes", "conges", "formations", "planning", "statistiques"]
  },
  
  // GP - Gestionnaire de Paie
  "GP": {
    dashboard: "roles/5_GP/index-gp.html",
    nom: "Gestion de la Paie",
    niveau: 5,
    modules: ["employes", "paie", "planning"]
  },
  
  // AC - Accounting/Comptabilité
  "AC": {
    dashboard: "roles/5_AC/index-ac.html",
    nom: "Comptabilité",
    niveau: 5,
    modules: ["comptabilite", "factures", "transactions", "statistiques"]
  },
  
  // GCF - Gestionnaire Comptable et Fiscal
  "GCF": {
    dashboard: "roles/5_GCF/index-gcf.html",
    nom: "Comptabilité & Fiscalité",
    niveau: 5,
    modules: ["comptabilite", "factures", "fiscalite", "statistiques"]
  },
  
  // AD - Administration
  "AD": {
    dashboard: "roles/5_AD/index-ad.html",
    nom: "Administration",
    niveau: 5,
    modules: ["planning", "clients", "courrier", "gestion"]
  },
  
  // ═══════════════════════════════════════════════════
  // SERVICES ADDITIONNELS (compatibilité)
  // ═══════════════════════════════════════════════════
  
  // SC - Secrétaire Comptable (redirection vers AC)
  "SC": {
    dashboard: "roles/5_AC/index-ac.html",
    nom: "Secrétariat Comptable",
    niveau: 5,
    modules: ["factures", "comptabilite"]
  },
  
  // RH - Ressources Humaines (alias de ARH)
  "RH": {
    dashboard: "roles/5_ARH/index-arh.html",
    nom: "Ressources Humaines",
    niveau: 5,
    modules: ["employes", "conges", "formations", "planning"]
  }
};

/* ===============================
   FONCTION: Vérifier accès module
   =============================== */
function hasAccessToModule(user, moduleName) {
  // Direction et acces_total ont accès à tout
  if (user.acces_total || user.service === "Direction") {
    return true;
  }
  
  // Vérifier si le service a accès au module
  const config = DASHBOARD_CONFIG[user.service];
  return config && config.modules.includes(moduleName);
}

/* ===============================
   FONCTION: Obtenir modules accessibles
   =============================== */
function getAccessibleModules(user) {
  if (user.acces_total || user.service === "Direction") {
    return DASHBOARD_CONFIG["Direction"].modules;
  }
  
  const config = DASHBOARD_CONFIG[user.service];
  return config ? config.modules : [];
}

/* ===============================
   FONCTION: Obtenir nom dashboard
   =============================== */
function getDashboardName(user) {
  if (user.acces_total || user.service === "Direction") {
    return DASHBOARD_CONFIG["Direction"].nom;
  }
  
  const config = DASHBOARD_CONFIG[user.service];
  return config ? config.nom : "Dashboard";
}

/* ===============================
   FONCTION: Obtenir URL du dashboard
   =============================== */
function getDashboardUrl(user) {
  if (!user || !user.service) {
    console.error("❌ Utilisateur invalide");
    return "dashboard.html"; // Fallback
  }
  
  const config = DASHBOARD_CONFIG[user.service];
  
  if (config && config.dashboard) {
    return config.dashboard;
  }
  
  console.warn(`⚠️ Pas de dashboard configuré pour le service: ${user.service}`);
  return "dashboard.html"; // Fallback
}

/* ===============================
   FONCTION: Obtenir niveau d'accès
   =============================== */
function getAccessLevel(user) {
  if (user.acces_total || user.service === "Direction") {
    return 1; // Accès total
  }
  
  const config = DASHBOARD_CONFIG[user.service];
  return config ? config.niveau : 5; // Par défaut niveau le plus bas
}

/* ===============================
   FONCTION: Vérifier si service existe
   =============================== */
function serviceExists(serviceName) {
  return DASHBOARD_CONFIG.hasOwnProperty(serviceName);
}

/* ===============================
   FONCTION: Liste de tous les services
   =============================== */
function getAllServices() {
  return Object.keys(DASHBOARD_CONFIG).map(key => ({
    code: key,
    nom: DASHBOARD_CONFIG[key].nom,
    niveau: DASHBOARD_CONFIG[key].niveau,
    dashboard: DASHBOARD_CONFIG[key].dashboard
  }));
}

/* ===============================
   EXPORT (si module ES6)
   =============================== */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DASHBOARD_CONFIG,
    hasAccessToModule,
    getAccessibleModules,
    getDashboardName,
    getDashboardUrl,
    getAccessLevel,
    serviceExists,
    getAllServices
  };
}

/* ===============================
   LOG DE DÉBOGAGE (dev uniquement)
   =============================== */
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  console.log('📋 Configuration chargée:', {
    services: Object.keys(DASHBOARD_CONFIG).length,
    niveaux: [...new Set(Object.values(DASHBOARD_CONFIG).map(c => c.niveau))],
    dashboards: Object.values(DASHBOARD_CONFIG).map(c => c.dashboard)
  });
}