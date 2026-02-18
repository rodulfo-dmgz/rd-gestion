// =============================================
// DASHBOARD SA - SECRÉTARIAT ASSISTANT
// =============================================

// Vérification utilisateur connecté
const user = JSON.parse(localStorage.getItem("user"));
if (!user) {
  window.location.href = "../../index.html";
}

// Vérification des permissions SA
if (user.service !== "SA" && !user.acces_total) {
  alert("Accès non autorisé");
  window.location.href = "../../dashboard.html";
}

// ─────────────────────────────────────────────
// INITIALISATION
// ─────────────────────────────────────────────
document.getElementById("user-info").innerHTML = `<i data-lucide="user"></i> ${user.nom} - ${user.role}`;
document.getElementById("logout").onclick = () => {
  localStorage.removeItem("user");
  window.location.href = "../../index.html";
};

// Afficher la date du jour
const currentDate = new Date().toLocaleDateString('fr-FR', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
});
document.getElementById("current-date").textContent = currentDate;

// ─────────────────────────────────────────────
// NAVIGATION SIDEBAR
// ─────────────────────────────────────────────
function generateNavigation() {
  const nav = document.getElementById("sidebar-nav");
  nav.innerHTML = '';

  // Dashboard SA (actif)
  const saDashboard = document.createElement("a");
  saDashboard.href = "index-sa.html";
  saDashboard.innerHTML = '<i data-lucide="layout-grid"></i> Dashboard';
  saDashboard.classList.add("active");
  nav.appendChild(saDashboard);

  // Divider SA
  const saDivider = document.createElement("div");
  saDivider.style.cssText = "margin: 1rem 0; padding-top: 1rem; border-top: 1px solid var(--border-light); font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;";
  saDivider.innerHTML = '<i data-lucide="briefcase" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;"></i> Secrétariat';
  nav.appendChild(saDivider);

  // Modules SA
  const saModules = [
    { url: "modules/agenda.html", label: "Agenda", icon: "calendar" },
    { url: "modules/courrier.html", label: "Gestion Courrier", icon: "mail" },
    { url: "modules/communication.html", label: "Communication", icon: "phone" },
    { url: "modules/organisation.html", label: "Organisation", icon: "briefcase" },
    { url: "modules/documents.html", label: "Documents", icon: "file-text" }
  ];

  saModules.forEach(mod => {
    const link = document.createElement("a");
    link.href = mod.url;
    link.innerHTML = `<i data-lucide="${mod.icon}"></i> ${mod.label}`;
    nav.appendChild(link);
  });

  // Convertir les icônes lucide
  lucide.createIcons();
}

// ─────────────────────────────────────────────
// CHARGEMENT NOM ENTREPRISE
// ─────────────────────────────────────────────
fetch("../../data/entreprise.json")
  .then(r => r.json())
  .then(data => {
    document.getElementById("company-name").textContent = data.nom || "CRM";
  })
  .catch(err => console.error("Erreur chargement entreprise:", err));

generateNavigation();

// Icônes topbar
lucide.createIcons();

// ─────────────────────────────────────────────
// DONNÉES ET STATISTIQUES
// ─────────────────────────────────────────────
let planning = [];
let tasks = [];
let mails = [];

async function loadData() {
  try {
    // Charger le planning depuis Supabase
    const { data: planningData, error: planningError } = await supabaseClient
      .from('planning')
      .select('*')
      .order('start_date', { ascending: true });

    if (!planningError && planningData) {
      planning = planningData;
    } else {
      // Fallback vers JSON si Supabase échoue
      planning = await (await fetch("../../data/planning.json")).json();
    }

    // Simuler des tâches (à remplacer par Supabase quand table créée)
    tasks = generateMockTasks();
    
    // Simuler des courriers (à remplacer par Supabase quand table créée)
    mails = generateMockMails();
    
    calculateStats();
    displayTasks();
    displayRdv();
    displayMails();
    displayCalendar();
    displayReminders();
    
  } catch (err) {
    console.error("Erreur chargement données:", err);
  }
}

// ─────────────────────────────────────────────
// CALCUL DES STATISTIQUES
// ─────────────────────────────────────────────
function calculateStats() {
  const today = new Date().toISOString().slice(0, 10);
  
  // Rendez-vous aujourd'hui
  const rdvToday = planning.filter(p => p.start_date === today).length;
  
  // Tâches en cours
  const tasksActive = tasks.filter(t => t.status !== 'done').length;
  
  // Courriers à traiter
  const mailsPending = mails.filter(m => m.status === 'new' || m.status === 'pending').length;
  
  // Appels reçus (simulation)
  const callsToday = Math.floor(Math.random() * 15) + 5;
  
  // Animation des compteurs
  animateValue('stat-rdv', 0, rdvToday, 1000);
  animateValue('stat-tasks', 0, tasksActive, 1200);
  animateValue('stat-mails', 0, mailsPending, 1400);
  animateValue('stat-calls', 0, callsToday, 1600);
}

// Animation des valeurs numériques
function animateValue(id, start, end, duration) {
  const element = document.getElementById(id);
  const range = end - start;
  const increment = range / (duration / 16);
  let current = start;
  
  const timer = setInterval(() => {
    current += increment;
    if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
      element.textContent = end;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current);
    }
  }, 16);
}

// ─────────────────────────────────────────────
// AFFICHAGE TÂCHES
// ─────────────────────────────────────────────
function displayTasks() {
  const container = document.getElementById('tasks-list');
  container.innerHTML = '';
  
  const activeTasks = tasks.filter(t => t.status !== 'done').slice(0, 5);
  
  if (activeTasks.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">Aucune tâche en cours</p>';
    return;
  }
  
  activeTasks.forEach(task => {
    const item = document.createElement('div');
    item.className = 'task-item';
    
    const priorityClass = task.priority === 'high' ? 'priority-high' : 
                         task.priority === 'medium' ? 'priority-medium' : 'priority-low';
    
    item.innerHTML = `
      <div class="task-checkbox" onclick="toggleTask(${task.id})"></div>
      <div class="task-content">
        <h4>${task.title}</h4>
        <p>${task.description || 'Aucune description'}</p>
      </div>
      <span class="priority-badge ${priorityClass}">${getPriorityLabel(task.priority)}</span>
    `;
    container.appendChild(item);
  });
  
  lucide.createIcons();
}

function getPriorityLabel(priority) {
  const labels = {
    'high': 'Urgent',
    'medium': 'Normal',
    'low': 'Faible'
  };
  return labels[priority] || 'Normal';
}

function toggleTask(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    task.status = task.status === 'done' ? 'pending' : 'done';
    displayTasks();
    calculateStats();
  }
}

// ─────────────────────────────────────────────
// AFFICHAGE RENDEZ-VOUS
// ─────────────────────────────────────────────
function displayRdv() {
  const container = document.getElementById('rdv-list');
  container.innerHTML = '';
  
  const today = new Date();
  const upcoming = planning
    .filter(p => new Date(p.start_date) >= today)
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
    .slice(0, 5);
  
  if (upcoming.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">Aucun rendez-vous à venir</p>';
    return;
  }
  
  upcoming.forEach(rdv => {
    const item = document.createElement('div');
    item.className = 'rdv-item';
    
    const date = new Date(rdv.start_date);
    const dateStr = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    const timeStr = rdv.start_time || '09:00';
    
    item.innerHTML = `
      <div style="flex-shrink: 0; width: 60px; text-align: center; padding: 0.5rem; background: rgba(139, 92, 246, 0.1); border-radius: 8px;">
        <div style="font-size: 1.25rem; font-weight: 700; color: #8b5cf6;">${date.getDate()}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">${date.toLocaleDateString('fr-FR', { month: 'short' })}</div>
      </div>
      <div class="task-content">
        <h4>${rdv.title || 'Rendez-vous'}</h4>
        <p><i data-lucide="clock" style="width: 14px; height: 14px; display: inline; vertical-align: middle;"></i> ${timeStr} - ${rdv.description || 'Pas de description'}</p>
      </div>
    `;
    container.appendChild(item);
  });
  
  lucide.createIcons();
}

// ─────────────────────────────────────────────
// AFFICHAGE COURRIERS
// ─────────────────────────────────────────────
function displayMails() {
  const container = document.getElementById('mails-list');
  container.innerHTML = '';
  
  const recentMails = mails.slice(0, 5);
  
  if (recentMails.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">Aucun courrier récent</p>';
    return;
  }
  
  recentMails.forEach(mail => {
    const item = document.createElement('div');
    item.className = 'mail-item';
    
    const statusClass = mail.status === 'new' ? 'status-new' : 
                       mail.status === 'pending' ? 'status-pending' : 'status-done';
    
    const statusLabel = mail.status === 'new' ? 'Nouveau' : 
                       mail.status === 'pending' ? 'En cours' : 'Traité';
    
    item.innerHTML = `
      <div style="width: 40px; height: 40px; background: rgba(139, 92, 246, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #8b5cf6; flex-shrink: 0;">
        <i data-lucide="${mail.type === 'in' ? 'mail' : 'send'}"></i>
      </div>
      <div class="task-content">
        <h4>${mail.subject}</h4>
        <p>${mail.from || mail.to} - ${mail.date}</p>
      </div>
      <span class="status-badge ${statusClass}">${statusLabel}</span>
    `;
    container.appendChild(item);
  });
  
  lucide.createIcons();
}

// ─────────────────────────────────────────────
// MINI CALENDRIER
// ─────────────────────────────────────────────
function displayCalendar() {
  const container = document.getElementById('mini-calendar');
  container.innerHTML = '';
  
  // Jours de la semaine
  const dayNames = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  dayNames.forEach(day => {
    const dayHeader = document.createElement('div');
    dayHeader.style.cssText = 'font-size: 0.75rem; font-weight: 600; color: var(--text-muted); padding: 0.25rem;';
    dayHeader.textContent = day;
    container.appendChild(dayHeader);
  });
  
  // Jours du mois (Février 2026)
  const today = new Date();
  const currentDay = today.getDate();
  const daysInMonth = new Date(2026, 2, 0).getDate(); // 28 jours en février 2026
  
  // Février 2026 commence un dimanche (jour 0)
  // Ajouter des jours vides pour aligner
  for (let i = 0; i < 0; i++) {
    const emptyDay = document.createElement('div');
    container.appendChild(emptyDay);
  }
  
  // Ajouter les jours
  for (let day = 1; day <= daysInMonth; day++) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    dayElement.textContent = day;
    
    if (day === currentDay) {
      dayElement.classList.add('today');
    }
    
    // Vérifier si des rendez-vous ce jour
    const dateStr = `2026-02-${String(day).padStart(2, '0')}`;
    const hasEvent = planning.some(p => p.start_date === dateStr);
    if (hasEvent) {
      dayElement.classList.add('has-event');
    }
    
    container.appendChild(dayElement);
  }
}

// ─────────────────────────────────────────────
// AFFICHAGE RAPPELS
// ─────────────────────────────────────────────
function displayReminders() {
  const container = document.getElementById('reminders-list');
  container.innerHTML = '';
  
  const reminders = [
    { icon: 'bell', text: 'Réserver salle réunion pour jeudi', time: 'Demain' },
    { icon: 'printer', text: 'Préparer supports présentation', time: 'Vendredi' },
    { icon: 'file-check', text: 'Vérifier contrat fournisseur', time: 'Lundi prochain' }
  ];
  
  reminders.forEach(reminder => {
    const item = document.createElement('div');
    item.style.cssText = 'padding: 0.75rem; border-bottom: 1px solid var(--border-light); display: flex; align-items: center; gap: 0.75rem;';
    item.innerHTML = `
      <div style="width: 32px; height: 32px; background: rgba(139, 92, 246, 0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #8b5cf6; flex-shrink: 0;">
        <i data-lucide="${reminder.icon}" style="width: 16px; height: 16px;"></i>
      </div>
      <div style="flex: 1;">
        <p style="font-size: 0.875rem; font-weight: 500; color: var(--text-primary); margin-bottom: 0.25rem;">${reminder.text}</p>
        <p style="font-size: 0.75rem; color: var(--text-muted);">${reminder.time}</p>
      </div>
    `;
    container.appendChild(item);
  });
  
  lucide.createIcons();
}

// ─────────────────────────────────────────────
// DONNÉES MOCKÉES (à remplacer par Supabase)
// ─────────────────────────────────────────────
function generateMockTasks() {
  return [
    { id: 1, title: 'Préparer compte-rendu réunion', description: 'Direction - Budget 2026', priority: 'high', status: 'pending' },
    { id: 2, title: 'Archiver courriers janvier', description: 'Classement numérique', priority: 'medium', status: 'pending' },
    { id: 3, title: 'Réserver salle de conférence', description: 'Jeudi 14h - Présentation client', priority: 'high', status: 'pending' },
    { id: 4, title: 'Mise à jour contacts fournisseurs', description: 'Vérifier coordonnées', priority: 'low', status: 'pending' },
    { id: 5, title: 'Commander fournitures bureau', description: 'Stock papeterie bas', priority: 'medium', status: 'pending' }
  ];
}

function generateMockMails() {
  return [
    { id: 1, type: 'in', subject: 'Facture fournisseur Acme Corp', from: 'contact@acme.fr', date: '06/02/2026', status: 'new' },
    { id: 2, type: 'out', subject: 'Confirmation RDV client Martin', to: 'martin@client.fr', date: '06/02/2026', status: 'done' },
    { id: 3, type: 'in', subject: 'Demande devis matériel informatique', from: 'commercial@techstore.fr', date: '05/02/2026', status: 'pending' },
    { id: 4, type: 'in', subject: 'Invitation salon professionnel', from: 'info@salonpro.fr', date: '05/02/2026', status: 'new' },
    { id: 5, type: 'out', subject: 'Envoi compte-rendu CA', to: 'direction@entreprise.fr', date: '04/02/2026', status: 'done' }
  ];
}

// ─────────────────────────────────────────────
// INITIALISATION
// ─────────────────────────────────────────────
loadData();

// Rafraîchir les icônes Lucide
setTimeout(() => {
  lucide.createIcons();
}, 100);