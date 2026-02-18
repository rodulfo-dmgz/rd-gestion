/* ===============================
   AUTHENTIFICATION & GESTION UTILISATEUR
   =============================== */

// Chargement des données utilisateurs et entreprise
Promise.all([
  fetch("data/utilisateurs.json").then(r => r.json()),
  fetch("data/entreprise.json").then(r => r.json())
])
.then(([users, entreprise]) => {

  // ─────────────────────────────
  // Afficher nom et slogan entreprise (page login)
  // ─────────────────────────────
  if (document.getElementById("company-name")) {
    document.getElementById("company-name").innerText = entreprise.nom;
  }
  if (document.getElementById("company-slogan")) {
    document.getElementById("company-slogan").innerText = entreprise.slogan;
  }

  // ─────────────────────────────
  // Gestion du formulaire de connexion
  // ─────────────────────────────
  const loginForm = document.getElementById("loginForm");
  
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const emailInput = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      // Recherche de l'utilisateur
      const user = users.find(u => {
        const emailReconstruit = `${u.login}@${entreprise.domaineEmail}`;
        return emailReconstruit === emailInput && u.password === password;
      });

      if (user) {
        // Sauvegarde de l'utilisateur dans localStorage
        localStorage.setItem("user", JSON.stringify(user));
        
        // ─────────────────────────────
        // REDIRECTION SELON LE SERVICE
        // ─────────────────────────────
        redirectByService(user);
        
      } else {
        // Erreur d'authentification
        document.getElementById("error").innerText = "Email ou mot de passe incorrect";
      }
    });
  }

  // ─────────────────────────────
  // Fonction de redirection selon service
  // ─────────────────────────────
  function redirectByService(user) {
    // Admin a accès à tout → dashboard principal
    if (user.acces_total) {
      window.location.href = "dashboard.html";
      return;
    }

    // Redirection selon le service
    switch(user.service) {
      case "GP":  // Gestion de Paie
        window.location.href = "dashboard.html"; // ou dashboard-paie.html
        break;
      
      case "ARH": // Assistant RH
        window.location.href = "dashboard.html"; // ou dashboard-rh.html
        break;
      
      case "GCF": // Gestion Comptable et Financière
        window.location.href = "dashboard.html"; // ou dashboard-compta.html
        break;
      
      case "AC":  // Assistant Commercial
      case "CA":  // Commercial
        window.location.href = "dashboard.html"; // ou dashboard-commercial.html
        break;
      
      case "SA":  // Secrétaire Administratif
        window.location.href = "dashboard.html"; // ou dashboard-admin.html
        break;
      
      case "SC":  // Secrétaire Comptable
        window.location.href = "dashboard.html"; // ou dashboard-compta.html
        break;
      
      default:
        window.location.href = "dashboard.html";
    }
  }

})
.catch(err => console.error("Erreur chargement données :", err));


/* ===============================
   GESTION DÉCONNEXION
   =============================== */
const logoutBtn = document.getElementById("logout");

if (logoutBtn) {
  logoutBtn.onclick = () => {
    localStorage.removeItem("user");
    window.location.href = "index.html";
  };
}


/* ===============================
   AFFICHAGE INFO UTILISATEUR
   =============================== */
const userInfoElement = document.getElementById("user-info");

if (userInfoElement) {
  const user = JSON.parse(localStorage.getItem("user"));
  
  if (user) {
    // Afficher le rôle ou le service
    userInfoElement.innerText = user.service || user.role;
  }
}


/* ===============================
   AFFICHAGE NOM ENTREPRISE (SIDEBAR)
   =============================== */
const companyNameSidebar = document.getElementById("company-name");

if (companyNameSidebar && !companyNameSidebar.innerText) {
  fetch("data/entreprise.json")
    .then(r => r.json())
    .then(entreprise => {
      companyNameSidebar.innerText = entreprise.nom;
    })
    .catch(err => console.error("Erreur chargement entreprise :", err));
}