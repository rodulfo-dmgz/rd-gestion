// =============================================
// MODULE COMMUNICATION - WEBPHONE SIMULATOR
// VERSION GITHUB PAGES
// =============================================

console.log('📍 communication.js chargé');

// Attendre que le DOM soit prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCommunication);
} else {
  initCommunication();
}

function initCommunication() {
  console.log('🚀 Initialisation du module Communication');
  
  // Vérifier Supabase
  const supabaseClient = window.supabase || window.supabaseClient;
  
  if (!supabaseClient || typeof supabaseClient.from !== 'function') {
    console.error('❌ Client Supabase invalide');
    alert('Erreur: Configuration Supabase manquante');
    return;
  }

  // Vérification utilisateur
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    window.location.href = "../../../index.html";
    return;
  }

  console.log('✅ Utilisateur connecté:', user.nom);

  document.getElementById("user-info").innerHTML = `<i data-lucide="user"></i> ${user.nom} - ${user.role}`;
  document.getElementById("logout").onclick = () => {
    localStorage.removeItem("user");
    window.location.href = "../../../index.html";
  };

  // ─────────────────────────────────────────────
  // VARIABLES GLOBALES
  // ─────────────────────────────────────────────
  let communications = [];
  let currentNumber = '';
  let currentScenario = null;
  let callStartTime = null;
  let callTimer = null;
  let audioElement = document.getElementById('call-audio');
  let isCallActive = false;
  
  // Enregistrement vocal
  let mediaRecorder = null;
  let audioChunks = [];
  let recordedBlob = null;
  let isRecording = false;

  // Configuration Supabase Storage
  const STORAGE_BUCKET = 'Communications';
  const SUPABASE_URL = 'https://iomzcbmyzjwtswrkvxqk.supabase.co';

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

    const saDivider = document.createElement("div");
    saDivider.style.cssText = "margin: 1rem 0; padding-top: 1rem; border-top: 1px solid var(--border-light); font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;";
    saDivider.innerHTML = '<i data-lucide="briefcase" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;"></i> Secrétariat';
    nav.appendChild(saDivider);

    const saDashboard = document.createElement("a");
    saDashboard.href = "../index-sa.html";
    saDashboard.innerHTML = '<i data-lucide="layout-grid"></i> Dashboard SA';
    nav.appendChild(saDashboard);

    const saModules = [
      { url: "agenda.html", label: "Agenda", icon: "calendar" },
      { url: "courrier.html", label: "Gestion Courrier", icon: "mail" },
      { url: "communication.html", label: "Communication", icon: "phone" },
      { url: "organisation.html", label: "Organisation", icon: "briefcase" },
      { url: "documents.html", label: "Documents", icon: "file-text" }
    ];

    saModules.forEach(mod => {
      const link = document.createElement("a");
      link.href = mod.url;
      link.innerHTML = `<i data-lucide="${mod.icon}"></i> ${mod.label}`;
      if (window.location.pathname.includes(mod.url)) link.classList.add("active");
      nav.appendChild(link);
    });

    lucide.createIcons();
  }

  fetch("../../../data/entreprise.json")
    .then(r => r.json())
    .then(data => document.getElementById("company-name").textContent = data.nom || "CRM")
    .catch(err => console.error("Erreur:", err));

  generateNavigation();
  lucide.createIcons();

  // ─────────────────────────────────────────────
  // SUPPORT CLAVIER ALPHANUMÉRIQUE
  // ─────────────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    if (isCallActive) return; // Pas de saisie pendant l'appel
    
    // Touches numériques (0-9)
    if (e.key >= '0' && e.key <= '9') {
      currentNumber += e.key;
      phoneNumberDisplay.textContent = currentNumber || '—';
      
      // Animation visuelle sur la touche correspondante
      const keyElement = document.querySelector(`[data-digit="${e.key}"]`);
      if (keyElement) {
        keyElement.style.transform = 'scale(0.95)';
        keyElement.style.background = 'rgba(139, 92, 246, 0.2)';
        setTimeout(() => {
          keyElement.style.transform = '';
          keyElement.style.background = '';
        }, 200);
      }
    }
    
    // Touche * et #
    if (e.key === '*' || e.key === '#') {
      currentNumber += e.key;
      phoneNumberDisplay.textContent = currentNumber || '—';
      
      const keyElement = document.querySelector(`[data-digit="${e.key}"]`);
      if (keyElement) {
        keyElement.style.transform = 'scale(0.95)';
        keyElement.style.background = 'rgba(139, 92, 246, 0.2)';
        setTimeout(() => {
          keyElement.style.transform = '';
          keyElement.style.background = '';
        }, 200);
      }
    }
    
    // Backspace pour effacer
    if (e.key === 'Backspace') {
      currentNumber = currentNumber.slice(0, -1);
      phoneNumberDisplay.textContent = currentNumber || '—';
    }
    
    // Entrée pour appeler
    if (e.key === 'Enter' && currentNumber.length >= 10) {
      document.getElementById('btn-call').click();
    }
    
    // Escape pour effacer
    if (e.key === 'Escape') {
      document.getElementById('btn-clear').click();
    }
  });

  // ─────────────────────────────────────────────
  // WEBPHONE - CLAVIER NUMÉRIQUE
  // ─────────────────────────────────────────────
  const phoneNumberDisplay = document.getElementById('phone-number');
  const phoneStatus = document.getElementById('phone-status');
  
  // Gérer les touches du clavier
  document.querySelectorAll('.key').forEach(key => {
    key.addEventListener('click', function() {
      if (isCallActive) return; // Pas de saisie pendant l'appel
      
      const digit = this.dataset.digit;
      currentNumber += digit;
      phoneNumberDisplay.textContent = currentNumber || '—';
      
      // Animation touche
      this.style.transform = 'scale(0.95)';
      setTimeout(() => this.style.transform = '', 100);
    });
  });

  // Bouton Effacer
  document.getElementById('btn-clear').addEventListener('click', () => {
    currentNumber = '';
    phoneNumberDisplay.textContent = '—';
    phoneStatus.textContent = 'En attente';
  });

  // ─────────────────────────────────────────────
  // LANCER UN APPEL
  // ─────────────────────────────────────────────
  document.getElementById('btn-call').addEventListener('click', async () => {
    if (!currentNumber || currentNumber.length < 10) {
      alert('Veuillez composer un numéro valide (10 chiffres)');
      return;
    }

    console.log('📞 Appel vers:', currentNumber);
    
    // Désactiver le bouton appeler
    document.getElementById('btn-call').disabled = true;
    document.getElementById('btn-hangup').disabled = false;
    isCallActive = true;
    
    phoneStatus.textContent = 'Recherche du numéro...';

    try {
      // Rechercher le scénario dans la base
      const { data: scenario, error } = await supabaseClient
        .from('scenarios_appel')
        .select('*')
        .eq('numero_telephone', currentNumber)
        .eq('actif', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (scenario) {
        console.log('✅ Scénario trouvé:', scenario);
        currentScenario = scenario;
        await startCall(scenario);
      } else {
        // Numéro non trouvé → scénario invalide par défaut
        console.log('⚠️ Numéro non trouvé → scénario invalide');
        currentScenario = {
          type_scenario: 'invalide',
          fichier_audio: 'scenarios/numero-invalide.mp3',
          nom_contact: 'Numéro inconnu',
          instructions_formateur: 'Ce numéro n\'est pas dans la base. Vérifier les coordonnées du client.'
        };
        await startCall(currentScenario);
      }
      
    } catch (err) {
      console.error('❌ Erreur lors de l\'appel:', err);
      phoneStatus.textContent = 'Erreur';
      resetCall();
      alert('Erreur lors de l\'appel: ' + err.message);
    }
  });

  // ─────────────────────────────────────────────
  // DÉMARRER L'APPEL
  // ─────────────────────────────────────────────
  async function startCall(scenario) {
    phoneStatus.textContent = 'Appel en cours...';
    
    // Ouvrir la modal d'appel
    document.getElementById('call-modal-overlay').classList.add('active');
    document.getElementById('call-modal').classList.add('active');
    
    // Afficher les infos
    document.getElementById('modal-contact-name').textContent = scenario.nom_contact || 'Appel en cours';
    document.getElementById('modal-phone-number').textContent = currentNumber;
    
    // Afficher les instructions pédagogiques
    if (scenario.instructions_formateur) {
      document.getElementById('pedagogical-box').style.display = 'block';
      document.getElementById('pedagogical-text').textContent = scenario.instructions_formateur;
    }
    
    // Simuler la sonnerie avec wait.mp3
    document.getElementById('calling-indicator').style.display = 'flex';
    phoneStatus.textContent = 'Sonnerie...';
    
    // Jouer le son d'attente
    await playWaitingSound();
    
    // Attendre 3 secondes
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Démarrer le chronomètre
    callStartTime = Date.now();
    startCallTimer();
    
    // Masquer l'indicateur d'appel
    document.getElementById('calling-indicator').style.display = 'none';
    
    // Charger et jouer l'audio du scénario
    await playScenarioAudio(scenario);
  }

  // ─────────────────────────────────────────────
  // JOUER SON D'ATTENTE
  // ─────────────────────────────────────────────
  async function playWaitingSound() {
    // Durée aléatoire entre 4 et 7 secondes
    const waitDuration = Math.floor(Math.random() * 3000) + 4000; // 4000-7000 ms
    
    const waitAudioUrl = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/scenarios/wait.wav`;
    
    console.log(`📞 Sonnerie d'attente pendant ${waitDuration/1000} secondes`);
    console.log('🔊 URL:', waitAudioUrl);
    
    return new Promise((resolve) => {
      const waitAudio = new Audio(waitAudioUrl);
      waitAudio.volume = 0.5; // Volume réduit pour la sonnerie
      
      // Timer pour arrêter la sonnerie après 4-7 secondes
      const stopTimer = setTimeout(() => {
        waitAudio.pause();
        waitAudio.currentTime = 0;
        console.log('✅ Sonnerie arrêtée après', waitDuration/1000, 'secondes');
        resolve();
      }, waitDuration);
      
      waitAudio.onended = () => {
        clearTimeout(stopTimer);
        console.log('✅ Sonnerie terminée naturellement');
        resolve();
      };
      
      waitAudio.onerror = () => {
        clearTimeout(stopTimer);
        console.warn('⚠️ Fichier wait.wav non trouvé, passage au scénario');
        resolve(); // Continuer même si wait.wav n'existe pas
      };
      
      waitAudio.play().catch(err => {
        clearTimeout(stopTimer);
        console.warn('⚠️ Impossible de jouer wait.wav:', err);
        resolve();
      });
    });
  }

  // ─────────────────────────────────────────────
  // JOUER L'AUDIO DU SCÉNARIO
  // ─────────────────────────────────────────────
  async function playScenarioAudio(scenario) {
    if (!scenario.fichier_audio) {
      console.warn('⚠️ Pas de fichier audio pour ce scénario');
      phoneStatus.textContent = getScenarioStatusText(scenario.type_scenario);
      showActionButtons(scenario);
      return;
    }

    // Construire l'URL du fichier audio
    const audioUrl = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${scenario.fichier_audio}`;
    
    console.log('🔊 Chargement audio:', audioUrl);
    console.log('📂 Bucket:', STORAGE_BUCKET);
    console.log('📄 Fichier:', scenario.fichier_audio);
    console.log('🌐 URL complète:', audioUrl);
    
    // Tester si l'URL est accessible
    try {
      const testResponse = await fetch(audioUrl, { method: 'HEAD' });
      console.log('📡 Statut HTTP:', testResponse.status);
      if (!testResponse.ok) {
        console.error('❌ Fichier non accessible:', testResponse.status, testResponse.statusText);
        alert(`⚠️ Fichier audio non trouvé (${testResponse.status})\nURL: ${audioUrl}\n\nVérifiez que le bucket est public et que le fichier existe.`);
        showActionButtons(scenario);
        return;
      }
    } catch (err) {
      console.error('❌ Erreur test URL:', err);
    }
    
    audioElement.src = audioUrl;
    
    // Afficher le lecteur audio
    document.getElementById('audio-player').style.display = 'block';
    
    // Durée aléatoire entre 4 et 7 secondes
    const playDuration = Math.floor(Math.random() * 4000) + 4000; // 4000-7000 ms
    console.log(`⏱️ Lecture de l'audio pendant ${playDuration/1000} secondes`);
    
    // Gérer les événements audio
    audioElement.onloadedmetadata = () => {
      console.log('✅ Audio chargé, durée totale:', audioElement.duration);
      updateAudioTime();
    };
    
    audioElement.onerror = () => {
      console.error('❌ Erreur chargement audio');
      phoneStatus.textContent = 'Audio indisponible';
      showActionButtons(scenario);
    };
    
    // Jouer l'audio
    audioElement.play().catch(err => {
      console.error('❌ Erreur lecture audio:', err);
    });
    
    // Bouton play/pause
    const playBtn = document.getElementById('audio-play');
    const playIcon = playBtn.querySelector('i');
    
    playBtn.onclick = () => {
      if (audioElement.paused) {
        audioElement.play();
        playIcon.setAttribute('data-lucide', 'pause');
        lucide.createIcons();
      } else {
        audioElement.pause();
        playIcon.setAttribute('data-lucide', 'play');
        lucide.createIcons();
      }
    };
    
    // Progress bar
    const progressBar = document.getElementById('audio-progress');
    progressBar.oninput = () => {
      const time = (progressBar.value / 100) * audioElement.duration;
      audioElement.currentTime = time;
    };
    
    audioElement.ontimeupdate = () => {
      const progress = (audioElement.currentTime / audioElement.duration) * 100;
      progressBar.value = progress;
      updateAudioTime();
    };
    
    // Mettre à jour le statut
    phoneStatus.textContent = getScenarioStatusText(scenario.type_scenario);
    
    // Arrêter l'audio après 4-7 secondes et afficher les boutons d'action
    setTimeout(() => {
      console.log('⏹️ Fin de l\'extrait audio, affichage des actions');
      audioElement.pause();
      showActionButtons(scenario);
    }, playDuration);
  }

  // ─────────────────────────────────────────────
  // AFFICHER LES BOUTONS D'ACTION SELON LE SCÉNARIO
  // ─────────────────────────────────────────────
  function showActionButtons(scenario) {
    const actionsContainer = document.getElementById('scenario-actions');
    actionsContainer.style.display = 'flex';
    actionsContainer.innerHTML = '';
    
    if (scenario.type_scenario === 'repondeur') {
      // Répondeur : 2 boutons
      actionsContainer.innerHTML = `
        <button onclick="leaveMessage()" style="flex: 1; background: #10b981; color: white; padding: 1rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
          <i data-lucide="mic"></i> Laisser un message
        </button>
        <button onclick="hangupCall()" style="flex: 1; background: #ef4444; color: white; padding: 1rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
          <i data-lucide="phone-off"></i> Raccrocher
        </button>
      `;
    } else {
      // Autre scénario : juste raccrocher
      actionsContainer.innerHTML = `
        <button onclick="hangupCall()" style="width: 100%; background: #ef4444; color: white; padding: 1rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
          <i data-lucide="phone-off"></i> Raccrocher
        </button>
      `;
    }
    
    lucide.createIcons();
  }

  // ─────────────────────────────────────────────
  // LAISSER UN MESSAGE (Répondeur)
  // ─────────────────────────────────────────────
  window.leaveMessage = async function() {
    console.log('💬 Laisser un message vocal');
    
    // Masquer les boutons d'action
    document.getElementById('scenario-actions').style.display = 'none';
    
    // Afficher les contrôles d'enregistrement
    document.getElementById('recording-controls').style.display = 'block';
    
    // Afficher un message d'info
    phoneStatus.textContent = '🎤 Enregistrement de votre message...';
    
    // Démarrer automatiquement l'enregistrement
    await startRecording();
    
    // Mettre à jour le statut après le démarrage
    phoneStatus.textContent = '🔴 MESSAGE EN COURS D\'ENREGISTREMENT';
  };

  function getScenarioStatusText(type) {
    const statuses = {
      'repondeur': '📞 Répondeur',
      'conversation': '👤 En conversation',
      'occupe': '🔴 Ligne occupée',
      'invalide': '⚠️ Numéro invalide'
    };
    return statuses[type] || 'En cours';
  }

  function updateAudioTime() {
    const current = formatTime(audioElement.currentTime);
    const total = formatTime(audioElement.duration);
    document.getElementById('audio-time').textContent = `${current} / ${total}`;
  }

  function formatTime(seconds) {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  // ─────────────────────────────────────────────
  // CHRONOMÈTRE D'APPEL
  // ─────────────────────────────────────────────
  function startCallTimer() {
    const timerDisplay = document.getElementById('phone-timer');
    timerDisplay.style.display = 'block';
    
    callTimer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;
      timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }, 1000);
  }

  function stopCallTimer() {
    if (callTimer) {
      clearInterval(callTimer);
      callTimer = null;
    }
    document.getElementById('phone-timer').style.display = 'none';
  }

  // ─────────────────────────────────────────────
// LAISSER UN MESSAGE (Répondeur) - CORRIGÉ
// ─────────────────────────────────────────────
window.leaveMessage = async function() {
  console.log('💬 Laisser un message vocal');
  
  // Masquer les boutons d'action
  document.getElementById('scenario-actions').style.display = 'none';
  
  // Afficher les contrôles d'enregistrement
  document.getElementById('recording-controls').style.display = 'block';
  
  // S'assurer que tous les boutons sont dans le bon état initial
  document.getElementById('btn-start-recording').style.display = 'inline-block';
  document.getElementById('btn-stop-recording').style.display = 'none';
  document.getElementById('recording-indicator').style.display = 'none';
  document.getElementById('recording-preview').style.display = 'none';
  
  // Afficher un message d'info
  phoneStatus.textContent = '🎤 Prêt à enregistrer';
  
  // N'appeler startRecording() qu'après avoir cliqué sur le bouton
  // Laissez l'utilisateur cliquer manuellement sur "Démarrer l'enregistrement"
};

// ─────────────────────────────────────────────
// DÉMARRER L'ENREGISTREMENT - CORRIGÉ
// ─────────────────────────────────────────────
window.startRecording = async function() {
  try {
    console.log('🎤 Demande d\'accès au microphone...');
    
    // S'assurer que mediaRecorder est réinitialisé
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      console.log('⏹️ Arrêt de l\'enregistrement en cours');
      mediaRecorder.stop();
    }
    
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100
      }
    });
    
    // Options pour un meilleur format audio
    const options = { 
      mimeType: 'audio/webm;codecs=opus',
      audioBitsPerSecond: 128000
    };
    
    mediaRecorder = new MediaRecorder(stream, options);
    audioChunks = [];
    isRecording = true;
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
        console.log('📊 Données audio reçues:', event.data.size, 'bytes');
      }
    };
    
    mediaRecorder.onstop = () => {
      console.log('⏹️ Enregistrement arrêté');
      isRecording = false;
      
      if (audioChunks.length > 0) {
        recordedBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });
        console.log('✅ Enregistrement terminé:', recordedBlob.size, 'bytes');
        
        // Afficher le lecteur de prévisualisation
        const audioUrl = URL.createObjectURL(recordedBlob);
        const recordedAudio = document.getElementById('recorded-audio');
        recordedAudio.src = audioUrl;
        recordedAudio.onloadedmetadata = () => {
          console.log('🎵 Audio chargé, durée:', recordedAudio.duration, 'secondes');
        };
        
        document.getElementById('recording-preview').style.display = 'block';
        
        // Arrêter le stream
        stream.getTracks().forEach(track => {
          track.stop();
          console.log('🎤 Piste audio arrêtée');
        });
      } else {
        console.warn('⚠️ Aucune donnée audio enregistrée');
        alert('Aucun son n\'a été enregistré. Vérifiez votre microphone.');
      }
    };
    
    mediaRecorder.onerror = (event) => {
      console.error('❌ Erreur MediaRecorder:', event.error);
      isRecording = false;
      alert('Erreur lors de l\'enregistrement: ' + event.error.message);
    };
    
    // Démarrer l'enregistrement
    mediaRecorder.start(100); // Collecter des données toutes les 100ms
    console.log('🔴 Enregistrement démarré, état:', mediaRecorder.state);
    
    // Mettre à jour l'UI
    document.getElementById('btn-start-recording').style.display = 'none';
    document.getElementById('btn-stop-recording').style.display = 'inline-block';
    document.getElementById('recording-indicator').style.display = 'flex';
    phoneStatus.textContent = '🔴 ENREGISTREMENT EN COURS...';
    
  } catch (err) {
    console.error('❌ Erreur accès micro:', err);
    isRecording = false;
    
    // Réinitialiser l'UI en cas d'erreur
    document.getElementById('btn-start-recording').style.display = 'inline-block';
    document.getElementById('btn-stop-recording').style.display = 'none';
    document.getElementById('recording-indicator').style.display = 'none';
    
    alert('❌ IMPOSSIBLE D\'ACCÉDER AU MICROPHONE\n\n' +
          '1. Vérifiez que votre microphone est connecté\n' +
          '2. Autorisez l\'accès au microphone dans votre navigateur\n' +
          '3. Actualisez la page et réessayez\n\n' +
          'Erreur technique: ' + err.message);
  }
};

// ─────────────────────────────────────────────
// ARRÊTER L'ENREGISTREMENT - CORRIGÉ
// ─────────────────────────────────────────────
window.stopRecording = function() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    console.log('⏹️ Arrêt manuel de l\'enregistrement');
    mediaRecorder.stop();
    isRecording = false;
    
    // Mettre à jour l'UI
    document.getElementById('btn-start-recording').style.display = 'inline-block';
    document.getElementById('btn-stop-recording').style.display = 'none';
    document.getElementById('recording-indicator').style.display = 'none';
    phoneStatus.textContent = '✅ ENREGISTREMENT TERMINÉ';
    
  } else {
    console.warn('⚠️ Aucun enregistrement en cours à arrêter');
  }
};

// ─────────────────────────────────────────────
// SUPPRIMER L'ENREGISTREMENT - CORRIGÉ
// ─────────────────────────────────────────────
window.deleteRecording = function() {
  recordedBlob = null;
  audioChunks = [];
  document.getElementById('recording-preview').style.display = 'none';
  
  // Réinitialiser l'élément audio
  const recordedAudio = document.getElementById('recorded-audio');
  recordedAudio.src = '';
  recordedAudio.load();
  
  console.log('🗑️ Enregistrement supprimé');
  phoneStatus.textContent = '🎤 Prêt à enregistrer';
};

  // ─────────────────────────────────────────────
  // AFFICHER FORMULAIRE NOTES
  // ─────────────────────────────────────────────
  function showNotesForm() {
    document.getElementById('scenario-actions').style.display = 'none';
    document.getElementById('notes-form').style.display = 'block';
    phoneStatus.textContent = 'Appel terminé';
  }

  // ─────────────────────────────────────────────
  // RACCROCHER (Bouton d'action)
  // ─────────────────────────────────────────────
  window.hangupCall = function() {
    console.log('📴 Raccrochage de l\'appel');
    
    // Arrêter l'audio
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
    
    // Arrêter l'enregistrement s'il est en cours
    if (isRecording) {
      stopRecording();
    }
    
    // Afficher le formulaire de notes
    showNotesForm();
  };

  // ─────────────────────────────────────────────
  // SAUVEGARDER LES NOTES (Avec confirmation)
  // ─────────────────────────────────────────────
  window.saveCallNotes = async function() {
    const notes = document.getElementById('call-notes').value;
    const callDuration = callStartTime ? Math.floor((Date.now() - callStartTime) / 1000) : 0;
    
    // Afficher modal de confirmation
    const confirmSave = confirm(`
📞 CONFIRMER L'ENREGISTREMENT DE L'APPEL

📋 Informations :
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Contact : ${currentScenario?.nom_contact || 'Inconnu'}
🏢 Entreprise : ${currentScenario?.entreprise || 'N/A'}
📞 Numéro : ${currentNumber}
🎯 Scénario : ${currentScenario?.type_scenario || 'N/A'}
⏱️ Durée : ${Math.ceil(callDuration / 60)} minutes
🎤 Audio : ${recordedBlob ? 'Oui (' + (recordedBlob.size / 1024).toFixed(2) + ' KB)' : 'Non'}
📝 Notes : ${notes ? notes.substring(0, 50) + (notes.length > 50 ? '...' : '') : 'Aucune'}

Voulez-vous enregistrer cette communication ?
    `);
    
    if (!confirmSave) {
      console.log('❌ Sauvegarde annulée par l\'utilisateur');
      return;
    }
    
    console.log('💾 Sauvegarde de la communication...');
    console.log('📋 Notes:', notes);
    console.log('⏱️ Durée:', callDuration, 'secondes');
    console.log('🎯 Scénario:', currentScenario);
    console.log('🎤 Enregistrement vocal:', recordedBlob ? 'Oui' : 'Non');
    
    let fichierAudioPath = null;
    
    // Upload de l'enregistrement vocal si présent
    if (recordedBlob) {
      console.log('📤 Upload de l\'enregistrement vocal...');
      
      try {
        const timestamp = Date.now();
        const filename = `reponse-stagiaire-${user.id}-${timestamp}.webm`;
        const filepath = `enregistrements/${filename}`;
        
        const { data, error } = await supabaseClient.storage
          .from(STORAGE_BUCKET)
          .upload(filepath, recordedBlob, {
            contentType: 'audio/webm',
            cacheControl: '3600',
            upsert: false
          });
        
        if (error) {
          console.error('❌ Erreur upload:', error);
          throw error;
        }
        
        fichierAudioPath = filepath;
        console.log('✅ Enregistrement uploadé:', filepath);
        
      } catch (err) {
        console.error('❌ Erreur upload audio:', err);
        alert('⚠️ Impossible de sauvegarder l\'enregistrement vocal: ' + err.message);
        // Continuer quand même sans l'audio
      }
    }
    
    const commData = {
      type: 'appel_sortant',
      date_heure: new Date().toISOString(),
      contact_nom: currentScenario?.nom_contact || 'Inconnu',
      contact_entreprise: currentScenario?.entreprise || null,
      contact_telephone: currentNumber,
      objet: `Appel ${currentScenario?.type_scenario || 'sortant'}`,
      message: notes || 'Aucune note',
      duree_minutes: Math.ceil(callDuration / 60),
      status: 'nouveau',
      priority: 'normal',
      traite_par: user.id,
      fichier_url: fichierAudioPath, // Lien vers l'enregistrement vocal
      notes: `Scénario: ${currentScenario?.type_scenario || 'N/A'}\nDifficulté: ${currentScenario?.difficulte || 'N/A'}\nInstructions: ${currentScenario?.instructions_formateur || 'N/A'}${fichierAudioPath ? '\n🎤 Réponse vocale enregistrée' : ''}`
    };
    
    console.log('📤 Données à enregistrer:', commData);
    
    try {
      const { data, error } = await supabaseClient
        .from('communication')
        .insert([commData])
        .select();
      
      if (error) {
        console.error('❌ Erreur Supabase:', error);
        throw error;
      }
      
      console.log('✅ Communication sauvegardée:', data);
      alert(`✅ COMMUNICATION ENREGISTRÉE AVEC SUCCÈS !

📋 Résumé :
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 ${currentScenario?.nom_contact || 'Inconnu'}
📞 ${currentNumber}
⏱️ ${Math.ceil(callDuration / 60)} minutes
${fichierAudioPath ? '🎤 Réponse vocale sauvegardée' : '📝 Notes enregistrées'}

ID : #${data[0].id}
      `);
      
      closeCallModal();
      await loadCommunications();
      
    } catch (err) {
      console.error('❌ Erreur sauvegarde complète:', err);
      alert('❌ ERREUR lors de la sauvegarde:\n\n' + err.message);
    }
  };

  // ─────────────────────────────────────────────
  // BOUTON RACCROCHER (Désactivé - utiliser les boutons dans la modal)
  // ─────────────────────────────────────────────
  document.getElementById('btn-hangup').addEventListener('click', () => {
    // Fonction déplacée dans la modal
    console.log('⚠️ Utiliser les boutons dans la modal d\'appel');
  });

  // ─────────────────────────────────────────────
  // FERMER MODAL ET RESET
  // ─────────────────────────────────────────────
  window.closeCallModal = function() {
    document.getElementById('call-modal-overlay').classList.remove('active');
    document.getElementById('call-modal').classList.remove('active');
    
    // Reset
    resetCall();
  };

  function resetCall() {
    // Reset variables
    isCallActive = false;
    currentScenario = null;
    currentNumber = '';
    recordedBlob = null;
    isRecording = false;
    
    // Reset UI
    phoneNumberDisplay.textContent = '—';
    phoneStatus.textContent = 'En attente';
    document.getElementById('btn-call').disabled = false;
    document.getElementById('btn-hangup').disabled = true;
    
    // Reset modal
    document.getElementById('pedagogical-box').style.display = 'none';
    document.getElementById('audio-player').style.display = 'none';
    document.getElementById('scenario-actions').style.display = 'none';
    document.getElementById('notes-form').style.display = 'none';
    document.getElementById('call-notes').value = '';
    
    // Reset enregistrement
    document.getElementById('recording-controls').style.display = 'none';
    document.getElementById('btn-start-recording').addEventListener('click', async (e) => {
  e.preventDefault();
  await window.startRecording();
});

document.getElementById('btn-stop-recording').addEventListener('click', (e) => {
  e.preventDefault();
  window.stopRecording();
});

// Gérer la fin de l'enregistrement quand l'utilisateur quitte la page
window.addEventListener('beforeunload', () => {
  if (isRecording && mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    console.log('⏹️ Enregistrement arrêté (page quittée)');
  }
});
    document.getElementById('btn-stop-recording').style.display = 'none';
    document.getElementById('recording-indicator').style.display = 'none';
    
    // Reset audio
    if (audioElement) {
      audioElement.pause();
      audioElement.src = '';
    }
    
    // Reset timer
    stopCallTimer();
    
    lucide.createIcons();
  }

  // ─────────────────────────────────────────────
  // CHARGER COMMUNICATIONS
  // ─────────────────────────────────────────────
  async function loadCommunications() {
    try {
      console.log('📥 Chargement des communications...');
      
      const { data, error } = await supabaseClient
        .from('communication')
        .select('*')
        .order('date_heure', { ascending: false })
        .limit(20);

      if (error) throw error;

      communications = data || [];
      console.log('✅ Communications chargées:', communications.length);
      
      renderCommunications();
      
    } catch (err) {
      console.error("❌ Erreur chargement communications:", err);
      communications = [];
      renderCommunications();
    }
  }

  // ─────────────────────────────────────────────
  // AFFICHER COMMUNICATIONS
  // ─────────────────────────────────────────────
  function renderCommunications() {
    const container = document.getElementById('comm-container');
    container.innerHTML = '';

    if (communications.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 3rem;">Aucune communication</p>';
      return;
    }

    communications.forEach(comm => {
      const item = document.createElement('div');
      item.className = 'comm-item';
      
      const icon = getCommIcon(comm.type);
      const badge = getCommBadge(comm.status);
      
      item.innerHTML = `
        <div class="comm-icon ${comm.type}">
          <i data-lucide="${icon}"></i>
        </div>
        <div class="comm-content">
          <div class="comm-header">
            <span class="comm-name">${comm.contact_nom}</span>
            <span class="comm-badge badge-${comm.status}">${badge}</span>
          </div>
          <div class="comm-subject">${comm.objet || 'Sans objet'}</div>
          <div class="comm-meta">
            <span><i data-lucide="building"></i> ${comm.contact_entreprise || 'N/A'}</span>
            <span><i data-lucide="phone"></i> ${comm.contact_telephone || 'N/A'}</span>
            <span><i data-lucide="clock"></i> ${comm.duree_minutes || 0} min</span>
            <span><i data-lucide="calendar"></i> ${new Date(comm.date_heure).toLocaleDateString('fr-FR')}</span>
          </div>
        </div>
      `;
      
      // Click pour voir les détails
      item.onclick = () => viewCommunicationDetails(comm);
      
      container.appendChild(item);
    });

    lucide.createIcons();
  }

  // ─────────────────────────────────────────────
  // AFFICHER DÉTAILS COMMUNICATION
  // ─────────────────────────────────────────────
  window.viewCommunicationDetails = function(comm) {
    const detailsModal = document.getElementById('comm-details-modal');
    const detailsBody = document.getElementById('comm-details-body');
    
    detailsBody.innerHTML = `
      <div>
        <p style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem;">Contact</p>
        <p style="color: var(--text-primary); background: var(--accent-ultra-soft); padding: 0.75rem; border-radius: 8px;">${comm.contact_nom}</p>
      </div>
      <div>
        <p style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem;">Entreprise</p>
        <p style="color: var(--text-primary); background: var(--accent-ultra-soft); padding: 0.75rem; border-radius: 8px;">${comm.contact_entreprise || 'N/A'}</p>
      </div>
      <div>
        <p style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem;">Téléphone</p>
        <p style="color: var(--text-primary); background: var(--accent-ultra-soft); padding: 0.75rem; border-radius: 8px;">${comm.contact_telephone || 'N/A'}</p>
      </div>
      <div>
        <p style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem;">Type</p>
        <p style="color: var(--text-primary); background: var(--accent-ultra-soft); padding: 0.75rem; border-radius: 8px;">${getCommTypeLabel(comm.type)}</p>
      </div>
      <div>
        <p style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem;">Date & Heure</p>
        <p style="color: var(--text-primary); background: var(--accent-ultra-soft); padding: 0.75rem; border-radius: 8px;">${new Date(comm.date_heure).toLocaleString('fr-FR')}</p>
      </div>
      <div>
        <p style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem;">Durée</p>
        <p style="color: var(--text-primary); background: var(--accent-ultra-soft); padding: 0.75rem; border-radius: 8px;">${comm.duree_minutes || 0} minutes</p>
      </div>
      <div style="grid-column: 1 / -1;">
        <p style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem;">Objet</p>
        <p style="color: var(--text-primary); background: var(--accent-ultra-soft); padding: 0.75rem; border-radius: 8px;">${comm.objet || 'Sans objet'}</p>
      </div>
      <div style="grid-column: 1 / -1;">
        <p style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem;">Message / Notes</p>
        <p style="color: var(--text-primary); background: var(--accent-ultra-soft); padding: 0.75rem; border-radius: 8px; white-space: pre-wrap;">${comm.message || 'Aucun message'}</p>
      </div>
      <div>
        <p style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem;">Statut</p>
        <p style="color: var(--text-primary); background: var(--accent-ultra-soft); padding: 0.75rem; border-radius: 8px;">${getCommBadge(comm.status)}</p>
      </div>
      <div>
        <p style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem;">Traité par</p>
        <p style="color: var(--text-primary); background: var(--accent-ultra-soft); padding: 0.75rem; border-radius: 8px;">${comm.traite_par ? `Utilisateur #${comm.traite_par}` : 'Non traité'}</p>
      </div>
    `;
    
    // Boutons d'action
    const actionsDiv = document.getElementById('comm-details-actions');
    if (comm.status !== 'traite') {
      actionsDiv.innerHTML = `
        <button onclick="markAsProcessed(${comm.id})" style="background: #10b981; color: white; flex: 1;">
          <i data-lucide="check"></i> Marquer comme traité
        </button>
        <button onclick="closeCommDetailsModal()" style="background: var(--border-light); color: var(--text-muted);">
          Fermer
        </button>
      `;
    } else {
      actionsDiv.innerHTML = `
        <button onclick="closeCommDetailsModal()" style="background: var(--border-light); color: var(--text-muted); width: 100%;">
          Fermer
        </button>
      `;
    }
    
    detailsModal.style.display = 'flex';
    lucide.createIcons();
  };

  function getCommTypeLabel(type) {
    const labels = {
      'appel_entrant': '📞 Appel entrant',
      'appel_sortant': '📞 Appel sortant',
      'email': '📧 Email',
      'message': '💬 Message'
    };
    return labels[type] || type;
  }

  // ─────────────────────────────────────────────
  // MARQUER COMME TRAITÉ
  // ─────────────────────────────────────────────
  window.markAsProcessed = async function(commId) {
    try {
      console.log('✅ Marquage comme traité:', commId);
      
      const { error } = await supabaseClient
        .from('communication')
        .update({ 
          status: 'traite',
          traite_par: user.id
        })
        .eq('id', commId);
      
      if (error) throw error;
      
      console.log('✅ Communication marquée comme traitée');
      alert('✅ Communication marquée comme traitée !');
      
      closeCommDetailsModal();
      await loadCommunications();
      
    } catch (err) {
      console.error('❌ Erreur:', err);
      alert('Erreur: ' + err.message);
    }
  };

  window.closeCommDetailsModal = function() {
    document.getElementById('comm-details-modal').style.display = 'none';
  };

  function getCommIcon(type) {
    const icons = {
      'appel_entrant': 'phone-incoming',
      'appel_sortant': 'phone-outgoing',
      'email': 'mail',
      'message': 'message-square'
    };
    return icons[type] || 'phone';
  }

  function getCommBadge(status) {
    const badges = {
      'nouveau': 'Nouveau',
      'traite': 'Traité',
      'rappeler': 'À rappeler',
      'archive': 'Archivé'
    };
    return badges[status] || status;
  }

  // ─────────────────────────────────────────────
  // MODAL AJOUT COMMUNICATION MANUELLE
  // ─────────────────────────────────────────────
  const modal = document.getElementById('comm-modal');
  const addBtn = document.getElementById('add-comm-btn');
  const closeModal = document.getElementById('modal-close');

  if (addBtn) {
    addBtn.onclick = () => {
      modal.style.display = 'flex';
    };
  }

  if (closeModal) {
    closeModal.onclick = () => modal.style.display = 'none';
  }

  window.onclick = e => { 
    if (e.target === modal) modal.style.display = 'none'; 
  };

  // ─────────────────────────────────────────────
  // INITIALISATION
  // ─────────────────────────────────────────────
  console.log('🎯 Chargement des communications...');
  loadCommunications();
}