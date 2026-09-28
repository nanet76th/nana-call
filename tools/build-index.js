#!/usr/bin/env node
/*
 * data/ 以下の .clrc ファイルを走査して、曲一覧 index.json を生成する。
 * 生成と同時に、各ファイルを検証する。
 *
 * 使い方:
 *   node tools/build-index.js [--parser clrc-parser.js のパス] [--out 出力先]
 *
 *   --parser  省略時は ../lrc-call-extension/src/clrc-parser.js
 *   --out     省略時は index.json
 *
 * 次の場合はエラーとして終了コード 1 で終わる:
 *   - ファイル名 (曲ID) に使えない文字が含まれる
 *   - [yt:動画ID] タグが無い
 * パーサーの警告は表示するだけで、エラーにはしない。
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
// player.html (lrc-call-extension) の曲ID の制約と合わせる
const SONG_ID_RE = /^[\w-]+(\/[\w-]+)*$/;
const IN_ACTIONS = process.env.GITHUB_ACTIONS === 'true';

function parseArgs(argv) {
  const args = {
    parser: path.resolve(ROOT, '../lrc-call-extension/src/clrc-parser.js'),
    out: path.join(ROOT, 'index.json'),
  };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--parser') args.parser = path.resolve(argv[++i]);
    else if (argv[i] === '--out') args.out = path.resolve(argv[++i]);
    else throw new Error(`不明な引数です: ${argv[i]}`);
  }
  return args;
}

function findClrcFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return findClrcFiles(full);
    return entry.isFile() && entry.name.endsWith('.clrc') ? [full] : [];
  });
}

// GitHub Actions 上ではファイル・行に紐づいた注釈として出す
function report(level, file, line, message) {
  const rel = path.relative(ROOT, file);
  if (IN_ACTIONS) {
    console.log(`::${level} file=${rel}${line ? `,line=${line}` : ''}::${message}`);
  } else {
    console.log(`${level}: ${rel}${line ? `:${line}` : ''}: ${message}`);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const CLRC = require(args.parser);

  const songs = [];
  let errors = 0;

  for (const file of findClrcFiles(DATA_DIR)) {
    const id = path.relative(DATA_DIR, file).split(path.sep).join('/').replace(/\.clrc$/, '');
    if (!SONG_ID_RE.test(id)) {
      report('error', file, null, 'ファイル名には英数字・_・- だけを使ってください');
      errors++;
      continue;
    }

    const parsed = CLRC.parse(fs.readFileSync(file, 'utf8'));
    parsed.warnings.forEach((w) => report('warning', file, w.line, w.message));
    if (!parsed.videoId) {
      report('error', file, null, '[yt:動画ID] タグがありません');
      errors++;
      continue;
    }

    const { meta } = parsed;
    songs.push({
      id,
      title: meta.ti || id,
      artist: meta.ar || '',
      album: meta.al || '',
      by: meta.by || '',
      videoId: parsed.videoId,
      version: parsed.version,
    });
  }

  if (errors > 0) {
    console.error(`${errors} 件のエラーがあります`);
    process.exit(1);
  }

  songs.sort((a, b) => a.id.localeCompare(b.id));
  fs.mkdirSync(path.dirname(args.out), { recursive: true });
  fs.writeFileSync(args.out, JSON.stringify({ songs }, null, 2) + '\n');
  console.log(`${songs.length} 曲を ${path.relative(process.cwd(), args.out) || args.out} に書き出しました`);
}

main();
