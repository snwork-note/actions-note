// login-note-ui.mjs
import { chromium } from 'playwright';
import fs from 'fs';

const STATE_PATH = './note-state.json';
const SELECTORS_PATH = './selectors.json';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 指示用ウインドウ
  const uiPage = await context.newPage();
  await uiPage.setContent(`
    <html>
      <body style="font-family:sans-serif;font-size:16px;margin:20px;">
        <p>ログイン後、以下の操作を行ってください：</p>
        <ol>
          <li>投稿ボタンクリック → 属性を保存</li>
          <li>タイトル入力 → 「テスト１」</li>
          <li>本文入力 → 「テスト２」</li>
          <li>下書き保存ボタンクリック</li>
        </ol>
        <button id="closeBtn" style="padding:10px 20px;">完了して閉じる</button>
        <script>
          const btn = document.getElementById('closeBtn');
          btn.onclick = () => { window.close(); };
        </script>
      </body>
    </html>
  `);

  // note.com ログインページ
  await page.goto('https://note.com/login');
  console.log('手動でログインしてください。ログイン完了を確認後、補助ウインドウの「完了して閉じる」を押してください。');

  // 待機：ユーザーが補助ウインドウのボタンを押すまで
  await uiPage.waitForEvent('close');

  // ログイン状態を保存
  await context.storageState({ path: STATE_PATH });
  console.log('ログイン状態を保存しました:', STATE_PATH);

  // 属性を保存（例として固定セレクタ。実際はページを見ながら調整）
  const selectors = {
    postBtn: 'button[data-testid="post-create"]',
    title: 'input[name="title"]',
    body: 'textarea[name="body"]',
    saveBtn: 'button[data-testid="draft-save"]'
  };
  fs.writeFileSync(SELECTORS_PATH, JSON.stringify(selectors, null, 2), 'utf-8');
  console.log('セレクタを保存しました:', SELECTORS_PATH);

  await browser.close();
})();
