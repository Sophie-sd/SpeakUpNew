import { readFileSync } from 'node:fs';
import { fetch } from 'undici';
import * as cheerio from 'cheerio';

const urls = readFileSync('./url-list.txt', 'utf8').split('\n').filter(Boolean);

const results = [];
let passed = 0;
let failed = 0;

for (const url of urls) {
  try {
    const res = await fetch(url, { redirect: 'follow' });
    const html = await res.text();
    const $ = cheerio.load(html);

    // SEO перевірки
    const canonical = $('link[rel="canonical"]').attr('href') || '';
    const hreflangs = $('link[rel="alternate"][hreflang]').length;
    const lang = $('html').attr('lang') || '';
    const title = $('title').text();
    const h1 = $('h1').first().text();
    const description = $('meta[name="description"]').attr('content') || '';

    // Валідація
    const issues = [];
    if (res.status !== 200) issues.push(`Status ${res.status}`);
    if (!canonical) issues.push('No canonical');
    if (!canonical.startsWith('http')) issues.push('Canonical not absolute');
    if (hreflangs !== 2) issues.push(`Hreflang: ${hreflangs} (need 2)`);
    if (!lang || !['uk', 'ru'].includes(lang)) issues.push(`Lang: "${lang}"`);
    if (!h1) issues.push('No H1');
    if (!title || title.length < 20) issues.push('Title too short');
    if (!description || description.length < 50) issues.push('Description too short');

    const status = issues.length === 0 ? '✅' : '❌';

    if (status === '✅') passed++;
    else failed++;

    results.push({
      url: url.substring(url.indexOf('/', 8)),
      status,
      canonical: canonical ? '✓' : '✗',
      hreflangs,
      lang,
      h1: h1 ? '✓' : '✗',
      issues: issues.join('; ') || 'OK',
    });

  } catch (err) {
    failed++;
    results.push({
      url: url.substring(url.indexOf('/', 8)),
      status: '❌',
      issues: err.message.substring(0, 50),
    });
  }

  // Rate limiting
  await new Promise(resolve => setTimeout(resolve, 50));
}

console.table(results);

console.log(`\n📊 РЕЗУЛЬТАТИ:`);
console.log(`✅ Пройшло: ${passed}/${urls.length}`);
console.log(`❌ Помилок: ${failed}/${urls.length}`);

if (failed > 0) {
  console.log(`\n⚠️ ЗНАЙДЕНО ${failed} ПРОБЛЕМ:\n`);
  console.table(results.filter(r => r.status === '❌'));
  process.exit(1);
} else {
  console.log('\n🎉 ВСІ ПЕРЕВІРКИ ПРОЙШЛИ!');
  process.exit(0);
}


