import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const STATE_PATH = './note-state.json';
const HEADLESS = process.env.HEADLESS !== 'false'; // デフォルト true

// Secrets から note のログイン状態を取得
const NOTE_STATE_JSON = process.env.NOTE_STORAGE_STATE_JSON;
if (!NOTE_STATE_JSON) {
  console.error('❌ note-state.json が存在しません。Secrets (NOTE_STORAGE_STATE_JSON) を確認してください。');
  process.exit(1);
}

// 一時ファイルに展開
fs.writeFileSync(STATE_PATH, NOTE_STATE_JSON, 'utf-8');

// 入力を環境変数から取得
const theme = process.env.THEME || '';
const target = process.env.TARGET || '';
const message = process.env.MESSAGE || '';
const cta = process.env.CTA || '';
const tags = process.env.TAGS || '';
const isPublic = process.env.IS_PUBLIC === 'true';
const dryRun = process.env.DRY_RUN === 'true';

if (!theme || !target || !message || !cta) {
  console.error('❌ 必須入力が不足しています。THEME, TARGET, MESSAGE, CTA を確認してください。');
  process.exit(1);
}

(async () => {
  const browser = await chromium.launch({ headless: HEADLESS });
  const context = await browser.newContext({ storageState: STATE_PATH });
  const page = await context.newPage();

  console.log('note.com にアクセス...');
  await page.goto('https://note.com');

  if (dryRun) {
    console.log('💡 dry_run=true のため投稿はスキップします。');
    await browser.close();
    return;
  }

  console.log('下書き画面を開く...');
  await page.goto('https://note.com/new/note');

  // タイトル入力
  await page.fill('input[name="title"]', theme);

  // 本文入力
  const content = `${message}\n\n想定読者: ${target}\n\n読後アクション: ${cta}`;
  await page.fill('textarea[name="content"]', content);

  // タグ入力（任意）
  if (tags) {
    await page.fill('input[name="tags"]', tags);
  }

  // 公開 or 下書き
  if (isPublic) {
    await page.click('button:text("公開")');
    console.log('✅ 公開しました');
  } else {
    await page.click('button:text("下書き保存")');
    console.log('💾 下書き保存しました');
  }

  await browser.close();
})();
