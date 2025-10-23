import { chromium } from 'playwright';
import fs from 'fs';

const STATE_PATH = './note-state.json';
const SELECTORS_PATH = './selectors.json';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 指示用ウインドウ作成
  const instructionPage = await context.newPage();
  await instructionPage.setContent(`
    <h3>ログイン後に記事作成を行い下書き保存してください</h3>
    <p>タイトルには「テスト１」を入力</p>
    <p>本文には「テスト２」を入力</p>
    <button id="closeBtn">閉じる</button>
    <script>
      document.getElementById('closeBtn').addEventListener('click', () => {
        window.close();
      });
    </script>
  `);

  await page.goto('https://note.com/login');
  console.log('手動でログインしてください。ログイン後、指示ウインドウの「閉じる」を押してください...');

  try {
    // 最大10分まで待機。閉じられたらresolve
    await instructionPage.waitForEvent('close', { timeout: 600_000 });
    console.log('指示ウインドウが閉じられました。');
  } catch (err) {
    console.warn('タイムアウト発生：指示ウインドウが閉じられませんでした。強制的に進めます。');
    await instructionPage.close().catch(() => {});
  }

  // ログイン状態の保存
  await context.storageState({ path: STATE_PATH });
  console.log('Saved login state to', STATE_PATH);

  const selectors = {
    postBtn: "a[href='/new']",
    title: "input[name='title']",
    body: "textarea[name='body']",
    saveBtn: "button[data-testid='draft-save']"
  };
  fs.writeFileSync(SELECTORS_PATH, JSON.stringify(selectors, null, 2));
  console.log('Saved selectors to', SELECTORS_PATH);

  await browser.close();
})();
