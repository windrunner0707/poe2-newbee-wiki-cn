import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';

const dir = path.dirname(fileURLToPath(import.meta.url));
const pages = [
  { source: '新手起步.md', output: '新手起步.html', short: '新手起步', desc: '从建角到第一张图，按阶段知道下一步做什么。', number: '01' },
  { source: '工具与BD.md', output: '工具与BD.html', short: '工具与 BD', desc: '收藏必要外部工具，学会用 poe.ninja 看懂一套 BD。', number: '02' },
  { source: '开荒.md', output: '开荒.html', short: '开荒奖励', desc: '按章节核对必打 Boss、天赋点、抗性、精魂和其他永久奖励。', number: '03' },
  { source: '装备交易.md', output: '装备交易.html', short: '装备与交易', desc: '学会换装、设置过滤器，完成第一次买卖。', number: '04' },
  { source: '卡关排查.md', output: '卡关排查.html', short: '卡关排查', desc: '打不过、容易死、缺图或没收入时逐项检查。', number: '05' },
  { source: '异界.md', output: '异界.html', short: '异界路线', desc: '按任务顺序解锁异界天赋，稳定刷图并开始积累神圣石。', number: '06' },
];
const escapeHtml = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const marked = new Marked({ gfm: true, breaks: false });

function shell(title, body, {home = false} = {}) {
  const nav = [pages[0], pages[1], pages[5]].map(p => `<a href="${p.output}">${p.short}</a>`).join('');
  const sources = pages.map(p => `<a href="${p.source}">${p.short} Markdown</a>`).join(' · ');
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark"><title>${escapeHtml(title)} · POE2 指南</title>
<link rel="stylesheet" href="style.css"></head>
<body class="${home ? 'home' : 'article-page'}"><header class="site-header"><div class="header-inner"><a class="brand" href="index.html"><span class="brand-mark">P2</span><span>流放之路 2 指南</span></a><nav aria-label="主导航"><a href="index.html"${home?' aria-current="page"':''}>首页</a>${nav}</nav></div></header>${body}<footer class="site-footer">内容以游戏内当前版本为准 · ${sources}</footer>
<script src="site.js" defer></script></body></html>`;
}

for (const p of pages) {
  const raw = fs.readFileSync(path.join(dir, p.source), 'utf8');
  const headings = [];
  let count = 0;
  const renderer = {
    heading({text, depth}) {
      const id = `section-${++count}`;
      if (depth === 2 || depth === 3) headings.push({id, text: text.replace(/<[^>]*>/g, ''), depth});
      return `<h${depth} id="${id}">${text}</h${depth}>`;
    },
    link({href, title, text}) {
      const url = pages.find(p => p.source === href)?.output || href;
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
    .replaceAll('<td>[ ]</td>', '<td><input type="checkbox" aria-label="完成此项"></td>');
  const toc = headings.map(h => `<a class="toc-${h.depth}" href="#${h.id}">${escapeHtml(h.text)}</a>`).join('');
  const next = pages[pages.indexOf(p) + 1];
  const body = `<div class="reading-layout"><aside class="sidebar"><a class="back-link" href="index.html">← 返回首页</a><div class="sidebar-label">本页目录</div><nav class="toc" aria-label="本页目录">${toc}</nav></aside><main class="article-wrap"><div class="article-kicker">指南 ${p.number} / ${String(pages.length).padStart(2, '0')}</div><article class="prose" data-page="${p.output}">${html}</article><div class="article-end"><a href="${next ? next.output : 'index.html'}">${next ? `下一篇：${next.short} →` : '← 返回首页'}</a></div></main></div>`;
  fs.writeFileSync(path.join(dir, p.output), shell(p.short, body));
}
const cards = pages.map(p => `<a class="guide-card" href="${p.output}"><span class="card-number">${p.number} / ${String(pages.length).padStart(2, '0')}</span><h2>${p.short}</h2><p>${p.desc}</p><span class="card-arrow">阅读指南 ↗</span></a>`).join('');
const index = `<main class="landing"><div class="eyebrow">PATH OF EXILE 2 · 中文速查</div><h1>从第一次建角到<br><em>异界刷图</em></h1><p class="lead">第一次玩就从「新手起步」开始；想找流派与查价工具，看「工具与 BD」。推战役查奖励清单，完成第一张图后进入异界路线。</p><div class="guide-grid">${cards}</div><p class="home-note">原有地图与界面图片来自文内标注的外部来源，查看图片需要网络连接。清单进度保存在当前浏览器。</p></main>`;
fs.writeFileSync(path.join(dir, 'index.html'), shell('首页', index, {home:true}));
console.log('Generated index.html and', pages.map(p => p.output).join(', '));
