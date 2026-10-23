# TODO

ブラウザで動く TODO アプリです。素の HTML / CSS / JavaScript (ES modules) で書かれていて、依存パッケージやビルド手順はありません。TODO はブラウザの `localStorage` に保存されます。

## 公開URL

https://sotakafumi.github.io/Todo-Demo/

`master` ブランチに push すると GitHub Pages に自動でデプロイされます。

## ローカルで動かす

```sh
npm start          # http://localhost:3000 で起動
npm run start:lan  # 同じネットワークのスマホから開く場合
npm test           # テストを実行
```

`index.html` を `file://` で直接開くと ES modules が読み込めないため、`npm start` を使ってください。
