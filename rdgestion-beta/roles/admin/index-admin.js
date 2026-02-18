/* ===============================
   DASHBOARD ADMIN - Navigation & KPIs dynamiques AVEC SUPABASE
   Version adaptée à la base de données réelle
   =============================== */

import { supabase, signOut } from '../../core/config/supabase.js';
import { navigateTo, buildPath } from '../../core/utils/Pathutils.js';

// ==================== VÉRIFICATION AUTH ====================
async function checkAuth() {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
        console.warn('⚠️ Aucune session active, redirection vers login');
        navigateTo('/index.html');
        return null;
    }

    const userProfile = JSON.parse(localStorage.getItem("user_profile"));
    const entreprise = JSON.parse(localStorage.getItem("current_entreprise"));

    if (!userProfile || !entreprise) {
        console.error('❌ Profil ou entreprise manquants dans localStorage');
        navigateTo('/index.html');
        return null;
    }

    return { user: userProfile, tenant: entreprise };
}

// ==================== INITIALISATION ====================
(async function init() {
    console.log('🚀 Initialisation du dashboard admin...');
    
    const auth = await checkAuth();
    if (!auth) return;

    const user = auth.user;
    const tenant = auth.tenant;
    const tenantId = tenant.id;
    const tenantRaisonSociale = tenant.raison_sociale || "CRM";

    console.log("🔑 Tenant ID :", tenantId);

    const IGNORE_TENANT_FILTER = localStorage.getItem("debug_ignore_tenant") === "true";
    if (IGNORE_TENANT_FILTER) {
        console.warn("⚠️ Mode diagnostic : le filtre entreprise_id est ignoré !");
    }

    // ==================== AFFICHAGE EN-TÊTE ====================
    document.getElementById("welcome").innerText = `Bonjour ${user.prenom} ${user.nom}`;
    const userInfo = user.role === 'admin' ? 'Administrateur' : (user.metier || user.role);
    document.getElementById("user-info").innerText = userInfo;
    document.getElementById("company-name").innerText = tenantRaisonSociale;
    document.getElementById("tenant-context").innerText = `Vous êtes connecté sur la base de données de : ${tenantRaisonSociale}`;

    if (typeof lucide !== 'undefined') lucide.createIcons();

    // ==================== GESTION DES PERMISSIONS ====================
    function getAccessibleModules(user) {
        const serviceModules = {
            "admin":    ["clients", "produits", "ventes", "planning", "SIRH", "comptabilite", "factures", "statistiques"],
            "formateur":["clients", "produits", "ventes", "planning", "SIRH", "comptabilite", "factures", "statistiques"],
            "stagiaire": {
                "comptable_assistant": ["clients", "ventes", "factures"],
                "gestionnaire_comptable_fiscal": ["comptabilite", "factures", "statistiques"]
            }
        };

        if (user.role === 'stagiaire') {
            return serviceModules.stagiaire[user.metier] || [];
        }
        return serviceModules[user.role] || serviceModules["admin"];
    }

    function hasAccessToModule(user, module) {
        return getAccessibleModules(user).includes(module);
    }

    // ==================== NAVIGATION ====================
    function generateNavigation() {
        const nav = document.getElementById("sidebar-nav");
        if (!nav) return;
        nav.innerHTML = "";

        const modules = getAccessibleModules(user);
        
        // URLs relatives au dossier actuel (roles/admin/)
        const moduleLinks = {
            "clients":       { url: "modules/clients.html",       label: "Clients",          icon: "users" },
            "produits":      { url: "modules/produits.html",      label: "Produits",         icon: "package" },
            "ventes":        { url: "modules/ventes.html",        label: "Ventes",           icon: "euro" },
            "planning":      { url: "modules/planning.html",      label: "Planning",         icon: "calendar" },
            "SIRH":          { url: "../5_ARH/index-arh.html",    label: "Gestion salariés", icon: "briefcase" },
            "comptabilite":  { url: "modules/comptabilite.html",  label: "Comptabilité",     icon: "book-open" },
            "factures":      { url: "modules/factures.html",      label: "Factures",         icon: "file-text" },
            "statistiques":  { url: "modules/statistiques.html",  label: "Statistiques",     icon: "bar-chart-2" }
        };

        modules.forEach(module => {
            if (moduleLinks[module]) {
                const link = document.createElement("a");
                link.href = moduleLinks[module].url;
                link.innerHTML = `<i data-lucide="${moduleLinks[module].icon}"></i> ${moduleLinks[module].label}`;
                nav.appendChild(link);
            }
        });

        // Lien Dashboard (actif)
        const dashboardLink = document.createElement("a");
        dashboardLink.href = "index-admin.html";
        dashboardLink.innerHTML = '<i data-lucide="layout-dashboard"></i> Dashboard';
        dashboardLink.classList.add("active");
        nav.insertBefore(dashboardLink, nav.firstChild);

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // ==================== LISTE DES TABLES AVEC ENTREPRISE_ID ====================
    const tablesWithTenant = [
        'clients', 'fournisseurs', 'produits', 'factures_clients', 'factures_fournisseurs',
        'devis', 'paiements', 'categories_produits', 'plan_comptable', 'journaux',
        'taux_tva', 'modes_reglement', 'exercices', 'periodes', 'ecritures',
        'avoirs_clients', 'avoirs_fournisseurs', 'immobilisations', 'amortissements',
        'rapprochements_bancaires', 'mouvements_stock'
    ];

    // ==================== GÉNÉRATION DES KPI ====================
    async function generateKPIs() {
        const kpiGrid = document.getElementById("kpi-grid");
        if (!kpiGrid) return;
        kpiGrid.innerHTML = "";

        const kpiDefinitions = [
            { label: "Clients actifs",      source: "clients",          filter: { actif: true }, type: "count", field: "id" },
            { label: "Prospects",           source: "clients",          filter: { type_client: 'professionnel' }, type: "count", field: "id" },
            { label: "Fournisseurs actifs", source: "fournisseurs",     filter: { actif: true }, type: "count", field: "id" },
            { label: "Produits/Services",   source: "produits",         filter: { actif: true }, type: "count", field: "id" },
            { label: "Factures de vente",   source: "factures_clients", filter: {}, type: "count", field: "id" },
            { label: "Factures impayées",   source: "factures_clients", filter: { statut_paiement: 'non_paye' }, type: "count", field: "id" },
            { label: "CA total (HT)",       source: "factures_clients", type: "sum", field: "montant_ht", filter: {} },
            { label: "CA du mois (HT)",     source: "factures_clients", type: "sum-month", field: "montant_ht", dateField: "date_facture", filter: {} },
            { label: "Devis en cours",      source: "devis",            filter: { statut: 'en_attente' }, type: "count", field: "id" },
            { label: "Factures fournisseurs", source: "factures_fournisseurs", filter: {}, type: "count", field: "id" },
            { label: "TVA collectée (mois)", source: "factures_clients", type: "sum-month", field: "montant_tva", dateField: "date_facture", filter: {} },
            { label: "Règlements clients (mois)", source: "paiements", type: "sum-month", field: "montant", dateField: "date_paiement", filter: { type_paiement: 'encaissement', tiers_type: 'client' } }
        ];

        for (const def of kpiDefinitions) {
            const kpiElement = document.createElement("article");
            kpiElement.className = "kpi";

            console.log(`📊 Chargement KPI: ${def.label} (${def.source})`);
            const result = await calculateKPIValue(def.source, def.type, def.field, def.filter, def.dateField);
            console.log(`✅ ${def.label} = ${result.value} ${result.diagnostic ? '(' + result.diagnostic + ')' : ''}`);

            kpiElement.innerHTML = `
                <span class="kpi-label">${def.label}</span>
                <span class="kpi-value" id="${def.source}-${def.type}">${result.value}</span>
            `;
            kpiGrid.appendChild(kpiElement);
        }
    }

    async function calculateKPIValue(source, type, field = 'id', filter = {}, dateField = null) {
        try {
            let query = supabase.from(source).select('*', { count: 'exact', head: false });

            if (!IGNORE_TENANT_FILTER && tablesWithTenant.includes(source) && tenantId) {
                query = query.eq('entreprise_id', tenantId);
            }

            Object.keys(filter).forEach(key => {
                query = query.eq(key, filter[key]);
            });

            const { data, error, count } = await query;

            if (error) {
                if (error.code === 'PGRST116' || error.message?.includes('Could not find')) {
                    console.warn(`⚠️ Table ${source} n'existe pas dans Supabase.`);
                    return { value: "—", diagnostic: "table inexistante" };
                }
                console.warn(`⚠️ Table ${source} inaccessible:`, error.message);
                return { value: "—", diagnostic: error.message };
            }

            let diagnostic = null;
            if ((!data || data.length === 0) && tablesWithTenant.includes(source) && tenantId && !IGNORE_TENANT_FILTER) {
                const { count: globalCount, error: globalError } = await supabase
                    .from(source)
                    .select('*', { count: 'exact', head: true });

                if (!globalError && globalCount > 0) {
                    diagnostic = `0 pour ce tenant, ${globalCount} global`;
                }
            }

            // Calcul selon le type
            if (type === 'sum') {
                const total = data?.reduce((acc, row) => acc + (parseFloat(row[field]) || 0), 0) || 0;
                return { value: total.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €', diagnostic };
            }

            if (type === 'sum-month') {
                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();

                const filtered = data?.filter(row => {
                    if (!row[dateField]) return false;
                    const d = new Date(row[dateField]);
                    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                }) || [];

                const total = filtered.reduce((acc, row) => acc + (parseFloat(row[field]) || 0), 0);
                return { value: total.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €', diagnostic };
            }

            // Par défaut : count
            return { value: (count !== null ? count : data.length).toString(), diagnostic };

        } catch (err) {
            console.error(`❌ Erreur chargement ${source}:`, err);
            return { value: "—", diagnostic: err.message };
        }
    }

    // ==================== GRAPHIQUES ====================
    async function generateCharts() {
        const chartsGrid = document.getElementById("charts-grid");
        if (!chartsGrid) return;
        chartsGrid.innerHTML = "";

        if (hasAccessToModule(user, "ventes") || hasAccessToModule(user, "produits")) {
            const chartCard = document.createElement("div");
            chartCard.className = "chart-card";
            chartCard.innerHTML = `
                <h3>Ventes par produit (simulé)</h3>
                <canvas id="barChart"></canvas>
            `;
            chartsGrid.appendChild(chartCard);

            try {
                let query = supabase.from('produits').select('*');
                if (!IGNORE_TENANT_FILTER && tenantId) query = query.eq('entreprise_id', tenantId);
                const { data: produits, error } = await query;

                if (!error && produits?.length) {
                    const palette = ['#1F4590', '#1BA098', '#FF570A', '#D72638', '#94A3B8', '#5A4BA5','#A54B69'];
                    new Chart(document.getElementById('barChart'), {
                        type: 'bar',
                        data: {
                            labels: produits.map(p => p.libelle).slice(0,7),
                            datasets: [{
                                label: 'Ventes (simulé)',
                                data: produits.map(() => Math.floor(Math.random() * 100)).slice(0,7),
                                backgroundColor: produits.map((_, i) => palette[i % palette.length]),
                                borderRadius: 8
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: true,
                            plugins: { legend: { display: false } },
                            scales: { y: { beginAtZero: true } }
                        }
                    });
                } else {
                    chartCard.innerHTML += '<p style="text-align:center; color: var(--text-muted); padding: 2rem;">Aucune donnée</p>';
                }
            } catch (err) {
                console.error('❌ Erreur graphique produits:', err);
            }
        }

        if (hasAccessToModule(user, "clients")) {
            const mapCard = document.createElement("div");
            mapCard.className = "chart-card";
            mapCard.innerHTML = `
                <h3>Clients par ville</h3>
                <div id="map"></div>
            `;
            chartsGrid.appendChild(mapCard);
            setTimeout(() => loadMap(), 100);
        }
    }

    async function loadMap() {
        try {
            let query = supabase.from('clients').select('*');
            if (!IGNORE_TENANT_FILTER && tenantId) query = query.eq('entreprise_id', tenantId);
            const { data: clients, error } = await query;
            if (error || !clients?.length) return;
            if (typeof L === 'undefined') return;

            const map = L.map('map').setView([46.8, 2.4], 5);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution: '' }).addTo(map);

            for (const c of clients) {
                const ville = c.ville_facturation || c.ville_livraison;
                if (ville) {
                    const coords = await geocodeCity(ville);
                    if (coords) {
                        L.circleMarker(coords, {
                            radius: 6,
                            fillColor: '#1F4590',
                            color: '#12355b',
                            weight: 1,
                            fillOpacity: 0.7
                        }).addTo(map).bindPopup(`<b>${c.raison_sociale || c.nom}</b><br>${ville}`);
                    }
                }
            }
            map.invalidateSize();
        } catch (err) {
            console.error('❌ Erreur chargement carte:', err);
        }
    }

    async function geocodeCity(cityName) {
        try {
            const url = `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(cityName)}&format=json&limit=1`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.length) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        } catch (err) {}
        return null;
    }

    // ==================== TABLEAUX ====================
    async function generateTables() {
        const tablesGrid = document.getElementById("tables-grid");
        if (!tablesGrid) return;
        tablesGrid.innerHTML = "";

        if (hasAccessToModule(user, "ventes") || hasAccessToModule(user, "comptabilite")) {
            const tableCard = document.createElement("div");
            tableCard.className = "table-card";
            tableCard.innerHTML = `
                <h3>Dernières factures clients</h3>
                <table id="recent-factures">
                    <thead>
                        <tr><th>N° facture</th><th>Client</th><th>Montant TTC</th><th>Date</th></tr>
                    </thead>
                    <tbody></tbody>
                </table>
            `;
            tablesGrid.appendChild(tableCard);

            try {
                let query = supabase
                    .from('factures_clients')
                    .select(`
                        numero_facture,
                        montant_ttc,
                        date_facture,
                        clients ( raison_sociale, nom, prenom )
                    `);
                if (!IGNORE_TENANT_FILTER && tenantId) query = query.eq('entreprise_id', tenantId);
                query = query.order('date_facture', { ascending: false }).limit(5);

                const { data: factures, error } = await query;
                const tbody = tableCard.querySelector("tbody");
                
                if (!error && factures?.length) {
                    factures.forEach(f => {
                        const client = f.clients;
                        const clientName = client?.raison_sociale || (client?.nom + ' ' + client?.prenom) || 'Inconnu';
                        const tr = document.createElement("tr");
                        tr.innerHTML = `
                            <td>${f.numero_facture}</td>
                            <td>${clientName}</td>
                            <td>${f.montant_ttc?.toFixed(2)} €</td>
                            <td>${new Date(f.date_facture).toLocaleDateString('fr-FR')}</td>
                        `;
                        tbody.appendChild(tr);
                    });
                } else {
                    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Aucune facture récente</td></tr>';
                }
            } catch (err) {
                console.error('❌ Erreur chargement factures:', err);
            }
        }
    }

    // ==================== DÉCONNEXION ====================
    document.getElementById("logout").onclick = async () => {
        await signOut();
    };

    // ==================== LANCEMENT ====================
    try {
        generateNavigation();
        await generateKPIs();
        await generateCharts();
        await generateTables();
        console.log('✅ Dashboard admin initialisé');
    } catch (err) {
        console.error('❌ Erreur initialisation dashboard:', err);
    }
})();