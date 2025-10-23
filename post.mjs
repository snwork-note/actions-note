import fs from 'fs';
import { chromium } from 'playwright';

// GitHub Actions で Secret を展開してファイルに書き出す
const STATE_PATH = './note-state.json';

if (!process.env.NOTE_STORAGE_STATE_JSON) {
  console.error('❌ note-state.json が存在しません。Secrets (NOTE_STORAGE_STATE_JSON) を確認してください。');
  process.exit(1);
}

fs.writeFileSync(STATE_PATH, process.env.NOTE_STORAGE_STATE_JSON);

// Playwright でブラウザを起動
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: STATE_PATH });
  const page = await context.newPage();

  try {
    // Note にアクセスして下書き/公開
    await page.goto('https://note.com/');
    console.log('✅ ブラウザ起動・storageState 読み込み成功');
    
    // 実際の投稿処理はここに記述
    // 例: page.goto('https://note.com/create'); page.fill(...); page.click(...)

  } catch (err) {
    console.error('❌ 投稿処理でエラー:', err);
  } finally {
    await browser.close();
  }
})();
