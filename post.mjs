import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

// 記事内容のサンプル
// GitHub Actions では workflow_dispatch の inputs で渡す形にできます
const ARTICLE = {
  title: process.env.NOTE_TITLE || '自動生成記事タイトル',
  body: process.env.NOTE_BODY || 'これは自動生成された記事本文です。',
  tags: process.env.NOTE_TAGS || '自動,テスト'
};

// note-state.json の取得
let noteStateJson = process.env.NOTE_STORAGE_STATE_JSON;
if (!noteStateJson) {
  const filePath = path.resolve('./note-state.json');
  if (fs.existsSync(filePath)) {
    noteStateJson = fs.readFileSync(filePath, 'utf-8');
    console.log('✅ ローカルの note-state.json を使用');
  } else {
    console.error('❌ note-state.json が存在しません。Secrets (NOTE_STORAGE_STATE_JSON) またはファイルを確認してください。');
    process.exit(1);
  }
}

(async () => {
  const statePath = './note-state-temp.json';
  fs.writeFileSync(statePath, noteStateJson, 'utf-8');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ storageState: statePath });
  const page = await context.newPage();

  // note.com の新規下書きページ
  await page.goto('https://note.com/new');

  console.log('📝 記事入力中...');

  // タイトル入力
  const titleSelector = 'textarea[placeholder="タイトル"]';
  await page.waitForSelector(titleSelector);
  await page.fill(titleSelector, ARTICLE.title);

  // 本文入力
  const bodySelector = 'div[contenteditable="true"]';
  await page.waitForSelector(bodySelector);
  await page.fill(bodySelector, ARTICLE.body);

  // タグ入力
  const tagSelector = 'input[placeholder="タグ"]';
  await page.waitForSelector(tagSelector);
  const tagsArray = ARTICLE.tags.split(',').map(t => t.trim());
  for (const tag of tagsArray) {
    await page.fill(tagSelector, tag);
    await page.keyboard.press('Enter');
  }

  console.log('✅ 記事入力完了');
  console.log('💡 投稿は手動で確認して保存または公開してください');

  // 完了後ブラウザ閉じる
  await browser.close();

  // 一時ファイル削除
  fs.unlinkSync(statePath);
})();
