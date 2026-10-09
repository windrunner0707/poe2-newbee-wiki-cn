import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';

const dir = path.dirname(fileURLToPath(import.meta.url));
const pages = [
  { source: '第一次游玩.md', output: '第一次游玩.html', short: '第一次游玩', desc: '前 60 分钟先认任务、技能、角色和背包界面。', number: '01', track: 'main' },
  { source: '新手起步.md', output: '新手起步.html', short: '新手起步', desc: '从建角到战役结束，按阶段知道下一步做什么。', number: '02', track: 'main' },
  { source: '看懂角色面板.md', output: '看懂角色面板.html', short: '角色面板', desc: '看懂生命、精魂、属性与抗性，学会换装后复查。', number: '03', track: 'main' },
  { source: '开荒.md', output: '开荒.html', short: '开荒奖励', desc: '按章节核对必打 Boss、天赋点、抗性、精魂和其他永久奖励。', number: '04', track: 'main' },
  { source: '看懂一件装备.md', output: '看懂一件装备.html', short: '看懂装备', desc: '读懂底材、装备要求、物品等级、随机词缀和孔位。', number: '05', track: 'main' },
  { source: '装备交易.md', output: '装备交易.html', short: '装备与交易', desc: '学会换装、设置过滤器，完成第一次买卖。', number: '06', track: 'main' },
  { source: '战役结束到第一张图.md', output: '战役结束到第一张图.html', short: '第一张图', desc: '跟异界引导操作地图装置，完成第一张异界地图。', number: '07', track: 'main' },
  { source: '异界.md', output: '异界.html', short: '异界路线', desc: '前十图升级装备，再推进高塔、要塞与刷图机制。', number: '08', track: 'main' },
  { source: '新手做装备.md', output: '新手做装备.html', short: '新手做装备', desc: '从选底材到停手判断，亲手做一件能用的过渡装备。', track: 'reference' },
  { source: '工具与BD.md', output: '工具与BD.html', short: '工具与 BD', desc: '收藏必要外部工具，学会用 poe.ninja 看懂一套 BD。', track: 'reference' },
  { source: '卡关排查.md', output: '卡关排查.html', short: '卡关排查', desc: '打不过、容易死、缺图或没收入时逐项检查。', track: 'reference' },
  { source: '名词与黑话.md', output: '名词与黑话.html', short: '名词与黑话', desc: '查询常用名词、玩家缩写与中英对照。', track: 'reference' },
  { source: '游玩乐趣与避雷.md', output: '游玩乐趣与避雷.html', short: '乐趣与避雷', desc: '给自己设小目标，避开过度投入与旧攻略陷阱。', track: 'reference' },
];
const mainPages = pages.filter(p => p.track === 'main');
const escapeHtml = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

function shell(title, body, {home = false, current = null} = {}) {
  const nav = home
    ? `<a href="index.html" aria-current="page">首页</a><a href="第一次游玩.html">从这里开始</a><a href="卡关排查.html">卡关排查</a>`
    : `<a href="index.html">首页</a><a href="index.html#guide-list">全部指南</a><span class="current-page" aria-current="page">${escapeHtml(current.short)}</span>`;
  const source = current ? `<a href="${current.source}">阅读本篇 Markdown</a>` : '<a href="README.md">关于本站</a>';
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark"><title>${escapeHtml(title)} · POE2 指南</title>
<link rel="stylesheet" href="style.css"></head>
<body id="top" class="${home ? 'home' : 'article-page'}"><header class="site-header"><div class="header-inner"><a class="brand" href="index.html"><span class="brand-mark">P2</span><span>流放之路 2 指南</span></a><nav aria-label="主导航">${nav}</nav></div></header>${body}<footer class="site-footer">内容以游戏内当前版本为准 · ${source}</footer>
<script src="site.js" defer></script></body></html>`;
}

for (const p of pages) {
  const raw = fs.readFileSync(path.join(dir, p.source), 'utf8');
  const headings = [];
  const usedIds = new Map();
  const renderer = {
    heading({text, depth}) {
      const plainText = text.replace(/<[^>]*>/g, '');
      const slug = plainText.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'section';
      const count = (usedIds.get(slug) || 0) + 1;
      usedIds.set(slug, count);
      const id = count === 1 ? slug : `${slug}-${count}`;
      if (depth === 2 || depth === 3) headings.push({id, text: plainText, depth});
      return `<h${depth} id="${id}">${text}</h${depth}>`;
    },
    link({href, title, text}) {
      const [target, fragment] = href.split('#', 2);
      const page = pages.find(p => p.source === target);
      const url = page ? page.output + (fragment ? `#${fragment}` : '') : href;
      const external = /^https?:\/\//.test(url);
      return `<a href="${escapeHtml(url)}"${title ? ` title="${escapeHtml(title)}"` : ''}${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${text}</a>`;
    },
    image({href, title, text}) {
      return `<img src="${escapeHtml(href)}" alt="${escapeHtml(text)}"${title ? ` title="${escapeHtml(title)}"` : ''} loading="lazy" referrerpolicy="no-referrer">`;
    }
  };
  // Marked can misread emphasis boundaries next to Chinese punctuation.
  const normalized = raw.replace(/\*\*([^*\n]+)\*\*/g, (_, content) => `<strong>${content}</strong>`);
  const html = new Marked({gfm: true, renderer}).parse(normalized)
    .replaceAll('<td>[ ]</td>', '<td><input type="checkbox" aria-label="完成此项"></td>')
    .replace(/<p>(<img [^>]*>)<\/p>\s*<p><em>([\s\S]*?)<\/em><\/p>/g, '<figure>$1<figcaption>$2</figcaption></figure>')
    .replaceAll('<table>', '<div class="table-shell"><div class="table-hint" aria-hidden="true">↔ 左右滑动查看完整表格</div><div class="table-scroll" role="region" tabindex="0" aria-label="可横向滚动的表格"><table>')
    .replaceAll('</table>', '</table></div></div>');
  const toc = headings.map(h => `<a class="toc-${h.depth}" href="#${h.id}">${escapeHtml(h.text)}</a>`).join('');
  const next = p.track === 'main' ? mainPages[mainPages.indexOf(p) + 1] : null;
  const kicker = p.track === 'main' ? `主线 ${p.number} / ${String(mainPages.length).padStart(2, '0')}` : '按需查阅 · 专题';
  const nextLink = next ? `<a href="${next.output}">继续主线：${next.short} →</a>` : '<a href="index.html#guide-list">← 返回全部指南</a>';
  const glossaryLink = p.source === '名词与黑话.md' ? '' : '<a class="glossary-link" href="名词与黑话.html">看不懂词？查中英对照 →</a>';
  const body = `<div class="reading-layout"><aside class="sidebar"><a class="back-link" href="index.html#guide-list">← 全部指南</a><details class="toc-panel" open><summary>本页目录</summary><nav class="toc" aria-label="本页目录">${toc}</nav></details>${glossaryLink}</aside><main class="article-wrap"><div class="article-kicker">${kicker}</div><article class="prose" data-page="${p.output}">${html}</article><div class="article-end">${nextLink}<a class="back-to-top" href="#top">↑ 返回顶部</a></div></main></div>`;
  fs.writeFileSync(path.join(dir, p.output), shell(p.short, body, {current:p}));
}
const card = p => `<a class="guide-card" href="${p.output}"><span class="card-number">${p.track === 'main' ? `主线 ${p.number} / ${String(mainPages.length).padStart(2, '0')}` : '按需查阅'}</span><h3>${p.short}</h3><p>${p.desc}</p><span class="card-arrow">阅读指南 ↗</span></a>`;
const mainCards = mainPages.map(card).join('');
const referenceCards = pages.filter(p => p.track === 'reference').map(card).join('');
const index = `<main class="landing"><div class="eyebrow">PATH OF EXILE 2 · 中文速查</div><h1>从第一次建角到<br><em>异界刷图</em></h1><p class="lead">按八篇必读主线从零走到第一张图与前十张地图。做装备、找 BD、排查卡关和查黑话时，再打开对应专题。</p><a class="start-button" href="第一次游玩.html">从第一次游玩开始 <span aria-hidden="true">→</span></a><nav class="journey" aria-label="按进度阅读"><a href="第一次游玩.html">① 第一次进游戏<span>认任务、技能和背包</span></a><a href="开荒.html">② 推战役<span>查奖励与升华</span></a><a href="战役结束到第一张图.html">③ 完成第一张图<span>照六步操作地图装置</span></a><a href="异界.html#前十张图-建立装备升级循环">④ 稳定刷图<span>前十图升级装备</span></a></nav><div class="quick-links" aria-label="按问题查指南"><span>随时查阅：</span><a href="名词与黑话.html">名词与黑话</a><a href="卡关排查.html">卡关排查</a><a href="游玩乐趣与避雷.html">乐趣与避雷</a></div><details class="all-guides" id="guide-list"><summary>查看全部 ${pages.length} 篇指南</summary><h2>必读主线</h2><div class="guide-grid">${mainCards}</div><h2>按需查阅</h2><div class="guide-grid">${referenceCards}</div></details><p class="home-note">教学示意图可离线查看；部分游戏截图来自文内标注的外部来源，显示需要网络连接。清单进度保存在当前浏览器。</p></main>`;
fs.writeFileSync(path.join(dir, 'index.html'), shell('首页', index, {home:true}));
console.log('Generated index.html and', pages.map(p => p.output).join(', '));
