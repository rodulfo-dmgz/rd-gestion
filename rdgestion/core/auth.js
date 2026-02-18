// =============================================
// AUTHENTIFICATION AVEC SUPABASE (multi-tenants)
// Redirection dynamique vers dashboard spécifique par service
// =============================================

/**
 * Charge la liste des entreprises (tenants) actives dans le select
 */
async function loadTenants() {
  try {
    const supabase = window.CRM.getSupabaseClient();
    const { data: tenants, error } = await supabase
      .from('tenants')
      .select('id, code, raison_sociale, ville')
      .eq('statut', 'actif')
      .order('raison_sociale');

    if (error) throw error;

    const selectEl = document.getElementById('tenant-select');
    if (!selectEl) return;

    // Vider et remplir le select
    selectEl.innerHTML = '<option value="" disabled selected>Choisir une entreprise...</option>';
    tenants.forEach(tenant => {
      const option = document.createElement('option');
      option.value = tenant.id;
      option.textContent = `${tenant.raison_sociale} — ${tenant.code} - ${tenant.ville || ''}`;
      selectEl.appendChild(option);
    });

    console.log(`✅ ${tenants.length} entreprises chargées`);
  } catch (err) {
    console.error('❌ Erreur chargement entreprises:', err);
    const errorEl = document.getElementById('error');
    if (errorEl) {
      errorEl.innerText = 'Erreur de chargement des entreprises.';
      errorEl.style.display = 'block';
    }
  }
}

// Gestion du formulaire de connexion
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const tenantId = document.getElementById('tenant-select').value;
    const emailInput = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('error');

    console.log('🔐 Tentative de connexion...', { tenantId, emailInput });

    errorEl.innerText = '';
    errorEl.style.display = 'none';

    if (!tenantId) {
      errorEl.innerText = 'Veuillez sélectionner une entreprise.';
      errorEl.style.display = 'block';
      return;
    }

    try {
      const supabase = window.CRM.getSupabaseClient();

      // 1. Récupérer l'utilisateur par email
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', emailInput)
        .eq('actif', true)
        .maybeSingle();

      if (userError) throw userError;
      if (!user) {
        errorEl.innerText = 'Email ou mot de passe incorrect';
        errorEl.style.display = 'block';
        return;
      }

      // 2. Vérifier le mot de passe (en clair pour le moment)
      if (user.password_hash !== password) {
        errorEl.innerText = 'Email ou mot de passe incorrect';
        errorEl.style.display = 'block';
        return;
      }

      // 3. Vérifier l'association avec le tenant sélectionné
      const { data: userTenant, error: utError } = await supabase
        .from('user_tenants')
        .select('*')
        .eq('user_id', user.id)
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (utError) throw utError;
      if (!userTenant) {
        errorEl.innerText = "Vous n'êtes pas autorisé à accéder à cette entreprise.";
        errorEl.style.display = 'block';
        return;
      }

      console.log('✅ Utilisateur authentifié:', user);

      // Connexion réussie - stocker les informations
      const sessionData = {
        user: {
          id: user.id,
          email: user.email,
          prenom: user.prenom,
          nom: user.nom,
          service: user.service,   // nécessite la colonne service
          fonction: user.fonction,
          role_tenant: userTenant.role_tenant
        },
        tenant: {
          id: tenantId
          // On ajoutera la raison sociale après une requête supplémentaire (facultatif)
        }
      };

      // Récupérer la raison sociale du tenant pour l'afficher plus tard
      const { data: tenantInfo } = await supabase
        .from('tenants')
        .select('raison_sociale')
        .eq('id', tenantId)
        .single();
      if (tenantInfo) {
        sessionData.tenant.raison_sociale = tenantInfo.raison_sociale;
      }

      localStorage.setItem('session', JSON.stringify(sessionData));

      // Redirection selon le service de l'utilisateur
      if (typeof DASHBOARD_CONFIG === 'undefined') {
        console.error('❌ DASHBOARD_CONFIG non chargé !');
        errorEl.innerText = 'Erreur de configuration.';
        errorEl.style.display = 'block';
        return;
      }

      const serviceKey = user.service ? user.service.toUpperCase() : '';
      const serviceConfig = DASHBOARD_CONFIG[serviceKey] || DASHBOARD_CONFIG[user.service];
      let dashboardUrl = 'dashboard.html';

      if (serviceConfig && serviceConfig.dashboard) {
        dashboardUrl = serviceConfig.dashboard;
        console.log(`✅ Dashboard spécifique: ${dashboardUrl}`);
      } else {
        console.warn(`⚠️ Dashboard par défaut pour ${user.service}`);
      }

      console.log(`🚀 Redirection vers ${dashboardUrl}`);
      window.location.href = dashboardUrl;

    } catch (err) {
      console.error('❌ Erreur connexion:', err);
      errorEl.innerText = 'Erreur de connexion: ' + err.message;
      errorEl.style.display = 'block';
    }
  });
}

// Initialisation au chargement de la page
if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
  console.log('🚀 Initialisation de la page de connexion...');

  if (typeof window.supabase === 'undefined') {
    console.error('❌ ERREUR: Supabase SDK non chargé');
    const errorEl = document.getElementById('error');
    if (errorEl) {
      errorEl.innerText = 'Erreur technique. Rechargez la page.';
      errorEl.style.display = 'block';
    }
  } else {
    console.log('✅ SDK Supabase chargé');

    if (typeof window.CRM === 'undefined' || !window.CRM.getSupabaseClient) {
      console.error('❌ ERREUR: CRM non initialisé');
      const errorEl = document.getElementById('error');
      if (errorEl) {
        errorEl.innerText = 'Erreur d\'initialisation. Rechargez la page.';
        errorEl.style.display = 'block';
      }
    } else {
      if (typeof DASHBOARD_CONFIG === 'undefined') {
        console.warn('⚠️ DASHBOARD_CONFIG non chargé, redirection par défaut.');
      } else {
        console.log('✅ Configuration dashboards chargée');
      }

      // Charger la liste des entreprises
      loadTenants();
    }
  }
}