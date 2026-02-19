// data.js – Données financières simulées pour l'exercice (12 mois)
const exerciceData = {
  mois: [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ],
  ca: [42500, 39800, 47200, 51300, 55800, 60200, 58900, 57100, 61200, 64800, 67300, 71100],
  charges: [38000, 36500, 40100, 42200, 44800, 47900, 49500, 48800, 51200, 52900, 54700, 56800],
  tresorerie: [18700, 16200, 15900, 17800, 20200, 23100, 21800, 20700, 23500, 26800, 29400, 32100],
  bfr: [11200, 11800, 12400, 13100, 13900, 14700, 15200, 14900, 15800, 16600, 17400, 18300],
  // Ajout de données pour l'exercice
  clients: [32000, 31500, 33000, 34800, 36200, 37900, 38500, 37600, 39100, 40800, 42100, 43800],
  fournisseurs: [20800, 19700, 20600, 21700, 22300, 23200, 23900, 23400, 24700, 25500, 26300, 27400]
};

window.exerciceData = exerciceData;