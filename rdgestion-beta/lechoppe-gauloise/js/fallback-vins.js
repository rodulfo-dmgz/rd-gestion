// fallback-vins.js
(function() {
  'use strict';
  
  const FALLBACK_VINS = [
    {
      id: 1,
      name: 'Château Margaux 2018',
      type: 'Rouge',
      year: 2018,
      description: 'Grand cru classé de Bordeaux, élégant et complexe.',
      region: 'bordeaux',
      volume: '750ml',
      alcohol: 14.5,
      rating: 4.8,
      price: 499.99,
      image_main: 'products/vins/margaux.jpg',
      badge: 'Grand Cru',
      parker_score: 98,
      featured: true,
      is_active: true
    },
    {
      id: 2,
      name: 'Domaine de la Romanée-Conti 2017',
      type: 'Rouge',
      year: 2017,
      description: 'Légendaire domaine de Bourgogne, finesse exceptionnelle.',
      region: 'bourgogne',
      volume: '750ml',
      alcohol: 13.5,
      rating: 4.9,
      price: 3999.99,
      image_main: 'products/vins/drc.jpg',
      badge: 'Prestige',
      parker_score: 100,
      featured: true,
      is_active: true
    }
  ];
  
  // Surcharger le module Vins en cas d'erreur
  if (!window.VinsModule || !window.supabase) {
    console.warn('Utilisation des données de secours...');
    
    window.VinsModule = window.VinsModule || {};
    
    window.VinsModule.loadVins = async function() {
      console.log('Chargement des vins de secours');
      return FALLBACK_VINS;
    };
    
    window.VinsModule.loadFeaturedVins = async function() {
      return FALLBACK_VINS.filter(v => v.featured);
    };
  }
})();