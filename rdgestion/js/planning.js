// Vérification simple de connexion
const user = JSON.parse(localStorage.getItem("user"));
if (!user) window.location.href = "../index.html";

// Afficher info utilisateur
document.getElementById("user-info").innerText = user.role;

// Déconnexion
document.getElementById("logout").onclick = () => {
  localStorage.removeItem("user");
  window.location.href = "../index.html";
};

// ─────────────────────────────
// NAVIGATION CONDITIONNELLE
// ─────────────────────────────
function generateNavigation() {
  const nav = document.getElementById("sidebar-nav");
  const modules = getAccessibleModules(user);
  
  const moduleLinks = {
    "clients": { url: "clients.html", label: "Clients", icon: "👥" },
    "produits": { url: "produits.html", label: "Produits", icon: "📦" },
    "ventes": { url: "ventes.html", label: "Ventes", icon: "💰" },
    "planning": { url: "planning.html", label: "Planning", icon: "📅" },
    "employes": { url: "salaries.html", label: "Salariés", icon: "👔" },
    "paie": { url: "paie.html", label: "Paie", icon: "💵" },
    "comptabilite": { url: "comptabilite.html", label: "Comptabilité", icon: "📊" },
    "factures": { url: "factures.html", label: "Factures", icon: "🧾" },
    "statistiques": { url: "statistiques.html", label: "Statistiques", icon: "📈" }
  };
  
  // Dashboard toujours en premier
  const dashboardLink = document.createElement("a");
  dashboardLink.href = "../dashboard.html";
  dashboardLink.innerHTML = "🏠 Dashboard";
  nav.appendChild(dashboardLink);
  
  // Créer les liens de navigation
  modules.forEach(module => {
    if (moduleLinks[module]) {
      const link = document.createElement("a");
      link.href = moduleLinks[module].url;
      link.innerHTML = `${moduleLinks[module].icon} ${moduleLinks[module].label}`;
      
      // Marquer comme actif si c'est la page actuelle
      if (window.location.pathname.includes(moduleLinks[module].url)) {
        link.classList.add("active");
      }
      
      nav.appendChild(link);
    }
  });
}

// Charger le nom de l'entreprise
fetch("../data/entreprise.json")
  .then(r => r.json())
  .then(data => document.getElementById("company-name").innerText = data.nom || "CRM");

// Générer la navigation
generateNavigation();

// ─────────────────────────────
// PLANNING - FULLCALENDAR
// ─────────────────────────────
let calendar;

document.addEventListener("DOMContentLoaded", async () => {
  const events = await loadEvents();

  const calendarEl = document.getElementById("calendar");

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    locale: "fr",
    height: "auto",
    events,
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay"
    },
    eventClick(info) {
      const modal = document.getElementById("view-event-modal");

      document.getElementById("modal-title").innerText = info.event.title;

      const start = info.event.start;
      const end = info.event.end;

      document.getElementById("modal-date").innerText =
        `${start.toLocaleDateString()} • ${start.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        })} → ${end ? end.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        }) : ''}`;

      document.getElementById("modal-desc").innerText =
        info.event.extendedProps.description || "Aucune description";

      modal.classList.remove("hidden");
      modal.style.display = "flex";
    }
  });

  calendar.render();
});

// Charger événements
async function loadEvents() {
  try {
    const res = await fetch("../data/planning.json");
    const data = await res.json();

    return data.map(e => ({
      id: e.id,
      title: e.title,
      start: `${e.start_date}T${e.start_time}`,
      end: `${e.end_date}T${e.end_time}`,
      description: e.description
    }));

  } catch (err) {
    console.error("Erreur chargement planning", err);
    return [];
  }
}

// ─────────────────────────────
// MODALS
// ─────────────────────────────

// Fermer modal vue événement
document.getElementById("close-view-modal").addEventListener("click", () => {
  const modal = document.getElementById("view-event-modal");
  modal.classList.add("hidden");
  modal.style.display = "none";
});

document.getElementById("view-event-modal").addEventListener("click", e => {
  if (e.target.id === "view-event-modal") {
    e.target.classList.add("hidden");
    e.target.style.display = "none";
  }
});

// Ouvrir modal ajout événement
document.getElementById("add-event-btn").addEventListener("click", () => {
  const modal = document.getElementById("add-event-modal");
  modal.classList.remove("hidden");
  modal.style.display = "flex";
});

// Fermer modal ajout événement
document.getElementById("close-add-modal").addEventListener("click", () => {
  const modal = document.getElementById("add-event-modal");
  modal.classList.add("hidden");
  modal.style.display = "none";
});

document.getElementById("add-event-modal").addEventListener("click", e => {
  if (e.target.id === "add-event-modal") {
    e.target.classList.add("hidden");
    e.target.style.display = "none";
  }
});

// Formulaire ajout événement
document.getElementById("event-form").addEventListener("submit", e => {
  e.preventDefault();

  const title = document.getElementById("event-title").value;
  const start = document.getElementById("event-start").value;
  const end = document.getElementById("event-end").value;
  const description = document.getElementById("event-desc").value;

  // Ajouter au calendrier
  calendar.addEvent({
    title: title,
    start: start,
    end: end,
    description: description
  });

  // Fermer modal et reset formulaire
  const modal = document.getElementById("add-event-modal");
  modal.classList.add("hidden");
  modal.style.display = "none";
  e.target.reset();
});