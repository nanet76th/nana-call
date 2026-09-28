# nana-call

[CLRC](https://github.com/nanet76th/lrc-call-extension) ファイルのライブラリです。GitHub Pages で公開しています。

- 曲一覧: https://nanet76th.github.io/nana-call/
- 再生ページ: `https://nanet76th.github.io/lrc-call-extension/player.html?lib=nana-call&song=曲ID`

## 構成

| パス | 内容 |
| --- | --- |
| `data/` | CLRC ファイル。サブディレクトリに分けてもよい |
| `index.html` | 曲一覧ページ (`index.json` を読み込んで表示) |
| `tools/build-index.js` | `data/` を走査して `index.json` を生成・検証するスクリプト |
| `.github/workflows/pages.yml` | `index.json` を生成して GitHub Pages にデプロイする |

## 曲の追加

1. `data/` に `.clrc` ファイルを置いてコミットする
   - ファイル名 (拡張子を除いた `data/` からの相対パス) が曲ID になる。英数字・`_`・`-` だけを使う
     (例: `data/nana-mizuki/eternal-blaze.clrc` → 曲ID `nana-mizuki/eternal-blaze`)
   - `[yt:動画ID]` タグは必須
   - `[ti:曲名]` `[ar:アーティスト]` `[al:アルバム]` `[by:作成者]` を書くと一覧に表示される
2. `main` に push すると GitHub Actions が `index.json` を生成し、Pages にデプロイする
   - 曲ID が不正なファイルや `[yt:]` が無いファイルがあるとビルドが失敗する
   - パーサーの警告は Actions の注釈として表示される (ビルドは失敗しない)
   - プルリクエストでは検証だけを行い、デプロイはしない

## ローカルでの確認

`lrc-call-extension` を隣のディレクトリに clone しておく。

```sh
node tools/build-index.js   # index.json を生成・検証
npx serve .                 # index.html を表示して確認
```

## 初期設定 (GitHub)

Settings → Pages → Build and deployment の Source を **GitHub Actions** にする。

## ライセンス

`index.html`・`tools/`・`.github/` などのプログラムは [MIT License](LICENSE) です。

`data/` の CLRC ファイルに含まれる歌詞は MIT License の対象外で、その著作権は各権利者に帰属します。
