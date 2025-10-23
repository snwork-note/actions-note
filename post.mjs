import { chromium } from "playwright";
import fs from "fs";

const NOTE_STATE_PATH = "./note-state.json";
const SELECTORS_PATH = "./selectors.json";

async function main() {
  console.log("🟢 note.com にアクセス開始...");

  if (!fs.existsSync(NOTE_STATE_PATH)) {
    console.error("❌ note-state.json が存在しません。ログイン情報が必要です。");
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: NOTE_STATE_PATH,
  });
  const page = await context.newPage();

  await page.goto("https://note.com/", { waitUntil: "domcontentloaded" });

  // ログインしているかチェック
  if (await page.locator('a[href="/login"]').isVisible().catch(() => false)) {
    console.error("❌ ログイン状態が切れています。login-note.mjs を再実行してください。");
    await browser.close();
    process.exit(1);
  }

  console.log("✅ ログイン済みを確認");

  // 投稿ボタンの候補を探索
  const selectors = [
    'a[href="/new"]',
    'a[href*="/new"]',
    'a[href^="/n/"]',
    'a[href*="note.com/"] >> text=投稿',
    'button:has-text("投稿")'
  ];

  let postBtnFound = false;
  for (const selector of selectors) {
    const el = page.locator(selector);
    if (await el.first().isVisible().catch(() => false)) {
      console.log(`🟢 投稿ボタンを検出: ${selector}`);
      await el.first().click({ timeout: 60000 });
      postBtnFound = true;
      break;
    }
  }

  if (!postBtnFound) {
    console.error("❌ 投稿ボタンが見つかりません。DOM構造が変わった可能性があります。");
    await browser.close();
    process.exit(1);
  }

  console.log("📝 記事作成ページを開く...");

  // タイトル・本文入力
  const selectorsData = JSON.parse(fs.readFileSync(SELECTORS_PATH, "utf-8"));

  await page.waitForSelector(selectorsData.title, { timeout: 60000 });
  await page.fill(selectorsData.title, process.env.THEME || "タイトル未設定");

  await page.waitForSelector(selectorsData.body, { timeout: 60000 });
  await page.fill(selectorsData.body, process.env.MESSAGE || "本文未設定");

  console.log("💾 下書き保存ボタンをクリック...");
  await page.waitForSelector(selectorsData.saveBtn, { timeout: 60000 });
  await page.click(selectorsData.saveBtn);

  console.log("✅ 下書き保存完了！");

  await browser.close();
}

main().catch((err) => {
  console.error("💥 エラー:", err);
  process.exit(1);
});
