/* ===============================
   CONFIGURATION DASHBOARDS PAR SERVICE
   =============================== */

const DASHBOARD_CONFIG = {
  // Direction - Accès total (Rodulfo le Boss 👑)
  "Direction": {
    dashboard: "dashboard.html",
    nom: "Direction Générale",
    modules: ["clients", "produits", "ventes", "planning", "SIRH", "employes", "paie", "comptabilite", "factures", "statistiques"]
  },
  
  // AD - Assistant de Direction
  "AD": {
    dashboard: "dashboard.html",
    nom: "Assistant de Direction",
    modules: ["planning", "clients", "courrier", "statistiques"]
  },
  
  // GP - Gestionnaire de Paie
  "GP": {
    dashboard: "dashboard.html",
    nom: "Gestion de Paie",
    modules: ["employes", "paie", "planning"]
  },
  
  // ARH - Assistant Ressources Humaines
  "ARH": {
    dashboard: "dashboard.html",
    nom: "Ressources Humaines",
    modules: ["employes", "planning", "statistiques"]
  },
  
  // GCF - Gestionnaire Comptable et Fiscal
  "GCF": {
    dashboard: "dashboard.html",
    nom: "Comptabilité & Fiscalité",
    modules: ["comptabilite", "factures", "statistiques"]
  },
  
  // CA - Comptable Assistant
  "CA": {
    dashboard: "dashboard.html",
    nom: "Comptabilité",
    modules: ["comptabilite", "factures"]
  },
  
  // AC - Assistant Commercial
  "AC": {
    dashboard: "dashboard.html",
    nom: "Commercial",
    modules: ["clients", "ventes", "planning"]
  },
  
  // SA - Secrétaire Assistant
  "SA": {
    dashboard: "dashboard.html",
    nom: "Secrétariat",
    modules: ["planning", "clients"]
  },
  
  // SC - Secrétaire Comptable
  "SC": {
    dashboard: "dashboard.html",
    nom: "Secrétariat Comptable",
    modules: ["factures", "comptabilite"]
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