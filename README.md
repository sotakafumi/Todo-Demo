# TODO

ブラウザで動く TODO アプリです。Next.js (App Router) と TypeScript で書かれていて、静的ファイルとして書き出して配信します。TODO はブラウザの `localStorage` に保存されます。

## 公開URL

https://sotakafumi.github.io/Todo-Demo/

`master` ブランチに push すると、GitHub Actions がビルドして GitHub Pages にデプロイします。

## ローカルで動かす

Node.js 24 以上が必要です。

```sh
npm install
npm run dev        # 開発サーバー (http://localhost:3000)
npm test           # テストを実行
npm run build      # out/ に静的ファイルを書き出す
npm start          # out/ を http://localhost:3000 で配信
npm run start:lan  # out/ を同じネットワークのスマホからも開けるように配信
```
