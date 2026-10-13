import { expect, test } from '@playwright/test'

/**
 * The journey that pays for everything: an advert link, a jersey, the cart, an
 * order, and the order showing up in the admin.
 *
 * It writes one real order per run. The phone number is unique each time so
 * the duplicate guard never swallows the second run.
 */

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD

function uniquePhone(): string {
  // 7 + eight digits, unique within a century of runs.
  const tail = String(Date.now()).slice(-8)
  return `7${tail}`
}

test('de la publicité à la commande, puis dans l’admin', async ({ page }) => {
  const phone = uniquePhone()

  // 1. Arrive from an advert, attribution and all.
  await page.goto('/?utm_source=meta&utm_campaign=e2e&utm_content=creative-e2e&fbclid=E2EFBCLID')
  await expect(page.getByRole('link', { name: 'DakarKits' })).toBeVisible()

  // 2. Instant search finds a jersey through its alias.
  await page.getByRole('combobox', { name: 'Chercher un maillot' }).first().fill('barca')
  const result = page.getByRole('listbox').getByRole('link').first()
  await expect(result).toBeVisible()
  await result.click()

  // 3. The product page offers a size and a way to buy.
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  const sizes = page.getByRole('group', { name: 'Taille' }).getByRole('button')
  if ((await sizes.count()) > 0) {
    await sizes.filter({ hasNotText: /^$/ }).first().click()
  }
  await page.getByRole('button', { name: 'Ajouter au panier' }).last().click()

  // 4. The cart knows the price and leads to the form.
  await page.goto('/panier')
  await expect(page.getByText('À payer à la livraison')).toBeVisible()
  await page.getByRole('link', { name: 'Commander' }).first().click()

  // 5. Three fields, nothing more.
  await expect(page).toHaveURL(/\/commande$/)
  await page.getByLabel('Nom complet').fill('Client E2E')
  await page.getByLabel('Téléphone').fill(phone)
  await page.getByLabel('Adresse de livraison').fill('Point E, rue 10, Dakar')

  // 5 bis. La zone décide du total, et le récapitulatif doit suivre le doigt.
  // On passe hors zone pour le vérifier, puis on revient : la commande écrite
  // reste une commande de la zone, celle que le reste du parcours raconte.
  // Les montants s'écrivent avec une espace fine insécable, d'où les `\s`.
  const summary = page.locator('dl').filter({ hasText: 'Sous-total' }).first()
  await page.getByText('Ailleurs dans Dakar').click()
  await expect(summary).toContainText(/2\s?000\s?à\s?3\s?000\s?F/)
  await page.getByText('Sur l’axe du BRT').click()
  await expect(summary).toContainText('Gratuite')

  await page.getByRole('button', { name: 'Confirmer ma commande' }).last().click()

  // 6. Confirmation, with a readable order number.
  await expect(page).toHaveURL(/\/commande\/confirmee\/[a-f0-9]{32}$/)
  await expect(page.getByRole('heading', { name: 'Commande enregistrée' })).toBeVisible()
  const number = await page.getByText(/DK-\d{5}/).first().innerText()
  expect(number).toMatch(/DK-\d{5}/)

  // 7. And it is waiting in the admin.
  test.skip(
    !ADMIN_EMAIL || !ADMIN_PASSWORD,
    'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to check the admin half.',
  )

  await page.goto('/admin/connexion')
  await page.getByLabel('Email').fill(ADMIN_EMAIL!)
  await page.getByLabel('Mot de passe').fill(ADMIN_PASSWORD!)
  await page.getByRole('button', { name: 'Se connecter' }).click()
  // Wait for the session to land: navigating away now would cancel the redirect
  // and arrive without a cookie.
  await expect(page).toHaveURL(/\/admin$/)

  await page.goto(`/admin/commandes?q=${encodeURIComponent(phone)}`)
  await expect(page.getByText(number.trim())).toBeVisible()
})
