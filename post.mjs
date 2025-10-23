import { chromium } from 'playwright';
import fs from 'fs';

const STATE_PATH = './note-state.json';
const DEBUG = process.env.DEBUG === 'true'; // デバッグモード判定

// Secrets と環境変数の読み込み
const {
  NOTE_STORAGE_STATE_JSON,
  THEME,
  TARGET,
  MESSAGE,
  CTA,
  TAGS,
  IS_PUBLIC,
  DRY_RUN
} = process.env;

if (!NOTE_STORAGE_STATE_JSON) {
  console.error('❌ NOTE_STORAGE_STATE_JSON が設定されていません');
  process.exit(1);
}

// note-state.json がなければ Secrets から作成
if (!fs.existsSync(STATE_PATH)) {
  fs.writeFileSync(STATE_PATH, NOTE_STORAGE_STATE_JSON);
  console.log('✅ note-state.json を作成しました');
}

(async () => {
  const browser = await chromium.launch({ headless: !DEBUG });
  const context = await browser.newContext({ storageState: STATE_PATH });
  const page = await context.newPage();

  console.log('note.com の下書き画面を開きます...');
  await page.goto('https://note.com/drafts');

  try {
    // --- セレクタ部分 ---
    const titleSelector = 'input[name="title"]';
    const bodySelector = 'div[contenteditable="true"]';
    const tagSelector = 'input[name="tags"]';
    const publishButtonSelector = 'button[type="submit"]';

    await page.waitForSelector(titleSelector, { timeout: 30000 });
    await page.fill(titleSelector, THEME || 'テストタイトル');

    await page.waitForSelector(bodySelector, { timeout: 30000 });
    await page.fill(bodySelector, MESSAGE || 'テスト本文');

    await page.waitForSelector(tagSelector, { timeout: 30000 });
    await page.fill(tagSelector, TAGS || 'テスト,タグ');

    if (DEBUG) {
      console.log('✅ デバッグモード: ここでブラウザ操作を確認できます');
    } else if (DRY_RUN !== 'true') {
      await page.waitForSelector(publishButtonSelector, { timeout: 30000 });
      if (IS_PUBLIC === 'true') {
        await page.click(publishButtonSelector);
        console.log('✅ 記事を公開しました');
      } else {
        // 下書き保存ボタンをクリックする場合のセレクタが違うかも
        await page.click(publishButtonSelector);
        console.log('✅ 記事を下書き保存しました');
      }
    } else {
      console.log('DRY_RUN=true のため投稿はスキップしました');
    }
  } catch (error) {
    console.error('❌ 投稿処理中にエラーが発生:', error);
  }

  if (!DEBUG) await browser.close();
})();
