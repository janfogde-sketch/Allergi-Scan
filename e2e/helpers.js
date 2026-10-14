// Fælles opsætning: al trafik uden for testserveren afvises, og Supabase besvares med forfalskede svar.
export async function isolerNetvaerk(page, { login } = {}) {
  await page.route(/^https?:\/\/(?!localhost)/, (route) => {
    const url = route.request().url()
    if (url.includes('/auth/v1/token') && login) {
      return route.fulfill({ status: login.status, contentType: 'application/json', body: JSON.stringify(login.body) })
    }
    if (url.includes('supabase.co')) return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    return route.abort()
  })
  // Vercel-funktionerne findes ikke i vite preview; "ingen session" er det, en anonym besøgende får.
  await page.route('**/api/**', (route) => route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }))
}
