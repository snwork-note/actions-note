import { chromium } from 'playwright';
import fs from 'fs';

const STATE_PATH = './note-state.json';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('https://note.com/login');

  console.log('Please log in manually. Waiting for completion...');

  try {
    await page.waitForURL(/note\.com\/?$/, { timeout: 300000 });
    console.log('Login detected!');
  } catch {
    console.log('Login detection failed. Press Enter to continue manually.');
    await new Promise(resolve => {
      process.stdin.once('data', () => resolve());
    });
  }

  await context.storageState({ path: STATE_PATH });
  console.log('Saved:', STATE_PATH);
  await browser.close();
})();
