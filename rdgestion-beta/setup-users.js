// ============================================================================
// SCRIPT DE CRÉATION DES UTILISATEURS (AUTH + PROFIL PUBLIC) AVEC MÉTIER
// ============================================================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://iomzcbmyzjwtswrkvxqk.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvbXpjYm15emp3dHN3cmt2eHFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDIyMzgxMCwiZXhwIjoyMDg1Nzk5ODEwfQ.60xnMgLm25L8c4nwqMc3y_V-XRXUH76kqa85aIfhR-0'; // Remets ta vraie clé

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Liste des utilisateurs avec métier
const utilisateurs = [
  {
    email: 'rodulfo.dominguez@rd-gestion.fr',
    password: 'Admin2024!Secure',
    user_metadata: {
      nom: 'DOMINGUEZ',
      prenom: 'Rodulfo',
      role: 'admin',
      metier: null  // l'admin n'a pas de métier spécifique
    }
  },
  {
    email: 'estelle.colonna@rd-gestion.fr',
    password: 'RDGestion2024!',
    user_metadata: {
      nom: 'COLONNA',
      prenom: 'Estelle',
      role: 'stagiaire',
      metier: 'comptable_assistant'
    }
  },
  {
    email: 'elodie.bouvier@rd-gestion.fr',
    password: 'RDGestion2024!',
    user_metadata: {
      nom: 'BOUVIER',
      prenom: 'Elodie',
      role: 'stagiaire',
      metier: 'comptable_assistant'
    }
  },
  {
    email: 'carine.caillet@rd-gestion.fr',
    password: 'RDGestion2024!',
    user_metadata: {
      nom: 'CAILLET',
      prenom: 'Carine',
      role: 'stagiaire',
      metier: 'comptable_assistant'
    }
  },
  {
    email: 'mathieu.karadija@rd-gestion.fr',
    password: 'RDGestion2024!',
    user_metadata: {
      nom: 'KARADIJA',
      prenom: 'Mathieu',
      role: 'stagiaire',
      metier: 'comptable_assistant'
    }
  },
  {
    email: 'karol.karlinski@rd-gestion.fr',
    password: 'RDGestion2024!',
    user_metadata: {
      nom: 'KARLINSKI',
      prenom: 'Karol',
      role: 'stagiaire',
      metier: 'comptable_assistant'
    }
  },
  {
    email: 'xavier.navarro@rd-gestion.fr',
    password: 'RDGestion2024!',
    user_metadata: {
      nom: 'NAVARRO',
      prenom: 'Xavier',
      role: 'stagiaire',
      metier: 'comptable_assistant'
    }
  },
  {
    email: 'marion.astier@rd-gestion.fr',
    password: 'RDGestion2024!',
    user_metadata: {
      nom: 'ASTIER',
      prenom: 'Marion',
      role: 'stagiaire',
      metier: 'comptable_assistant'
    }
  },
  {
    email: 'sonia.abdouja@rd-gestion.fr',
    password: 'RDGestion2024!',
    user_metadata: {
      nom: 'ABDOUJA',
      prenom: 'Sonia',
      role: 'stagiaire',
      metier: 'comptable_assistant'
    }
  }
];

async function creerUtilisateurs() {
  console.log('🚀 Création des utilisateurs...\n');

  let compteur = 0;
  let erreurs = 0;

  for (const user of utilisateurs) {
    try {
      // 1. Création dans Auth
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: user.user_metadata
      });

      if (error) {
        console.error(`❌ Erreur Auth pour ${user.email}:`, error.message);
        erreurs++;
        continue;
      }

      const userId = data.user.id;

      // 2. Insertion dans public.users
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: user.email,
          nom: user.user_metadata.nom,
          prenom: user.user_metadata.prenom,
          role: user.user_metadata.role,
          metier: user.user_metadata.metier,  // <-- Ajout du métier
          actif: true,
          metadata: user.user_metadata,
          created_at: new Date(),
          updated_at: new Date()
        });

      if (insertError) {
        console.error(`❌ Erreur insertion public.users pour ${user.email}:`, insertError.message);
        erreurs++;
        // Optionnel : supprimer l'utilisateur Auth pour incohérence
        // await supabase.auth.admin.deleteUser(userId);
      } else {
        console.log(`✅ Créé: ${user.user_metadata.prenom} ${user.user_metadata.nom} (${user.email}) - Métier: ${user.user_metadata.metier || 'aucun'}`);
        compteur++;
      }

    } catch (err) {
      console.error(`❌ Exception pour ${user.email}:`, err.message);
      erreurs++;
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n====================================');
  console.log(`✅ ${compteur} utilisateurs créés`);
  if (erreurs > 0) console.log(`❌ ${erreurs} erreurs`);
  console.log('====================================');
}

creerUtilisateurs().finally(() => process.exit());