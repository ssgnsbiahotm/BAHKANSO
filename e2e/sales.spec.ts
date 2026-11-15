import { test, expect } from '@playwright/test';

const e2eEmail = process.env.E2E_USER_EMAIL;
const e2ePassword = process.env.E2E_USER_PASSWORD;

if (!e2eEmail || !e2ePassword) {
  throw new Error(
    'E2E_USER_EMAIL and E2E_USER_PASSWORD must be configured before running Playwright tests.'
  );
}

test.beforeEach(async ({ page }) => {
  // Connexion via l'interface avec un compte de test fourni par l'environnement.
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(e2eEmail);
  await page.getByLabel(/mot de passe/i).fill(e2ePassword);
  await page.getByRole('button', { name: /se connecter/i }).click();
  await page.waitForURL(/\/app/, { timeout: 15000 });

  // Aller sur Ventes
  await page.goto('/app/ventes');
  await page.waitForLoadState('networkidle');
});

test('Bouton Nouvelle vente est visible et vert', async ({ page }) => {
  const btn = page.getByRole('button', { name: /nouvelle vente/i });
  await expect(btn).toBeVisible();
  await expect(btn).toHaveClass(/module-btn-primary/);
});

test('Ouvrir la modale de création', async ({ page }) => {
  await page.getByRole('button', { name: /nouvelle vente/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
});
