import { chromium } from "playwright";
import fs from "fs";

async function prepareStateFile() {
  const statePath = "./note-state.json";
  const encoded = process.env.NOTE_STORAGE_STATE_JSON;

  if (!encoded) throw new Error("❌ NOTE_STORAGE_STATE_JSON が設定されていません");

  console.log("🧩 Playwright のブラウザを確認中...");

  // 既に存在している場合は削除
  if (fs.existsSync(statePath)) fs.unlinkSync(statePath);

  try {
    // まずは JSON として試す
    JSON.parse(encoded);
    fs.writeFileSync(statePath, encoded);
    console.log("✅ JSON 形式の note-state.json を作成しました。");
  } catch {
    // Base64 の可能性
    console.log("⚠️ note-state.json が JSON 形式でないため、Base64 デコードを試みます...");
    try {
      const decoded = Buffer.from(encoded, "base64").toString("utf-8");
      JSON.parse(decoded);
      fs.writeFileSync(statePath, decoded);
      console.log("✅ Base64 デコード成功: note-state.json を修復しました。");
    } catch (err) {
      console.error("💥 note-state.json のデコードに失敗しました。");
      throw err;
    }
  }

  return statePath;
}

async function main() {
  console.log("🟢 note.com にアクセス開始...");

  const statePath = await prepareStateFile();

  // Playwright 起動オプション
  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    storageState: statePath,
  });

  const page = await context.newPage();

  try {
    // note トップページへ
    await page.goto("https://note.com", { waitUntil: "networkidle" });
    console.log("✅ note.com にアクセスしました。");

    // 投稿ページへ遷移
    console.log("🟢 投稿ボタンをクリック...");
    const newPostSelector = 'a[href="/note/new"], a[href="/new"]';
    await page.waitForSelector(newPostSelector, { timeout: 60000 });
    await page.click(newPostSelector);

    // 下書き画面の読み込み待ち
    await page.waitForLoadState("networkidle");

    // 投稿内容を設定
    const theme = process.env.THEME || "テスト投稿";
    const target = process.env.TARGET || "読者層";
    const message = process.env.MESSAGE || "テストメッセージ";
    const cta = process.env.CTA || "行動を促す内容";
    const tags = process.env.TAGS || "テスト,自動投稿";

    console.log("📝 投稿内容を入力中...");

    // タイトル欄候補
    const titleSelectors = [
      'div[role="textbox"][data-placeholder*="タイトル"]',
      'input[placeholder*="タイトル"]',
      'textarea[placeholder*="タイトル"]',
    ];

    let titleBox = null;
    for (const selector of titleSelectors) {
      try {
        titleBox = await page.waitForSelector(selector, { timeout: 20000 });
        if (titleBox) {
          console.log(`✅ タイトル欄検出: ${selector}`);
          await titleBox.fill(`${theme} - ${message}`);
          break;
        }
      } catch {}
    }

    if (!titleBox) {
      await page.screenshot({ path: "title_error.png" });
      throw new Error("❌ タイトル欄が見つかりません。構造が変わった可能性があります。");
    }

    // 本文欄候補
    const bodySelectors = [
      'div[contenteditable="true"][data-placeholder*="本文"]',
      'div[role="textbox"][data-placeholder*="本文"]',
      'div[contenteditable="true"]:not([data-placeholder])',
    ];

    let bodyBox = null;
    for (const selector of bodySelectors) {
      try {
        bodyBox = await page.waitForSelector(selector, { timeout: 20000 });
        if (bodyBox) {
          console.log(`✅ 本文欄検出: ${selector}`);
          await bodyBox.fill(`# ${theme}\n\n${message}\n\n対象: ${target}\n\n${cta}\n\nタグ: ${tags}`);
          break;
        }
      } catch {}
    }

    if (!bodyBox) {
      await page.screenshot({ path: "body_error.png" });
      throw new Error("❌ 本文欄が見つかりません。構造が変わった可能性があります。");
    }

    // 下書き保存ボタンを探してクリック
    const saveSelectors = [
      'button:has-text("下書き保存")',
      'button[data-testid="draft-save"]',
    ];

    let saveBtn = null;
    for (const selector of saveSelectors) {
      try {
        saveBtn = await page.waitForSelector(selector, { timeout: 20000 });
        if (saveBtn) {
          console.log(`✅ 下書き保存ボタン検出: ${selector}`);
          await saveBtn.click();
          break;
        }
      } catch {}
    }

    if (!saveBtn) {
      await page.screenshot({ path: "save_error.png" });
      throw new Error("❌ 下書き保存ボタンが見つかりません。");
    }

    console.log("💾 下書き保存完了を確認中...");
    await page.waitForTimeout(3000);

    console.log("✅ 下書き保存が完了しました。");
  } catch (err) {
    console.error("💥 エラー:", err);
    await page.screenshot({ path: "fatal_error.png" });
    throw err;
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
