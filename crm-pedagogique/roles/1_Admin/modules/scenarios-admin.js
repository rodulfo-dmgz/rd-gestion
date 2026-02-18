// =============================================
// MODULE SCENARIOS-ADMIN - GESTION SCÉNARIOS
// VERSION GITHUB PAGES
// =============================================

console.log('📍 scenarios-admin.js chargé');

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initScenariosAdmin);
} else {
  initScenariosAdmin();
}

function initScenariosAdmin() {
  console.log('🚀 Initialisation Scenarios Admin');
  
  const supabaseClient = window.supabase || window.supabaseClient;
  
  if (!supabaseClient) {
    console.error('❌ Client Supabase invalide');
    alert('Erreur: Configuration Supabase manquante');
    return;
  }

  // Vérification utilisateur admin
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || user.role !== 'admin') {
    alert('❌ Accès réservé aux administrateurs');
    window.location.href = "../../../dashboard.html";
    return;
  }

  console.log('✅ Admin connecté:', user.nom);

  document.getElementById("user-info").innerHTML = `<i data-lucide="user"></i> ${user.nom} - ${user.role}`;
  document.getElementById("logout").onclick = () => {
    localStorage.removeItem("user");
    window.location.href = "../../../index.html";
  };

  // ─────────────────────────────────────────────
  // VARIABLES GLOBALES
  // ─────────────────────────────────────────────
  let scenarios = [];
  let currentScenario = null;
  let uploadedAudioFile = null;
  const STORAGE_BUCKET = 'communications';

  // ─────────────────────────────────────────────
  // NAVIGATION
  // ─────────────────────────────────────────────
  function generateNavigation() {
    const nav = document.getElementById("sidebar-nav");
    nav.innerHTML = '';

    const dashboardLink = document.createElement("a");
    dashboardLink.href = "../../../dashboard.html";
    dashboardLink.innerHTML = '<i data-lucide="layout-dashboard"></i> Dashboard Principal';
    nav.appendChild(dashboardLink);

    const adminDivider = document.createElement("div");
    adminDivider.style.cssText = "margin: 1rem 0; padding-top: 1rem; border-top: 1px solid var(--border-light); font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;";
    adminDivider.innerHTML = '<i data-lucide="shield" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;"></i> Administration';
    nav.appendChild(adminDivider);

    const scenariosLink = document.createElement("a");
    scenariosLink.href = "scenarios-admin.html";
    scenariosLink.innerHTML = '<i data-lucide="phone"></i> Scénarios d\'appel';
    scenariosLink.classList.add("active");
    nav.appendChild(scenariosLink);

    lucide.createIcons();
  }

  fetch("../../../data/entreprise.json")
    .then(r => r.json())
    .then(data => document.getElementById("company-name").textContent = data.nom || "CRM")
    .catch(err => console.error("Erreur:", err));

  generateNavigation();
  lucide.createIcons();

  // ─────────────────────────────────────────────
  // CHARGEMENT SCÉNARIOS
  // ─────────────────────────────────────────────
  async function loadScenarios() {
    try {
      console.log('📥 Chargement des scénarios...');
      
      const { data, error } = await supabaseClient
        .from('scenarios_appel')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      scenarios = data || [];
      console.log('✅ Scénarios chargés:', scenarios.length);
      
      calculateStats();
      renderScenarios();
      
    } catch (err) {
      console.error("❌ Erreur chargement:", err);
      scenarios = [];
      calculateStats();
      renderScenarios();
    }
  }

  // ─────────────────────────────────────────────
  // STATISTIQUES
  // ─────────────────────────────────────────────
  function calculateStats() {
    const total = scenarios.length;
    const actifs = scenarios.filter(s => s.actif).length;
    const faciles = scenarios.filter(s => s.difficulte === 'facile').length;
    const difficiles = scenarios.filter(s => s.difficulte === 'difficile').length;
    
    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-actifs').textContent = actifs;
    document.getElementById('stat-faciles').textContent = faciles;
    document.getElementById('stat-difficiles').textContent = difficiles;
  }

  // ─────────────────────────────────────────────
  // RENDU TABLE
  // ─────────────────────────────────────────────
  function renderScenarios() {
    const tbody = document.getElementById('scenarios-tbody');
    tbody.innerHTML = '';

    if (scenarios.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 3rem; color: var(--text-muted);">Aucun scénario</td></tr>';
      return;
    }

    scenarios.forEach(scenario => {
      const row = document.createElement('tr');
      
      row.innerHTML = `
        <td><span class="scenario-numero">${scenario.numero_telephone}</span></td>
        <td>
          <div style="font-weight: 600; color: var(--text-primary);">${scenario.nom_contact || 'N/A'}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${scenario.entreprise || ''}</div>
        </td>
        <td><span class="scenario-type-badge type-${scenario.type_scenario}">${getTypeLabel(scenario.type_scenario)}</span></td>
        <td><span class="difficulte-badge diff-${scenario.difficulte}">${getDifficulteLabel(scenario.difficulte)}</span></td>
        <td>
          ${scenario.fichier_audio ? 
            `<span style="color: #10b981;"><i data-lucide="check-circle"></i></span>` : 
            `<span style="color: #94a3b8;"><i data-lucide="x-circle"></i></span>`
          }
        </td>
        <td>
          <div class="toggle-switch ${scenario.actif ? 'active' : ''}" onclick="toggleScenario(${scenario.id}, ${!scenario.actif})"></div>
        </td>
        <td>
          <div class="action-buttons">
            <button class="action-btn" onclick="viewScenario(${scenario.id})" title="Voir">
              <i data-lucide="eye"></i>
            </button>
            <button class="action-btn" onclick="editScenario(${scenario.id})" title="Modifier">
              <i data-lucide="edit"></i>
            </button>
            <button class="action-btn danger" onclick="deleteScenario(${scenario.id})" title="Supprimer">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </td>
      `;
      
      tbody.appendChild(row);
    });

    lucide.createIcons();
  }

  function getTypeLabel(type) {
    const labels = {
      'repondeur': 'Répondeur',
      'conversation': 'Conversation',
      'occupe': 'Occupé',
      'invalide': 'Invalide'
    };
    return labels[type] || type;
  }

  function getDifficulteLabel(diff) {
    const labels = {
      'facile': 'Facile',
      'moyen': 'Moyen',
      'difficile': 'Difficile'
    };
    return labels[diff] || diff;
  }

  // ─────────────────────────────────────────────
  // TOGGLE ACTIF/INACTIF
  // ─────────────────────────────────────────────
  window.toggleScenario = async function(id, newStatus) {
    try {
      const { error } = await supabaseClient
        .from('scenarios_appel')
        .update({ actif: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      console.log('✅ Scénario mis à jour');
      await loadScenarios();
      
    } catch (err) {
      console.error('❌ Erreur:', err);
      alert('Erreur: ' + err.message);
    }
  };

  // ─────────────────────────────────────────────
  // MODAL AJOUTER/MODIFIER
  // ─────────────────────────────────────────────
  const modal = document.getElementById('scenario-modal');
  const addBtn = document.getElementById('add-scenario-btn');
  const closeModalBtn = document.getElementById('modal-close');

  addBtn.onclick = () => {
    currentScenario = null;
    uploadedAudioFile = null;
    document.getElementById('modal-title').textContent = 'Nouveau scénario d\'appel';
    document.getElementById('scenario-form').reset();
    document.getElementById('audio-preview').classList.remove('active');
    modal.style.display = 'flex';
  };

  closeModalBtn.onclick = () => modal.style.display = 'none';
  window.onclick = e => { if (e.target === modal) modal.style.display = 'none'; };

  // ─────────────────────────────────────────────
  // UPLOAD AUDIO
  // ─────────────────────────────────────────────
  const uploadZone = document.getElementById('upload-zone');
  const audioFileInput = document.getElementById('audio-file');

  uploadZone.onclick = () => audioFileInput.click();

  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
  });

  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    handleAudioFile(file);
  });

  audioFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    handleAudioFile(file);
  });

  function handleAudioFile(file) {
    if (!file) return;
    
    if (!file.type.includes('audio')) {
      alert('⚠️ Veuillez sélectionner un fichier audio MP3');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10 MB max
      alert('⚠️ Fichier trop volumineux (max 10 MB)');
      return;
    }
    
    uploadedAudioFile = file;
    
    document.getElementById('audio-filename').textContent = file.name;
    document.getElementById('audio-filesize').textContent = formatFileSize(file.size);
    document.getElementById('audio-preview').classList.add('active');
    
    lucide.createIcons();
  }

  window.removeAudioFile = function() {
    uploadedAudioFile = null;
    audioFileInput.value = '';
    document.getElementById('audio-preview').classList.remove('active');
  };

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  // ─────────────────────────────────────────────
  // SOUMETTRE FORMULAIRE
  // ─────────────────────────────────────────────
  document.getElementById('scenario-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    console.log('💾 Enregistrement du scénario...');
    
    let fichierAudioPath = currentScenario?.fichier_audio || null;
    
    // Upload du fichier audio si présent
    if (uploadedAudioFile) {
      console.log('📤 Upload du fichier audio...');
      
      const timestamp = Date.now();
      const filename = `scenario-${timestamp}-${uploadedAudioFile.name}`;
      const filepath = `scenarios/${filename}`;
      
      try {
        const { data, error } = await supabaseClient.storage
          .from(STORAGE_BUCKET)
          .upload(filepath, uploadedAudioFile, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (error) throw error;
        
        fichierAudioPath = filepath;
        console.log('✅ Fichier uploadé:', filepath);
        
      } catch (err) {
        console.error('❌ Erreur upload:', err);
        alert('Erreur lors de l\'upload du fichier: ' + err.message);
        return;
      }
    }
    
    // Données du scénario
    const scenarioData = {
      numero_telephone: document.getElementById('scenario-numero').value,
      type_scenario: document.getElementById('scenario-type').value,
      nom_contact: document.getElementById('scenario-contact').value || null,
      entreprise: document.getElementById('scenario-entreprise').value || null,
      poste: document.getElementById('scenario-poste').value || null,
      instructions_formateur: document.getElementById('scenario-instructions').value,
      objectif_pedagogique: document.getElementById('scenario-objectif').value || null,
      difficulte: document.getElementById('scenario-difficulte').value,
      actif: document.getElementById('scenario-actif').value === 'true',
      fichier_audio: fichierAudioPath
    };
    
    console.log('📋 Données:', scenarioData);
    
    try {
      if (currentScenario) {
        // Modifier
        const { error } = await supabaseClient
          .from('scenarios_appel')
          .update(scenarioData)
          .eq('id', currentScenario.id);
        
        if (error) throw error;
        console.log('✅ Scénario modifié');
        
      } else {
        // Ajouter
        const { error } = await supabaseClient
          .from('scenarios_appel')
          .insert([scenarioData]);
        
        if (error) throw error;
        console.log('✅ Scénario ajouté');
      }
      
      modal.style.display = 'none';
      await loadScenarios();
      alert('✅ Scénario enregistré avec succès !');
      
    } catch (err) {
      console.error('❌ Erreur:', err);
      alert('Erreur lors de l\'enregistrement: ' + err.message);
    }
  });

  // ─────────────────────────────────────────────
  // VOIR DÉTAILS
  // ─────────────────────────────────────────────
  window.viewScenario = function(id) {
    const scenario = scenarios.find(s => s.id === id);
    if (!scenario) return;

    currentScenario = scenario;
    
    const body = document.getElementById('view-scenario-body');
    body.innerHTML = `
      <div>
        <p style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem;">Numéro</p>
        <p style="color: var(--text-primary); background: var(--accent-ultra-soft); padding: 0.75rem; border-radius: 8px; font-family: 'Courier New', monospace;">${scenario.numero_telephone}</p>
      </div>
      <div>
        <p style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem;">Type</p>
        <p style="color: var(--text-primary); background: var(--accent-ultra-soft); padding: 0.75rem; border-radius: 8px;">${getTypeLabel(scenario.type_scenario)}</p>
      </div>
      <div>
        <p style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem;">Contact</p>
        <p style="color: var(--text-primary); background: var(--accent-ultra-soft); padding: 0.75rem; border-radius: 8px;">${scenario.nom_contact || 'N/A'}</p>
      </div>
      <div>
        <p style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem;">Entreprise</p>
        <p style="color: var(--text-primary); background: var(--accent-ultra-soft); padding: 0.75rem; border-radius: 8px;">${scenario.entreprise || 'N/A'}</p>
      </div>
      <div>
        <p style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem;">Difficulté</p>
        <p style="color: var(--text-primary); background: var(--accent-ultra-soft); padding: 0.75rem; border-radius: 8px;">${getDifficulteLabel(scenario.difficulte)}</p>
      </div>
      <div>
        <p style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem;">Statut</p>
        <p style="color: var(--text-primary); background: var(--accent-ultra-soft); padding: 0.75rem; border-radius: 8px;">${scenario.actif ? '✅ Actif' : '❌ Inactif'}</p>
      </div>
      <div style="grid-column: 1 / -1;">
        <p style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem;">Instructions</p>
        <p style="color: var(--text-primary); background: var(--accent-ultra-soft); padding: 0.75rem; border-radius: 8px; white-space: pre-wrap;">${scenario.instructions_formateur}</p>
      </div>
      <div style="grid-column: 1 / -1;">
        <p style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem;">Objectif pédagogique</p>
        <p style="color: var(--text-primary); background: var(--accent-ultra-soft); padding: 0.75rem; border-radius: 8px;">${scenario.objectif_pedagogique || 'N/A'}</p>
      </div>
      <div style="grid-column: 1 / -1;">
        <p style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem;">Fichier audio</p>
        <p style="color: var(--text-primary); background: var(--accent-ultra-soft); padding: 0.75rem; border-radius: 8px;">${scenario.fichier_audio || 'Aucun'}</p>
      </div>
    `;
    
    document.getElementById('view-scenario-modal').style.display = 'flex';
    lucide.createIcons();
  };

  window.closeViewModal = function() {
    document.getElementById('view-scenario-modal').style.display = 'none';
  };

  // ─────────────────────────────────────────────
  // MODIFIER
  // ─────────────────────────────────────────────
  window.editScenario = function(id) {
    const scenario = scenarios.find(s => s.id === id);
    if (!scenario) return;

    currentScenario = scenario;
    uploadedAudioFile = null;
    
    document.getElementById('modal-title').textContent = 'Modifier le scénario';
    document.getElementById('scenario-numero').value = scenario.numero_telephone;
    document.getElementById('scenario-type').value = scenario.type_scenario;
    document.getElementById('scenario-contact').value = scenario.nom_contact || '';
    document.getElementById('scenario-entreprise').value = scenario.entreprise || '';
    document.getElementById('scenario-poste').value = scenario.poste || '';
    document.getElementById('scenario-instructions').value = scenario.instructions_formateur;
    document.getElementById('scenario-objectif').value = scenario.objectif_pedagogique || '';
    document.getElementById('scenario-difficulte').value = scenario.difficulte;
    document.getElementById('scenario-actif').value = scenario.actif.toString();
    
    document.getElementById('audio-preview').classList.remove('active');
    
    modal.style.display = 'flex';
  };

  window.editScenarioFromView = function() {
    closeViewModal();
    editScenario(currentScenario.id);
  };

  // ─────────────────────────────────────────────
  // SUPPRIMER
  // ─────────────────────────────────────────────
  window.deleteScenario = async function(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce scénario ?')) return;

    try {
      const { error } = await supabaseClient
        .from('scenarios_appel')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      console.log('✅ Scénario supprimé');
      await loadScenarios();
      alert('✅ Scénario supprimé');
      
    } catch (err) {
      console.error('❌ Erreur:', err);
      alert('Erreur: ' + err.message);
    }
  };

  window.deleteScenarioFromView = function() {
    closeViewModal();
    deleteScenario(currentScenario.id);
  };

  // ─────────────────────────────────────────────
  // RECHERCHE
  // ─────────────────────────────────────────────
  document.getElementById('search-scenario').addEventListener('input', (e) => {
    const search = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#scenarios-tbody tr');
    
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(search) ? '' : 'none';
    });
  });

  // ─────────────────────────────────────────────
  // INITIALISATION
  // ─────────────────────────────────────────────
  loadScenarios();
}