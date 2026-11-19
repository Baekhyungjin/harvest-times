// 하베스트 타임스 검색 노출(SEO) 파일 생성기
// 공개된 기사로 news/{id}.html(검색로봇용 정적 본문), sitemap.xml, rss.xml, robots.txt를 만든다.
// GitHub Actions에서 주기적으로 실행된다. 비공개 키는 쓰지 않는다(사이트에 이미 공개된 읽기 전용 키만 사용).
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.SEO_ROOT || process.cwd();
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const cfg = read('js/config-live.js');
const SUPABASE_URL = (cfg.match(/"SUPABASE_URL"\s*:\s*"([^"]+)"/) || [])[1];
const ANON = (cfg.match(/"SUPABASE_ANON_KEY"\s*:\s*"([^"]+)"/) || [])[1];
const CNAME = fs.existsSync(path.join(ROOT, 'CNAME')) ? read('CNAME').trim() : '';
const BASE = CNAME ? 'https://' + CNAME + '/' : 'https://baekhyungjin.github.io/harvest-times/';
const FIXTURES = process.env.SEO_FIXTURES || '';

async function q(name, query) {
  if (FIXTURES) return JSON.parse(fs.readFileSync(path.join(FIXTURES, name + '.json'), 'utf8'));
  const r = await fetch(SUPABASE_URL + '/rest/v1/' + name + '?' + query, { headers: { apikey: ANON, Authorization: 'Bearer ' + ANON, 'Accept-Profile': 'times' } });
  if (!r.ok) throw new Error(name + ' 조회 실패 ' + r.status);
  return r.json();
}
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const text = (html) => String(html || '').replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
const clip = (s, n) => (s.length > n ? s.slice(0, n - 1).trim() + '…' : s);
const abs = (u) => { try { return new URL(u, BASE).href; } catch (_) { return ''; } };

// 본문 정리: 허용한 태그·속성만 남긴다.
const TAGS = new Set(['p', 'br', 'b', 'strong', 'i', 'em', 'u', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'figure', 'figcaption', 'span', 'div', 'sup', 'sub', 'code', 'hr']);
function cleanBody(html) {
  let s = String(html || '').replace(/<(script|style|iframe|object|embed|noscript|template)[\s\S]*?<\/\1>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
  s = s.replace(/<\/?([a-zA-Z][a-zA-Z0-9-]*)([^>]*)>/g, (all, tag, attrs) => {
    const t = tag.toLowerCase();
    const closing = all[1] === '/';
    if (t === 'h1') return closing ? '</h2>' : '<h2>';
    if (!TAGS.has(t)) return '';
    if (closing) return '</' + t + '>';
    const keep = [];
    attrs.replace(/([a-zA-Z-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g, (m, name, _v, d, s1, b) => {
      const n = name.toLowerCase();
      const v = (d !== undefined ? d : s1 !== undefined ? s1 : b || '').trim();
      if (n === 'href' && /^(https?:|mailto:|#|[a-z0-9._-]+\.html)/i.test(v)) keep.push('href="' + esc(v) + '"');
      else if (n === 'src' && t === 'img' && /^https?:/i.test(v)) keep.push('src="' + esc(v) + '"');
      else if (n === 'alt' && t === 'img') keep.push('alt="' + esc(v) + '"');
      else if ((n === 'colspan' || n === 'rowspan') && /^\d{1,2}$/.test(v)) keep.push(n + '="' + v + '"');
      return '';
    });
    if (t === 'a') keep.push('rel="noopener"');
    if (t === 'img') keep.push('loading="lazy"');
    return '<' + t + (keep.length ? ' ' + keep.join(' ') : '') + '>';
  });
  if (!/<(p|div|h2|h3|ul|ol|table|blockquote)\b/i.test(s)) s = s.split(/\n{2,}/).map((p) => '<p>' + p.replace(/\n/g, '<br>') + '</p>').join('');
  return s.trim();
}
const ymd = (d) => { const x = new Date(d); return isNaN(x) ? '' : x.toISOString().slice(0, 10); };
const kdate = (d) => { const x = new Date(new Date(d).getTime() + 9 * 3600e3); return isNaN(x) ? '' : x.toISOString().slice(0, 16).replace('T', ' '); };

(async () => {
  const now = new Date().toISOString();
  const [arts, secs, setRows, net] = await Promise.all([
    q('articles', 'select=id,section_id,title,subtitle,summary,body,image_url,author,published_at,updated_at&status=eq.published&published_at=lte.' + encodeURIComponent(now) + '&order=published_at.desc&limit=2000'),
    q('sections', 'select=id,parent_id,name,code,kind,sort,visible,link_url&order=sort'),
    q('settings', 'select=key,value'),
    q('network_posts', 'select=id,kind,title,summary,created_at,updated_at&status=eq.published&order=created_at.desc&limit=1000').catch(() => [])
  ]);
  const S = {};
  setRows.forEach((r) => { S[r.key] = r.value; });
  const SITE = S.site_name || '하베스트 타임스';
  const DEFAULT_DESC = '하베스트대학교 전자신문 하베스트 타임스. 대학·대학원 소식, 매거진, 선교 현장, 칼럼과 하베스트 TV를 전합니다.';
  const visible = secs.filter((s) => s.visible !== false);
  const secById = new Map(visible.map((s) => [s.id, s]));
  const template = read('article.html');
  const OG_DEFAULT = abs('og-harvest-times-v2.png');

  fs.mkdirSync(path.join(ROOT, 'news'), { recursive: true });
  const keepFiles = new Set();
  for (const a of arts) {
    const sec = secById.get(a.section_id);
    if (!sec) continue; // 숨긴 메뉴의 기사는 제외
    const parent = sec.parent_id ? secById.get(sec.parent_id) : null;
    const url = BASE + 'news/' + a.id + '.html';
    const title = text(a.title);
    const desc = clip(text(a.summary) || text(a.subtitle) || text(a.body), 150) || DEFAULT_DESC;
    const img = a.image_url ? abs(a.image_url) : OG_DEFAULT;
    const ld = { '@context': 'https://schema.org', '@type': 'NewsArticle', headline: clip(title, 110), description: desc, image: [img], datePublished: a.published_at, dateModified: a.updated_at || a.published_at, author: { '@type': 'Person', name: a.author || SITE }, publisher: { '@type': 'Organization', name: SITE, logo: { '@type': 'ImageObject', url: abs('apple-touch-icon.png') } }, mainEntityOfPage: url, articleSection: sec.name };
    const crumbItems = [{ '@type': 'ListItem', position: 1, name: SITE, item: BASE }];
    if (parent) crumbItems.push({ '@type': 'ListItem', position: 2, name: parent.name, item: BASE + 'list.html?s=' + parent.id });
    crumbItems.push({ '@type': 'ListItem', position: crumbItems.length + 1, name: sec.name, item: BASE + 'list.html?s=' + sec.id });
    const crumbs = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbItems };
    let h = template.replace('<meta charset="utf-8">', '<meta charset="utf-8"><base href="../">')
      .replace(/<title>[^<]*<\/title>/, '<title>' + esc(title) + ' - ' + esc(SITE) + '</title>')
      .replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="' + esc(desc) + '">')
      .replace(/<link rel="canonical" href="[^"]*">/, '<link rel="canonical" href="' + url + '">')
      .replace(/<meta property="og:type" content="[^"]*">/, '<meta property="og:type" content="article">')
      .replace(/<meta property="og:title" content="[^"]*">/, '<meta property="og:title" content="' + esc(title) + '">')
      .replace(/<meta property="og:description" content="[^"]*">/, '<meta property="og:description" content="' + esc(desc) + '">')
      .replace(/<meta property="og:url" content="[^"]*">/, '<meta property="og:url" content="' + url + '">')
      .replace(/<meta property="og:image" content="[^"]*">/, '<meta property="og:image" content="' + esc(img) + '">')
      .replace(/<meta property="og:image:secure_url" content="[^"]*">/, '<meta property="og:image:secure_url" content="' + esc(img) + '">')
      .replace(/<meta property="og:image:alt" content="[^"]*">/, '<meta property="og:image:alt" content="' + esc(title) + '">')
      .replace(/<meta name="twitter:title" content="[^"]*">/, '<meta name="twitter:title" content="' + esc(title) + '">')
      .replace(/<meta name="twitter:description" content="[^"]*">/, '<meta name="twitter:description" content="' + esc(desc) + '">')
      .replace(/<meta name="twitter:image" content="[^"]*">/, '<meta name="twitter:image" content="' + esc(img) + '">')
      .replace(/<meta name="twitter:image:alt" content="[^"]*">/, '<meta name="twitter:image:alt" content="' + esc(title) + '">');
    if (a.image_url) h = h.replace(/<meta property="og:image:(type|width|height)" content="[^"]*">\n?/g, '');
    h = h.replace('<!-- BRAND META END -->', '<meta property="article:published_time" content="' + esc(a.published_at) + '">\n<meta property="article:section" content="' + esc(sec.name) + '">\n<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>\n<script type="application/ld+json">' + JSON.stringify(crumbs).replace(/</g, '\\u003c') + '</script>\n<!-- BRAND META END -->');
    const body = '<div class="wrap"><main class="art static-art"><p class="cat"><a href="list.html?s=' + sec.id + '">' + esc(sec.name) + '</a></p><h1>' + esc(title) + '</h1>' + (a.subtitle ? '<p class="sub">' + esc(text(a.subtitle)) + '</p>' : '') + '<p class="meta">' + esc(a.author || SITE) + ' · ' + esc(kdate(a.published_at)) + '</p>' + (a.image_url ? '<figure><img src="' + esc(a.image_url) + '" alt="' + esc(title) + '"></figure>' : '') + '<div class="page-body">' + cleanBody(a.body) + '</div><p><a href="article.html?id=' + a.id + '">하베스트 타임스에서 기사 보기</a></p></main></div>';
    h = h.replace('<body data-page="article">', '<body data-page="article" data-article-id="' + a.id + '">').replace('<div id="app"></div>', '<div id="app">' + body + '</div>');
    keepFiles.add(a.id + '.html');
    const full = path.join(ROOT, 'news', a.id + '.html');
    if (!fs.existsSync(full) || fs.readFileSync(full, 'utf8') !== h) fs.writeFileSync(full, h);
  }
  for (const f of fs.readdirSync(path.join(ROOT, 'news'))) if (/^\d+\.html$/.test(f) && !keepFiles.has(f)) fs.unlinkSync(path.join(ROOT, 'news', f));

  const urls = [];
  const add = (loc, lastmod, freq, pri) => urls.push('<url><loc>' + esc(loc) + '</loc>' + (lastmod ? '<lastmod>' + lastmod + '</lastmod>' : '') + '<changefreq>' + freq + '</changefreq><priority>' + pri + '</priority></url>');
  add(BASE, arts.length ? ymd(arts[0].published_at) : '', 'hourly', '1.0');
  add(BASE + 'network.html', net.length ? ymd(net[0].updated_at || net[0].created_at) : '', 'daily', '0.8');
  for (const s of visible) {
    if (s.kind === 'link' || s.kind === 'board' || s.kind === 'page') continue;
    if (s.id === 7001 || s.id === 7111 || s.id === 7112) continue;
    const par = s.parent_id ? secById.get(s.parent_id) : null;
    if (s.code === 'mission-network' || (par && par.code === 'mission-network' && ['mission-updates', 'partner-events'].includes(s.code))) continue;
    add(BASE + 'list.html?s=' + s.id, '', 'daily', s.parent_id ? '0.6' : '0.7');
  }
  add(BASE + 'mall.html?view=mall', '', 'weekly', '0.5');
  add(BASE + 'mall.html?view=pension', '', 'weekly', '0.5');
  add(BASE + 'organization.html', '', 'monthly', '0.4');
  for (const a of arts) if (keepFiles.has(a.id + '.html')) add(BASE + 'news/' + a.id + '.html', ymd(a.updated_at || a.published_at), 'weekly', '0.8');
  for (const p of net) add(BASE + 'network.html?id=' + p.id, ymd(p.updated_at || p.created_at), 'weekly', '0.6');
  const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.join('\n') + '\n</urlset>\n';

  const items = arts.filter((a) => keepFiles.has(a.id + '.html')).slice(0, 50).map((a) => {
    const sec = secById.get(a.section_id);
    return '<item><title>' + esc(text(a.title)) + '</title><link>' + BASE + 'news/' + a.id + '.html</link><guid isPermaLink="true">' + BASE + 'news/' + a.id + '.html</guid><pubDate>' + new Date(a.published_at).toUTCString() + '</pubDate>' + (sec ? '<category>' + esc(sec.name) + '</category>' : '') + '<description>' + esc(clip(text(a.summary) || text(a.body), 300)) + '</description></item>';
  });
  const rss = '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>' + esc(SITE) + '</title><link>' + BASE + '</link><description>' + esc(DEFAULT_DESC) + '</description><language>ko</language>' + (arts[0] ? '<lastBuildDate>' + new Date(arts[0].published_at).toUTCString() + '</lastBuildDate>' : '') + '\n' + items.join('\n') + '\n</channel></rss>\n';
  const robots = 'User-agent: *\nAllow: /\nDisallow: /admin.html\nDisallow: /editor.html\nDisallow: /member.html\n\nSitemap: ' + BASE + 'sitemap.xml\n';
  const write = (f, c) => { const p = path.join(ROOT, f); if (!fs.existsSync(p) || fs.readFileSync(p, 'utf8') !== c) fs.writeFileSync(p, c); };
  write('sitemap.xml', sitemap);
  write('rss.xml', rss);
  write('robots.txt', robots);
  console.log('기사 페이지 ' + keepFiles.size + '개, 사이트맵 주소 ' + urls.length + '개, 기준 주소 ' + BASE);
})().catch((e) => { console.error(e); process.exit(1); });
