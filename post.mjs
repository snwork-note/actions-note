import { chromium } from 'playwright';
import fs from 'fs';

const STATE_PATH = './note-state.json';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    storageState: STATE_PATH
  });
  const page = await context.newPage();
  console.log('Automated posting logic here...');
})();
