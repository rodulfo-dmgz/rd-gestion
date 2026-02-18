// =============================================
// CONFIGURATION DES DASHBOARDS PAR SERVICE
// =============================================

// Cette variable globale est utilisée dans auth.js pour la redirection
const DASHBOARD_CONFIG = {
    admin: { dashboard: 'roles/admin/index-admin.html' },
    CA:    { dashboard: 'modules/ca/dashboard.html' },
    SA:    { dashboard: 'modules/sa/dashboard.html' },
    AD:    { dashboard: 'modules/ad/dashboard.html' },
    AC:    { dashboard: 'modules/ac/dashboard.html' },
    GP:    { dashboard: 'modules/gp/dashboard.html' },
    ARH:   { dashboard: 'modules/arh/dashboard.html' },
    SC:    { dashboard: 'modules/sc/dashboard.html' },
    GCF:   { dashboard: 'modules/gcf/dashboard.html' }
};

// Vous pouvez également y placer d'autres configurations globales si nécessaire
// (par exemple, couleurs, etc.)