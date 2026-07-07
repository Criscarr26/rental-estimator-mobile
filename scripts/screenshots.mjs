// Captures README screenshots from the static web export using the
// system Chrome (no browser download). Requires the export to be served:
//   npx expo export --platform web
//   python -m http.server 8090 -d dist
// Then: node scripts/screenshots.mjs [email] [password]
// Without credentials it captures the estimate screen and the login screen.

import { chromium } from 'playwright-core';

const BASE = process.env.SHOTS_BASE || 'http://localhost:8090';
const [email, password] = process.argv.slice(2);
const INDEX = BASE.includes('8085') ? '/' : '/index.html';
const SAVED = BASE.includes('8085') ? '/saved' : '/saved.html';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});

// Press a pressable by its visible text. testID/data-testid only exists in
// dev builds, and RN Web pressables ignore Playwright's synthetic clicks,
// so this finds the text node and fires raw pointer events on it.
async function pressText(text) {
  await page.waitForSelector(`text="${text}"`);
  await page.evaluate((label) => {
    const el = [...document.querySelectorAll('div')]
      .filter((d) => d.innerText === label)
      .pop();
    const target = el.closest('[tabindex]') || el;
    const r = target.getBoundingClientRect();
    const o = {
      bubbles: true,
      cancelable: true,
      clientX: r.x + r.width / 2,
      clientY: r.y + r.height / 2,
      pointerId: 1,
      isPrimary: true,
      pointerType: 'mouse',
      button: 0,
    };
    target.dispatchEvent(new PointerEvent('pointerdown', { ...o, buttons: 1 }));
    target.dispatchEvent(new PointerEvent('pointerup', { ...o, buttons: 0 }));
    target.dispatchEvent(new MouseEvent('click', o));
  }, text);
}

// Retry a press until `expected` shows up: the SSR HTML paints the text
// before React hydrates, and a press on pre-hydration DOM does nothing.
async function pressUntil(text, expected) {
  for (let attempt = 0; attempt < 5; attempt++) {
    await pressText(text);
    try {
      await page.waitForSelector(`text=${expected}`, { timeout: 3000 });
      return;
    } catch {
      await page.waitForTimeout(1000);
    }
  }
  throw new Error(`Pressing "${text}" never produced "${expected}"`);
}

// Estimate screen, with a real appraisal on display.
await page.goto(`${BASE}${INDEX}`, { waitUntil: 'networkidle' });
await pressUntil('Estimar precio', 'Alquiler mensual estimado');
await page.screenshot({ path: 'docs/screen-estimar.png' });
console.log('docs/screen-estimar.png');

// History tab: login form, and the history itself when credentials are given.
await page.goto(`${BASE}${SAVED}`, { waitUntil: 'networkidle' });
await page.waitForSelector('input[placeholder="Correo"]');
await page.screenshot({ path: 'docs/screen-login.png' });
console.log('docs/screen-login.png');

if (email && password) {
  await page.fill('input[placeholder="Correo"]', email);
  await page.fill('input[type="password"]', password);
  await pressUntil('Iniciar sesión', 'Salir');
  await page.waitForTimeout(1500); // let the history rows load
  await page.screenshot({ path: 'docs/screen-historial.png' });
  console.log('docs/screen-historial.png');
}

await browser.close();
