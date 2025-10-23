# Action Note Workflow


Action Note Workflow

このリポジトリは、GitHub Actions を使って note.com への記事作成・下書き投稿を自動化するワークフローです。

1. GitHub Actions の設定

必要なリポジトリシークレット:
- ANTHROPIC_API_KEY: Claude API のキー
- TAVILY_API_KEY: Tavily 検索 API キー
- NOTE_STORAGE_STATE_JSON: note.com のログイン状態(JSON)

ワークフロー実行方法:
1. GitHub Actions タブで "Action Note Workflow" を手動実行
2. 入力パラメータを設定
   - theme: 記事テーマ（必須）
   - target: 想定読者（必須）
   - message: 伝えたい核メッセージ（必須）
   - cta: 読後のアクション（必須）
   - tags: カンマ区切りタグ（任意）
   - is_public: true/false（公開 or 下書き保存）
   - dry_run: true/false（投稿をスキップ）

2. note.com ログイン情報の取得

手動ログインスクリプトの実行:
1. ローカルで Playwright を準備
   npm install
   npx playwright install chromium
2. login-note.mjs を実行して手動ログイン
   node login-note.mjs
3. ブラウザが開くので note.com にログイン
4. 最大5分で自動検知、失敗した場合は Enter キーで手動完了
5. カレントディレクトリに note-state.json が生成されます

GitHub Secret への登録:
1. note-state.json の中身をコピー
2. GitHub の Settings > Secrets and variables > Actions に追加
   - Name: NOTE_STORAGE_STATE_JSON
   - Secret: JSON の内容を貼り付け

注意:
storageState は期限切れになることがあります。期限切れの場合は再度 login-note.mjs を実行して Secret を更新してください。

3. ワークフローの動作

- Research ジョブ: Claude Code SDK を使用して Web リサーチ
- Write ジョブ: Claude Sonnet 4.0 でタイトル・本文・タグを生成
- Fact-check ジョブ: Tavily API で事実確認・本文修正
- Post ジョブ: Playwright で note.com に自動投稿
   - is_public: false → 下書き保存
   - is_public: true → 公開
   - dry_run: true → 投稿をスキップ

4. 注意事項

1. UI変更への対応: note.com 側の UI 変更により、セレクタを調整する必要があります
2. AI生成コンテンツ: 誤情報が含まれる可能性があります。公開前に必ず確認してください
3. セキュリティ: パスワードは GitHub Secret に保存せず、手動ログイン方式を採用
4. storageState の期限: 期限切れ・無効化されることがあります。必要に応じて再取得してください
