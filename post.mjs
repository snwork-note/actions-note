import { chromium } from "playwright";
import fs from "fs";

// ====== 設定 ======
const STATE_PATH = "./note-state.json"; // Secrets から展開される
const OUTPUT_PATH = "./.note-artifacts/final_post.json"; // 記事生成結果(JSON)

// ====== 環境変数 ======
const isPublic = process.env.IS_PUBLIC === "true";
const dryRun = process.env.DRY_RUN === "true";

// ====== 記事内容の読み込み ======
if (!fs.existsSync(OUTPUT_PATH)) {
  console.error("❌ 記事データが見つかりません。まず write.mjs を実行して final_post.json を生成してください。");
  process.exit(1);
}

const article = JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf8"));
const { title, body, tags } = article;

if (!title || !body) {
  console.error("❌ 記事データが不完全です（title または body が空）。");
  process.exit(1);
}

// ====== ログイン状態を復元 ======
if (!fs.existsSync(STATE_PATH)) {
  console.error("❌ note-state.json が存在しません。Secrets (NOTE_STORAGE_STATE_JSON) が正しく展開されているか確認してください。");
  process.exit(1);
}

console.log("🚀 note.com へアクセスを開始...");

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: STATE_PATH });
const page = await context.newPage();

try {
  await page.goto("https://note.com/notes/new", { timeout: 60000 });
  await page.waitForSelector('input[placeholder="タイトル"]', { timeout: 15000 });

  console.log("📝 記事作成を開始します...");

  // タイトル
  await page.fill('input[placeholder="タイトル"]', title);
  console.log("✅ タイトル入力完了");

  // 本文
  await page.fill('textarea', body.slice(0, 8000));
  console.log("✅ 本文入力完了");

  // タグ（任意）
  if (Array.isArray(tags) && tags.length > 0) {
    for (const tag of tags) {
      try {
        await page.click('button:has-text("タグ")');
        await page.fill('input[placeholder="タグを入力"]', tag);
        await page.keyboard.press("Enter");
        await new Promise(r => setTimeout(r, 200));
      } catch (e) {
        console.warn(`⚠️ タグ「${tag}」の追加に失敗しました:`, e.message);
      }
    }
  }

  // 投稿 or 下書き or dry_run
  if (dryRun) {
    console.log("💤 dry_run モード: 投稿をスキップしました。");
  } else if (isPublic) {
    console.log("🌐 公開モード: 投稿ボタンをクリックします...");
    await page.click('button:has-text("公開")');
    console.log("✅ 記事を公開しました！");
  } else {
    console.log("💾 下書きモード: 下書き保存ボタンをクリックします...");
    await page.click('button:has-text("下書き保存")');
    console.log("✅ 下書きとして保存しました！");
  }

} catch (error) {
  console.error("⚠️ 投稿処理中にエラーが発生:", error);
} finally {
  await browser.close();
  console.log("🧹 ブラウザを閉じました。");
}
