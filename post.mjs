import { chromium } from 'playwright';
import fs from 'fs';

const STATE_PATH = './note-state.json';
const SELECTORS_PATH = './selectors/selectors.json';

const { NOTE_STORAGE_STATE_JSON, THEME, TARGET, MESSAGE, CTA, TAGS, IS_PUBLIC, DRY_RUN } = process.env;

if (!NOTE_STORAGE_STATE_JSON) {
  console.error('❌ NOTE_STORAGE_STATE_JSON が設定されていません');
  process.exit(1);
}

fs.writeFileSync(STATE_PATH, NOTE_STORAGE_STATE_JSON);

if (!fs.existsSync(SELECTORS_PATH)) {
  console.error('❌ selectors.json が存在しません');
  process.exit(1);
}

const selectors = JSON.parse(fs.readFileSync(SELECTORS_PATH, 'utf8'));

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: STATE_PATH });
  const page = await context.newPage();

  console.log('note.com にアクセス...');
  await page.goto('https://note.com/');

  console.log('投稿ボタンをクリック...');
  await page.click(selectors.postBtn);

  console.log('タイトル入力...');
  await page.fill(selectors.title, THEME);

  console.log('本文入力...');
  await page.fill(selectors.body, MESSAGE);

  console.log('下書き保存...');
  await page.click(selectors.saveBtn);

  console.log('完了');
  await browser.close();
})();
