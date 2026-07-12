# 変更履歴

## 開発中

### 追加
- 品質管理用ドキュメントとして `CHANGELOG.md`、`KNOWN_ISSUES.md`、`TEST_CHECKLIST.md` を追加。

### 変更
- README.mdに品質管理ドキュメントの位置づけを追記。

### 修正
- なし。

### データ・互換性
- 今回のドキュメント整備では、保存構造、schemaVersion、localStorageキーは変更していない。

### 未対応
- 機能追加、UI変更、計算式変更、GitHub Pages更新、ZIP作成、candidate/release作成は未実施。

## これまでの主な段階

### Ver.1.0
- 重説調査チェックリストの基本機能。
- 所在地、地番、物件種別の入力。
- 状態、メモ、重説反映チェックの管理。
- localStorage保存。
- リセット。
- PCブラウザでの基本動作確認。
- スマートフォン表示対応。ただし、スマホ実機確認は未実施として記録。

### Ver.1.1
- 調査項目を実務向けに拡充。
- 7カテゴリ構成。
- 67項目。
- `checklistData.js` を中心に更新。
- 実案件で使用し、特に問題がなかったことを確認済みとして記録。

### Ver.1.2
- 物件種別ごとの表示分け。
- 土地58項目。
- 戸建62項目。
- マンション38項目。
- スマートフォン表示対応。
- GitHub Pages公開に関する運用記録あり。ただし、公開状態そのものは現在のコードだけでは判定できない。
- `checklistData.js` と `app.js` を更新。
- schemaVersion変更はなし。

### 土地査定 Phase 1A
- `schemaVersion: 1` を保存データに追加。
- JSONバックアップ機能を追加。
- JSONインポート機能を追加。
- schemaVersionがない旧データの読み込み互換に対応。
- localStorageキー `jusetsuResearchToolV1` は維持。

### 土地査定 Phase 1B
- `schemaVersion: 2` に更新。
- 保存データ最上位に `valuation` データを追加。
- 価格査定タブを追加。
- 土地査定入力項目を追加。
- 査定入力の保存・復元に対応。
- JSONバックアップ対象に `valuation` を追加。
- 戸建・マンションでは土地のみ対応の案内を表示。
- この段階では査定計算は未実装として記録。

### 土地査定 Phase 1C-1
- `valuationEngine.js` を追加。
- `window.ValuationEngine` として公開。
- ㎡坪換算関数を追加。
- 中央値計算を追加。
- 平均値計算を追加。
- 指定単位での金額丸めを追加。
- カンマ付き文字列にも対応した安全な数値変換を追加。
- この段階では画面への価格計算反映は未実装として記録。

### 土地査定 Phase 1C-2
- ㎡坪自動換算。
- 路線価参考値。
- 初期想定坪単価。
- 個別補正。
- 補正後坪単価。
- 基準価格。
- 査定中心価格。
- 早期売却価格。
- 売出提案価格。
- 指定単位での価格丸め。
- 算出根拠文生成。
- 入力エラーと補正警告。
- 査定結果カード。
- 計算処理は `valuationEngine.js` に集約し、DOM操作と保存処理は `app.js` が担当。
- schemaVersionは2のまま維持。
### Ver.2.1
- 新タブ「査定履歴」を追加。
- 価格査定画面に「査定を保存」ボタンを追加。
- `appState` に `appraisals: []` を追加。
- 査定履歴は毎回新規追加し、新しい順で一覧表示。
- 履歴一覧クリックで価格査定画面へ読み込み。
- schemaVersionは2のまま維持。
- localStorageキー `jusetsuResearchToolV1` は変更なし。
- 更新機能、削除機能、地域相場連携、CSV、PDF、外部APIは未実装。
### Ver.2.1候補 保存
- `prototypes/ver-2.1-candidate` として保存。
- current側のコードは変更せず、保存先README.mdとCHANGELOG.mdに候補保存記録を追記。
- 査定履歴機能、通常リセット時の履歴保持、JSONバックアップへの履歴含有を候補版として記録。
- schemaVersionは2、localStorageキーは `jusetsuResearchToolV1` のまま。