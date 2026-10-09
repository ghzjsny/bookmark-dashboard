'use strict';
// 仅构建期使用：用 pinyin 包生成「Unicode 码点 -> 拼音首字母」紧凑查找表。
// 运行时 app.js 通过 window.BD_PINYIN 读取，零依赖。
const fs = require('fs');
const path = require('path');
const pinyinPkg = require('pinyin');
const pinyin = pinyinPkg.pinyin;

const START = 0x4e00; // CJK 统一表意文字起点
const END = 0x9fff;   // 终点（覆盖常用汉字）
const buckets = {};   // letter -> 该首字母下的字符（按码点拼接成字符串）
let known = 0;

function firstLetter(ch) {
  const r = pinyin(ch, { heteronym: false });
  let s = r && r[0] && r[0][0];
  if (!s) return '';
  // 去掉声调符号（ā -> a），再取首字母
  s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (/^[a-z]/i.test(s)) return s[0].toUpperCase();
  return '';
}

for (let cp = START; cp <= END; cp++) {
  const ch = String.fromCharCode(cp);
  const fl = firstLetter(ch);
  if (fl) {
    buckets[fl] = (buckets[fl] || '') + ch;
    known++;
  }
}

// 额外覆盖扩展 A 区（3400-4DBF）常用字
for (let cp = 0x3400; cp <= 0x4dbf; cp++) {
  const ch = String.fromCharCode(cp);
  const fl = firstLetter(ch);
  if (fl) {
    buckets[fl] = (buckets[fl] || '') + ch;
    known++;
  }
}

const letters = Object.keys(buckets).sort();
const lines = [];
lines.push('// 自动生成：Unicode 码点 -> 拼音首字母 查找表（构建期由 pinyin 包生成，运行时零依赖）。');
lines.push('// 通过 window.BD_PINYIN[首字母] = "该首字母下的所有汉字（按码点拼接）" 提供。');
lines.push('window.BD_PINYIN = {');
letters.forEach((L, i) => {
  const comma = i < letters.length - 1 ? ',' : '';
  lines.push('  ' + JSON.stringify(L) + ': ' + JSON.stringify(buckets[L]) + comma);
});
lines.push('};');

const out = lines.join('\n');
const outPath = path.join(__dirname, 'pinyin-initials.js');
fs.writeFileSync(outPath, out, 'utf8');

console.log('已知汉字数:', known);
console.log('覆盖首字母:', letters.join(''));
console.log('输出文件:', outPath);
console.log('文件大小(字节):', Buffer.byteLength(out, 'utf8'));
