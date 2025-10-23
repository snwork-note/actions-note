import { chromium } from "playwright";
import fs from "fs";
import path from "path";

async function ensurePlaywrightBrowsers() {
  try {
    console.log("🧩 Playwright のブラウザを確認中...");
    const browsersDir = path.join(process.env.HOME || "", ".cache/ms-playwright");
    if (!fs.existsSync(browsersDir)) {
      console.log("📦 Playwright ブラウザが未インストールのため、インストールを実行します...");
      const { execSync } = await import("child_process");
      execSync("npx playwright install --with-deps", { stdio: "inherit" });
    }
  } catch (err) {
    console.error("⚠️ ブラウザ確認中にエラー:", err);
  }
}

async function prepareStateFile() {
  const statePath = "./note-state.json";

  if (!fs.existsSync(statePath)) {
    console.error("❌ note-state.json が存在しません。ログイン情報が必要です。");
    process.exit(1);
  }

  let raw = fs.readFileSync(statePath, "utf8").trim();

  // JSONパースを試す
  try {
    JSON.parse(raw);
    console.log("✅ note-state.json は正常な JSON 形式です。");
  } catch {
    console.warn("⚠️ note-state.json が JSON 形式でないため、Base64 デコードを試みます...");
    try {
      const decoded = Buffer.from(raw, "base64").toString("utf8");
      JSON.parse(decoded); // デコード結果が正しいか確認
      fs.writeFileSync(statePath, decoded);
      console.log("✅ Base64 デコード成功: note-state.json を修復しました。");
    } catch (err) {
      console.error("💥 note-state.json のデコードに失敗しました。");
      console.error(err);
      process.exit(1);
    }
  }
}

async function main() {
  console.log("🟢 note.com にアクセス開始...");

  await ensurePlaywrightBrowsers();
  await prepareStateFile();

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    storageState: "./note-state.json",
  });

  const page = await context.newPage();

  try {
    // note にアクセス
    await page.goto("https://note.com", { waitUntil: "domcontentloaded" });
    console.log("✅ note.com にアクセスしました。");

    // 投稿ボタン
    console.log("🟢 投稿ボタンをクリック...");
    await page.click('a[href="/new"]', { timeout: 60000 });

    // ページ遷移を待つ
    await page.waitForLoadState("domcontentloaded");
    console.log("✅ 新規投稿ページに遷移しました。");

    // 入力フィールド読み込み
    const selectors = JSON.parse(fs.readFileSync("./selectors.json", "utf8"));

    console.log("🟢 タイトル入力中...");
    await page.fill(selectors.title, process.env.THEME || "テストタイトル");

    console.log("🟢 本文入力中...");
    await page.fill(selectors.body, process.env.MESSAGE || "本文テストです。");

    console.log("🟢 下書き保存...");
    await page.click(selectors.saveBtn, { timeout: 60000 });

    console.log("✅ 下書き保存が完了しました。");

    if (process.env.IS_PUBLIC === "true") {
      console.log("🌐 公開モード: 実際に公開する処理をここに追加できます。");
    } else {
      console.log("📝 下書きモードで完了しました。");
    }

    await browser.close();
    console.log("🎉 投稿フローが正常に完了しました。");
  } catch (err) {
    console.error("💥 エラー:", err);
    await browser.close();
    process.exit(1);
  }
}

main();
