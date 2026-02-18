import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://iomzcbmyzjwtswrkvxqk.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvbXpjYm15emp3dHN3cmt2eHFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDIyMzgxMCwiZXhwIjoyMDg1Nzk5ODEwfQ.60xnMgLm25L8c4nwqMc3y_V-XRXUH76kqa85aIfhR-0'; // Remets ta vraie clé

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function deleteAllUsers() {
  // Récupérer tous les utilisateurs
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Erreur de liste :', error.message);
    return;
  }

  console.log(`🗑️  ${data.users.length} utilisateurs trouvés. Suppression...`);

  for (const user of data.users) {
    // Ne pas supprimer les utilisateurs système éventuels ? Normalement non.
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error(`❌ Erreur pour ${user.email} : ${deleteError.message}`);
    } else {
      console.log(`✅ Supprimé : ${user.email}`);
    }
    // Petit délai pour éviter le rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('🎉 Suppression terminée.');
}

deleteAllUsers().finally(() => process.exit());