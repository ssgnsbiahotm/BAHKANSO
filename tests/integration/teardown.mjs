import { adminClient } from './setup.mjs';

export async function teardownTestUsers() {
  // Nettoyage des app_users de test créés durant la session.
  // À appeler dans un afterAll global si nécessaire.
  const { error } = await adminClient
    .from('app_users')
    .delete()
    .like('email', '%@test.integration');
  if (error) throw error;
}
