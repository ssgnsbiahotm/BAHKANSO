import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Connexion via l'interface (dérogation utilisateur pour tests e2e locaux)
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('e2e@bahkanso.ci');
  await page.getByLabel(/mot de passe/i).fill('password123');
  await page.getByRole('button', { name: /se connecter/i }).click();
  await page.waitForURL(/\/app/, { timeout: 15000 });

  // Aller sur Ventes
  await page.goto('/app/ventes');
  await page.waitForLoadState('networkidle');
});

test('Bouton Nouvelle vente est visible et vert', async ({ page }) => {
  const btn = page.getByRole('button', { name: /nouvelle vente/i });
  await expect(btn).toBeVisible();
  await expect(btn).toHaveClass(/bg-primary/);
});

test('Ouvrir la modale de création', async ({ page }) => {
  await page.getByRole('button', { name: /nouvelle vente/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
});
