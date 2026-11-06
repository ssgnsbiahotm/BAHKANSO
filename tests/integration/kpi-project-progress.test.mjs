import { test, beforeAll, afterAll } from 'vitest';
import { expect } from 'vitest';
import { adminClient } from './setup.mjs';
import { setupFixtures, teardownFixtures } from './fixtures.mjs';
import { calculateProjectProgress } from '../../src/lib/kpi.ts';

let fx;
let projectId;

beforeAll(async () => {
  fx = await setupFixtures();

  // Créer un chantier (projet) de test
  const { data: project, error: pErr } = await adminClient
    .from('projects')
    .insert({
      name: 'Chantier Test Progrès',
      type: 'batiment',
      status: 'en cours',
      progress: 0,
      description: 'Chantier utilisé pour le test du KPI d\'avancement',
    })
    .select()
    .single();
  expect(pErr).toBeNull();
  projectId = project.id;

  // Créer 3 étapes liées au chantier (toutes 'planifié')
  const { error: stepsErr } = await adminClient.from('project_steps').insert([
    { project_id: projectId, name: 'Terrassement', status: 'planifié', progress: 0 },
    { project_id: projectId, name: 'Fondations', status: 'planifié', progress: 0 },
    { project_id: projectId, name: 'Charpente', status: 'planifié', progress: 0 },
  ]);
  expect(stepsErr).toBeNull();
});

afterAll(async () => {
  // Nettoyer les étapes et le projet de test
  if (projectId) {
    await adminClient.from('project_steps').delete().eq('project_id', projectId);
    await adminClient.from('projects').delete().eq('id', projectId);
  }
  await teardownFixtures(fx);
});

test('calculateProjectProgress retourne 0 quand aucune étape n\'est terminée', async () => {
  const progress = await calculateProjectProgress(projectId, adminClient);
  expect(progress).toBe(0);
});

test('calculateProjectProgress retourne 33 quand 1 étape sur 3 est terminée', async () => {
  const { error: updErr } = await adminClient
    .from('project_steps')
    .update({ status: 'terminé' })
    .eq('project_id', projectId)
    .eq('name', 'Terrassement');
  expect(updErr).toBeNull();

  const progress = await calculateProjectProgress(projectId, adminClient);
  expect(progress).toBe(33);
});

test('calculateProjectProgress retourne 100 quand toutes les étapes sont terminées', async () => {
  const { error: updErr } = await adminClient
    .from('project_steps')
    .update({ status: 'terminé' })
    .eq('project_id', projectId);
  expect(updErr).toBeNull();

  const progress = await calculateProjectProgress(projectId, adminClient);
  expect(progress).toBe(100);
});
