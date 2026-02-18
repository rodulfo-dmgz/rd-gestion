// =============================================
// AUTHENTIFICATION AVEC SUPABASE
// Redirection dynamique vers dashboard spécifique par service
// =============================================

async function loadLoginPage() {
  try {
    console.log("📄 Chargement des informations entreprise...");
    
    // Charger infos entreprise
    const { data: entreprise, error } = await supabase
      .from('entreprise')
      .select('*')
      .single();

    if (error) {
      console.error("❌ Erreur Supabase:", error);
      throw error;
    }

    console.log("✅ Entreprise chargée:", entreprise);

    // Afficher nom et slogan
    const nameEl = document.getElementById("company-name");
    const sloganEl = document.getElementById("company-slogan");
    
    if (nameEl) nameEl.innerText = entreprise.nom;
    if (sloganEl) sloganEl.innerText = entreprise.slogan;

    // Stocker domaine email pour validation
    window.entrepriseDomain = entreprise.domaine_email;
    
    console.log("✅ Domaine email:", window.entrepriseDomain);

  } catch (err) {
    console.error("❌ Erreur chargement entreprise:", err);
    const errorEl = document.getElementById("error");
    if (errorEl) {
      errorEl.innerText = "Erreur de connexion à la base de données. Vérifiez Supabase.";
    }
  }
}

// Gestion du formulaire de connexion
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const emailInput = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const errorEl = document.getElementById("error");

    console.log("🔐 Tentative de connexion...");
    console.log("📧 Email:", emailInput);
    
    // Réinitialiser le message d'erreur
    errorEl.innerText = "";
    errorEl.style.display = "none";

    try {
      // Récupérer tous les utilisateurs
      const { data: users, error } = await supabase
        .from('utilisateurs')
        .select('*');

      if (error) {
        console.error("❌ Erreur Supabase:", error);
        throw error;
      }

      console.log("✅ Utilisateurs chargés:", users.length);

      // Trouver l'utilisateur correspondant
      const user = users.find(u => {
        const emailReconstruit = `${u.login}@${window.entrepriseDomain}`;
        console.log(`🔍 Comparaison: ${emailReconstruit} === ${emailInput}`);
        return emailReconstruit === emailInput && u.password === password;
      });

      if (user) {
        console.log("✅ Utilisateur trouvé:", user);
        console.log("👤 Service:", user.service);
        console.log("🎯 Rôle:", user.role);
        
        // Connexion réussie - Sauvegarder l'utilisateur
        localStorage.setItem("user", JSON.stringify(user));
        
        // ═══════════════════════════════════════════════
        // REDIRECTION DYNAMIQUE SELON LE SERVICE
        // ═══════════════════════════════════════════════
        
        // Vérifier que DASHBOARD_CONFIG existe
        if (typeof DASHBOARD_CONFIG === 'undefined') {
          console.error("❌ DASHBOARD_CONFIG non chargé ! Vérifiez que config.js est bien importé.");
          errorEl.innerText = "Erreur de configuration. Contactez l'administrateur.";
          errorEl.style.display = "block";
          return;
        }
        
        // Récupérer le dashboard du service
        const serviceConfig = DASHBOARD_CONFIG[user.service];
        let dashboardUrl = "dashboard.html"; // Dashboard par défaut
        
        if (serviceConfig && serviceConfig.dashboard) {
          dashboardUrl = serviceConfig.dashboard;
          console.log(`✅ Dashboard spécifique trouvé: ${dashboardUrl}`);
        } else {
          console.warn(`⚠️ Pas de dashboard spécifique pour ${user.service}, redirection vers dashboard.html`);
        }
        
        console.log(`🚀 Redirection vers: ${dashboardUrl}`);
        
        // Redirection
        window.location.href = dashboardUrl;
        
      } else {
        console.log("❌ Aucun utilisateur correspondant");
        errorEl.innerText = "Email ou mot de passe incorrect";
        errorEl.style.display = "block";
        
        // Afficher les emails disponibles en mode debug (seulement en dev)
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          console.log("📧 Emails disponibles:");
          users.forEach(u => {
            console.log(`   - ${u.login}@${window.entrepriseDomain} (${u.service})`);
          });
        }
      }

    } catch (err) {
      console.error("❌ Erreur connexion:", err);
      errorEl.innerText = "Erreur de connexion: " + err.message;
      errorEl.style.display = "block";
    }
  });
}

// Charger la page au démarrage
if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
  console.log("🚀 Initialisation de la page de connexion...");
  
  // Vérifier que Supabase est chargé
  if (typeof supabase === 'undefined') {
    console.error("❌ ERREUR: Supabase n'est pas chargé !");
    const errorEl = document.getElementById("error");
    if (errorEl) {
      errorEl.innerText = "Erreur: SDK Supabase non chargé. Vérifiez votre connexion.";
      errorEl.style.display = "block";
    }
  } else {
    console.log("✅ SDK Supabase chargé");
    
    // Vérifier que config.js est chargé
    if (typeof DASHBOARD_CONFIG === 'undefined') {
      console.warn("⚠️ ATTENTION: config.js n'est pas chargé ! La redirection utilisera le dashboard par défaut.");
    } else {
      console.log("✅ Configuration des dashboards chargée");
    }
    
    loadLoginPage();
  }
}