// core/exercice.js – Exercice interactif avec données accessibles et téléchargement CSV
document.addEventListener('DOMContentLoaded', () => {
  const modeGuided = document.getElementById('mode-guided');
  const modeUnguided = document.getElementById('mode-unguided');
  const exerciseArea = document.getElementById('exercise-area');
  const correctionBtn = document.getElementById('correction-btn');

  let currentMode = null;
  const data = window.exerciceData;

  // Calculs préliminaires pour les valeurs attendues
  const caTotal = data.ca.reduce((a, b) => a + b, 0);
  const chargesTotal = data.charges.reduce((a, b) => a + b, 0);
  const margeAnnuelleAttendue = caTotal - chargesTotal;
  const tauxMargeAttendu = (margeAnnuelleAttendue / caTotal * 100).toFixed(1);
  const bfrMoyenAttendu = (data.bfr.reduce((a, b) => a + b, 0) / 12).toFixed(0);
  const clientsMoyen = data.clients.reduce((a, b) => a + b, 0) / 12;
  const delaiClientAttendu = (clientsMoyen / caTotal * 365).toFixed(1); // en jours

  // Fonction de téléchargement CSV (utilisée dans les deux modes)
  function downloadCSV() {
    const headers = ['Mois', 'CA (€)', 'Charges (€)', 'Trésorerie (€)', 'BFR (€)', 'Clients (€)', 'Fournisseurs (€)'];
    const rows = data.mois.map((m, i) => [
      m,
      data.ca[i],
      data.charges[i],
      data.tresorerie[i],
      data.bfr[i],
      data.clients[i],
      data.fournisseurs[i]
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM pour accents
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'donnees_exercice.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Fonction pour générer un graphique à barres simple (CA mensuel)
  function renderBarChart(containerId, values, labels, color = 'var(--primary)') {
    const max = Math.max(...values);
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    const chartDiv = document.createElement('div');
    chartDiv.style.display = 'flex';
    chartDiv.style.alignItems = 'flex-end';
    chartDiv.style.justifyContent = 'space-around';
    chartDiv.style.height = '200px';
    chartDiv.style.marginTop = '1rem';
    values.forEach((val, i) => {
      const bar = document.createElement('div');
      bar.style.width = '30px';
      bar.style.height = `${(val / max) * 180}px`;
      bar.style.backgroundColor = color;
      bar.style.borderRadius = '4px 4px 0 0';
      bar.style.margin = '0 2px';
      bar.title = `${labels[i]}: ${val.toLocaleString()} €`;
      chartDiv.appendChild(bar);
    });
    container.appendChild(chartDiv);
    // Ajouter les labels (tous les deux mois pour éviter la surcharge)
    const labelDiv = document.createElement('div');
    labelDiv.style.display = 'flex';
    labelDiv.style.justifyContent = 'space-around';
    labelDiv.style.marginTop = '5px';
    labels.forEach((l, i) => {
      if (i % 2 === 0) {
        const lbl = document.createElement('span');
        lbl.style.fontSize = '10px';
        lbl.textContent = l.substring(0, 3);
        labelDiv.appendChild(lbl);
      }
    });
    container.appendChild(labelDiv);
  }

  function showGuidedMode() {
    exerciseArea.innerHTML = `
      <div style="background: var(--light); padding: 1.5rem; border-radius: var(--radius); margin-bottom: 2rem;">
        <h3><i class="fas fa-store"></i> Contexte : Entreprise "Les Délices du Sud"</h3>
        <p>Vous venez d'être nommé gestionnaire de cette entreprise de distribution alimentaire. Voici les données financières de l'année écoulée (12 mois). Votre mission : analyser la santé financière et proposer des pistes d'amélioration.</p>
        <div id="guided-chart" style="margin: 1rem 0;"></div>
        <p><small>Graphique : Chiffre d'affaires mensuel (en €).</small></p>
        <button class="btn btn-secondary" id="guided-download-csv"><i class="fas fa-download"></i> Télécharger les données (CSV)</button>
        <details style="margin-top:1rem;">
          <summary>Voir le tableau complet des données</summary>
          <div style="overflow-x: auto;">
            <table class="data-table">
              <thead>
                <tr><th>Mois</th><th>CA (€)</th><th>Charges (€)</th><th>Trésorerie (€)</th><th>BFR (€)</th><th>Clients (€)</th><th>Fournisseurs (€)</th></tr>
              </thead>
              <tbody>
                ${data.mois.map((m, i) => `<tr>
                  <td>${m}</td>
                  <td>${data.ca[i].toLocaleString()}</td>
                  <td>${data.charges[i].toLocaleString()}</td>
                  <td>${data.tresorerie[i].toLocaleString()}</td>
                  <td>${data.bfr[i].toLocaleString()}</td>
                  <td>${data.clients[i].toLocaleString()}</td>
                  <td>${data.fournisseurs[i].toLocaleString()}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </details>
      </div>
      <div id="guided-steps">
        <div class="guided-step" id="step1">
          <h4>📌 Étape 1 : Calcul de la marge brute annuelle</h4>
          <p>La marge brute = Chiffre d'affaires total - Achats consommés (charges). Calculez-la à partir des données.</p>
          <div style="display: flex; gap: 1rem; align-items: center;">
            <input type="number" id="margeAnnuelleInput" placeholder="Marge brute en €" style="flex:1;">
            <button class="btn btn-secondary" onclick="checkStep1(${margeAnnuelleAttendue})">Vérifier</button>
          </div>
          <p id="feedback1" class="feedback" style="margin-top: 0.5rem;"></p>
        </div>
        <div class="guided-step" id="step2" style="display:none;">
          <h4>📌 Étape 2 : Taux de marge moyen</h4>
          <p>Le taux de marge = (Marge brute / CA total) × 100. Exprimez-le en pourcentage (avec une décimale).</p>
          <div style="display: flex; gap: 1rem; align-items: center;">
            <input type="number" id="tauxMargeInput" placeholder="ex: 25.5" step="0.1" style="flex:1;">
            <button class="btn btn-secondary" onclick="checkStep2(${tauxMargeAttendu})">Vérifier</button>
          </div>
          <p id="feedback2" class="feedback"></p>
        </div>
        <div class="guided-step" id="step3" style="display:none;">
          <h4>📌 Étape 3 : Besoin en Fonds de Roulement (BFR) moyen</h4>
          <p>Le BFR = Stocks + Créances clients - Dettes fournisseurs. Ici, nous avons les données clients et fournisseurs. Calculez le BFR moyen sur l'année.</p>
          <div style="display: flex; gap: 1rem; align-items: center;">
            <input type="number" id="bfrMoyenInput" placeholder="BFR moyen en €" style="flex:1;">
            <button class="btn btn-secondary" onclick="checkStep3(${bfrMoyenAttendu})">Vérifier</button>
          </div>
          <p id="feedback3" class="feedback"></p>
        </div>
        <div class="guided-step" id="step4" style="display:none;">
          <h4>📌 Étape 4 : Interprétation</h4>
          <p>Que pouvez-vous dire de la situation ?</p>
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <label><input type="radio" name="interpret" value="a"> L'entreprise est très rentable mais a un BFR élevé, risque de trésorerie.</label>
            <label><input type="radio" name="interpret" value="b"> L'entreprise est en perte, il faut réduire les coûts.</label>
            <label><input type="radio" name="interpret" value="c"> Les clients paient trop vite, il faut allonger les délais.</label>
          </div>
          <button class="btn btn-primary" onclick="checkStep4()" style="margin-top: 1rem;">Valider</button>
          <p id="feedback4" class="feedback"></p>
        </div>
      </div>
    `;

    renderBarChart('guided-chart', data.ca, data.mois);
    document.getElementById('guided-download-csv').addEventListener('click', downloadCSV);
  }

  window.checkStep1 = function(attendue) {
    const val = parseFloat(document.getElementById('margeAnnuelleInput').value);
    if (isNaN(val)) {
      document.getElementById('feedback1').innerHTML = '<span style="color: var(--danger);">❌ Veuillez entrer un nombre.</span>';
    } else if (Math.abs(val - attendue) < 100) {
      document.getElementById('feedback1').innerHTML = '<span style="color: var(--success);">✅ Correct ! Passons à l\'étape 2.</span>';
      document.getElementById('step2').style.display = 'block';
    } else {
      document.getElementById('feedback1').innerHTML = '<span style="color: var(--danger);">❌ Ce n\'est pas la bonne valeur. Réessayez.</span>';
    }
  };

  window.checkStep2 = function(attendue) {
    const val = parseFloat(document.getElementById('tauxMargeInput').value);
    if (isNaN(val)) {
      document.getElementById('feedback2').innerHTML = '<span style="color: var(--danger);">❌ Veuillez entrer un nombre.</span>';
    } else if (Math.abs(val - attendue) < 0.2) {
      document.getElementById('feedback2').innerHTML = '<span style="color: var(--success);">✅ Parfait ! Étape suivante.</span>';
      document.getElementById('step3').style.display = 'block';
    } else {
      document.getElementById('feedback2').innerHTML = '<span style="color: var(--danger);">❌ Le taux est incorrect. Indice : (marge/CA)*100.</span>';
    }
  };

  window.checkStep3 = function(attendue) {
    const val = parseFloat(document.getElementById('bfrMoyenInput').value);
    if (isNaN(val)) {
      document.getElementById('feedback3').innerHTML = '<span style="color: var(--danger);">❌ Veuillez entrer un nombre.</span>';
    } else if (Math.abs(val - attendue) < 100) {
      document.getElementById('feedback3').innerHTML = '<span style="color: var(--success);">✅ Bravo ! Dernière étape.</span>';
      document.getElementById('step4').style.display = 'block';
    } else {
      document.getElementById('feedback3').innerHTML = '<span style="color: var(--danger);">❌ Vérifiez votre calcul (moyenne des BFR mensuels).</span>';
    }
  };

  window.checkStep4 = function() {
    const radios = document.getElementsByName('interpret');
    let selected = null;
    for (let r of radios) {
      if (r.checked) { selected = r.value; break; }
    }
    if (selected === 'a') {
      document.getElementById('feedback4').innerHTML = '<span style="color: var(--success);">✅ Excellente analyse ! En effet, la marge est bonne mais le BFR élevé peut créer des tensions de trésorerie. Pistes : réduire les stocks ou négocier les délais fournisseurs.</span>';
    } else if (!selected) {
      document.getElementById('feedback4').innerHTML = '<span style="color: var(--danger);">❌ Veuillez sélectionner une réponse.</span>';
    } else {
      document.getElementById('feedback4').innerHTML = '<span style="color: var(--danger);">❌ Ce n\'est pas la meilleure interprétation. Revoyez les chiffres.</span>';
    }
  };

  function showUnguidedMode() {
    exerciseArea.innerHTML = `
      <h3><i class="fas fa-chart-line"></i> Mode autonome</h3>
      <p>Voici l'ensemble des données de l'année. Vous pouvez les télécharger au format CSV pour les analyser dans votre tableur.</p>
      <button class="btn btn-secondary" id="unguided-download-csv"><i class="fas fa-download"></i> Télécharger en CSV</button>
      <div style="overflow-x: auto; margin-top: 2rem;">
        <table class="data-table">
          <thead>
            <tr><th>Mois</th><th>CA (€)</th><th>Charges (€)</th><th>Trésorerie (€)</th><th>BFR (€)</th><th>Clients (€)</th><th>Fournisseurs (€)</th></tr>
          </thead>
          <tbody>
            ${data.mois.map((m, i) => `<tr>
              <td>${m}</td>
              <td>${data.ca[i].toLocaleString()}</td>
              <td>${data.charges[i].toLocaleString()}</td>
              <td>${data.tresorerie[i].toLocaleString()}</td>
              <td>${data.bfr[i].toLocaleString()}</td>
              <td>${data.clients[i].toLocaleString()}</td>
              <td>${data.fournisseurs[i].toLocaleString()}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>

      <div style="margin-top: 2rem; background: var(--light); padding: 1.5rem; border-radius: var(--radius);">
        <h4>📐 Formules à utiliser</h4>
        <ul style="list-style: none; padding-left: 0;">
          <li><strong>Marge brute annuelle</strong> = Somme des CA mensuels – Somme des charges mensuelles</li>
          <li><strong>Taux de marge moyen</strong> = (Marge brute totale / CA total) × 100</li>
          <li><strong>BFR moyen</strong> = Moyenne des BFR mensuels (colonne BFR)</li>
          <li><strong>Délai moyen de paiement clients</strong> = (Moyenne des créances clients / CA total) × 365 (en jours)</li>
        </ul>
      </div>

      <p style="margin-top: 2rem;">Calculez maintenant les indicateurs suivants :</p>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div class="form-group">
          <label>Marge brute annuelle (€) :</label>
          <input type="number" id="margeBruteUnguided" placeholder="ex: 200000">
        </div>
        <div class="form-group">
          <label>Taux de marge moyen (%) :</label>
          <input type="number" id="tauxMargeUnguided" step="0.1" placeholder="ex: 25.5">
        </div>
        <div class="form-group">
          <label>BFR moyen (€) :</label>
          <input type="number" id="bfrMoyenUnguided" placeholder="ex: 15000">
        </div>
        <div class="form-group">
          <label>Délai moyen de paiement clients (jours) :</label>
          <input type="number" id="delaiClientUnguided" step="0.1" placeholder="ex: 45.2">
        </div>
      </div>
      <button class="btn btn-primary" id="check-unguided"><i class="fas fa-check"></i> Vérifier mes réponses</button>
      <div id="unguided-feedback" style="margin-top: 1rem;"></div>
    `;

    document.getElementById('unguided-download-csv').addEventListener('click', downloadCSV);

    document.getElementById('check-unguided').addEventListener('click', () => {
      const margeUser = parseFloat(document.getElementById('margeBruteUnguided').value);
      const tauxUser = parseFloat(document.getElementById('tauxMargeUnguided').value);
      const bfrUser = parseFloat(document.getElementById('bfrMoyenUnguided').value);
      const delaiUser = parseFloat(document.getElementById('delaiClientUnguided').value);

      let feedback = '';
      let correct = true;

      if (isNaN(margeUser)) { feedback += '❌ Marge brute manquante. '; correct = false; }
      else if (Math.abs(margeUser - margeAnnuelleAttendue) > 100) { feedback += '❌ Marge brute incorrecte. '; correct = false; }

      if (isNaN(tauxUser)) { feedback += '❌ Taux de marge manquant. '; correct = false; }
      else if (Math.abs(tauxUser - tauxMargeAttendu) > 0.2) { feedback += '❌ Taux de marge incorrect. '; correct = false; }

      if (isNaN(bfrUser)) { feedback += '❌ BFR moyen manquant. '; correct = false; }
      else if (Math.abs(bfrUser - bfrMoyenAttendu) > 100) { feedback += '❌ BFR moyen incorrect. '; correct = false; }

      if (isNaN(delaiUser)) { feedback += '❌ Délai clients manquant. '; correct = false; }
      else if (Math.abs(delaiUser - delaiClientAttendu) > 1) { feedback += '❌ Délai clients incorrect. '; correct = false; }

      if (correct) {
        feedback = '<span style="color: var(--success);">✅ Toutes vos réponses sont correctes !</span>';
      } else {
        feedback = '<span style="color: var(--danger);">' + feedback + '</span>';
      }
      document.getElementById('unguided-feedback').innerHTML = feedback;
    });
  }

  modeGuided.addEventListener('click', () => {
    currentMode = 'guided';
    showGuidedMode();
  });

  modeUnguided.addEventListener('click', () => {
    currentMode = 'unguided';
    showUnguidedMode();
  });

  correctionBtn.addEventListener('click', () => {
    if (currentMode === 'unguided') {
      if (document.getElementById('margeBruteUnguided')) {
        document.getElementById('margeBruteUnguided').value = margeAnnuelleAttendue.toFixed(0);
        document.getElementById('tauxMargeUnguided').value = tauxMargeAttendu;
        document.getElementById('bfrMoyenUnguided').value = bfrMoyenAttendu;
        document.getElementById('delaiClientUnguided').value = delaiClientAttendu;
      }
    } else if (currentMode === 'guided') {
      alert('Utilisez les boutons Vérifier pour chaque étape.');
    }
  });
});