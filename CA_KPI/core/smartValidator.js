// core/smartValidator.js – Validation interactive SMART
document.addEventListener('DOMContentLoaded', () => {
  const objectiveInput = document.getElementById('objective');
  const criteria = {
    specific: document.getElementById('crit-specific'),
    measurable: document.getElementById('crit-measurable'),
    achievable: document.getElementById('crit-achievable'),
    relevant: document.getElementById('crit-relevant'),
    timebound: document.getElementById('crit-timebound')
  };
  const resultDiv = document.getElementById('smart-result');

  function checkSpecific(text) {
    const patterns = [/augmenter/i, /réduire/i, /améliorer/i, /atteindre/i, /obtenir/i, /développer/i];
    return patterns.some(p => p.test(text)) && text.split(' ').length >= 4;
  }

  function checkMeasurable(text) {
    return /\d+/.test(text) || /pourcent|%|taux|montant|quantité/i.test(text);
  }

  function checkAchievable(text) {
    return !/(impossible|irréaliste|utopique)/i.test(text) && text.length > 10;
  }

  function checkRelevant(text) {
    return /(vente|ca|marge|profit|client|trésorerie|bfr|délai|chiffre d'affaires)/i.test(text);
  }

  function checkTimebound(text) {
    return /(d'ici|avant|dans|mois|année|semaine|jour|trimestre|202[4-9])/i.test(text);
  }

  function update() {
    const text = objectiveInput.value;
    const checks = {
      specific: checkSpecific(text),
      measurable: checkMeasurable(text),
      achievable: checkAchievable(text),
      relevant: checkRelevant(text),
      timebound: checkTimebound(text)
    };

    let allValid = true;
    for (let [key, valid] of Object.entries(checks)) {
      const el = criteria[key];
      el.classList.toggle('valid', valid);
      el.classList.toggle('invalid', !valid);
      if (!valid) allValid = false;
    }

    if (allValid) {
      resultDiv.innerHTML = '<span style="color: var(--success);">✅ Félicitations ! Votre objectif est SMART.</span>';
    } else {
      resultDiv.innerHTML = '<span style="color: var(--danger);">❌ Votre objectif n\'est pas encore SMART. Améliorez-le.</span>';
    }
  }

  objectiveInput.addEventListener('input', update);

  // Exemple prérempli
  objectiveInput.value = "Augmenter le chiffre d'affaires de 15% d'ici fin 2026";
  update();
});