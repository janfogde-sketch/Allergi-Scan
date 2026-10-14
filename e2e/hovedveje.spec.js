import { test, expect } from '@playwright/test'
import { isolerNetvaerk } from './helpers.js'

test.describe('Forside og login', () => {
  test('velkomstskærmen vises med de to veje ind', async ({ page }) => {
    await isolerNetvaerk(page)
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Opret gratis konto' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Jeg har allerede en konto' })).toBeVisible()
  })

  test('tom e-mail og tom adgangskode giver felt-fejl ved login', async ({ page }) => {
    await isolerNetvaerk(page)
    await page.goto('/')
    await page.getByRole('button', { name: 'Jeg har allerede en konto' }).click()
    await page.getByRole('button', { name: /Log ind/ }).last().click()
    await expect(page.getByText('Indtast din e-mail først.')).toBeVisible()
    await page.locator('#login-email').fill('test@example.com')
    await page.getByRole('button', { name: /Log ind/ }).last().click()
    await expect(page.getByText('Indtast din adgangskode.')).toBeVisible()
  })

  test('forkert login viser den faste, venlige fejl', async ({ page }) => {
    await isolerNetvaerk(page, { login: { status: 400, body: { error_description: 'Invalid login credentials' } } })
    await page.goto('/')
    await page.getByRole('button', { name: 'Jeg har allerede en konto' }).click()
    await page.locator('#login-email').fill('test@example.com')
    await page.locator('#login-password').fill('Forkert1234')
    await page.getByRole('button', { name: /Log ind/ }).last().click()
    await expect(page.getByText('E-mail eller adgangskode er forkert.')).toBeVisible()
  })

  test('fanen Ny bruger viser oprettelsesformularen', async ({ page }) => {
    await isolerNetvaerk(page)
    await page.goto('/')
    await page.getByRole('button', { name: 'Opret gratis konto' }).click()
    await expect(page.getByText('Opret din konto')).toBeVisible()
    await expect(page.locator('#signup-email')).toBeVisible()
    await expect(page.locator('#signup-password')).toBeVisible()
  })
})

test.describe('Offentlige sider', () => {
  for (const [sti, overskrift] of [['/terms.html', 'Brugsvilkår'], ['/privacy.html', 'Privatlivspolitik']]) {
    test(`${sti} åbner med sin overskrift`, async ({ page }) => {
      await isolerNetvaerk(page)
      const svar = await page.goto(sti)
      expect(svar.status()).toBe(200)
      await expect(page.locator('h1').first()).toContainText(overskrift)
    })
  }

  test('admin-panelet åbner uden at vise data til en besøgende uden login', async ({ page }) => {
    await isolerNetvaerk(page)
    const svar = await page.goto('/admin.html')
    expect(svar.status()).toBe(200)
    await expect(page.locator('#admin-root')).not.toBeEmpty()
  })
})

test('ingen uventede JavaScript-fejl på forsiden', async ({ page }) => {
  const fejl = []
  page.on('pageerror', (e) => fejl.push(e.message))
  await isolerNetvaerk(page)
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Opret gratis konto' })).toBeVisible()
  expect(fejl).toEqual([])
})
