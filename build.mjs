import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { copy, email, name, profiles, programmingLanguages, topics } from './source/content.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const site = join(root, 'site');
const origin = new URL(process.env.SITE_ORIGIN || 'https://kursatkaya.com').origin;
const printDir = process.env.CV_PRINT_DIR && resolve(process.env.CV_PRINT_DIR);
const assetRevision = createHash('sha256')
  .update(await readFile(join(site, 'assets', 'site.css')))
  .update(JSON.stringify(copy.en))
  .digest('hex').slice(0, 12);
const stylesheet = `/assets/site.css?v=${assetRevision}`;
const cvPath = lang => `/assets/kursat-kaya-cv-${lang}.pdf`;
const pagePath = lang => lang === 'en' ? '/' : '/tr/';
const icon = key => `<svg class="icon" aria-hidden="true" focusable="false" viewBox="0 0 32 32"><use href="/assets/engineering-icons.svg#${key}"></use></svg>`;
const mark = `<span class="brand-mark">${icon('mark')}</span>`;
const downloadIcon = icon('download');
const upIcon = icon('external');
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const languagesFor = c => [...programmingLanguages, c.assembly];
const printUrl = url => url.replace(/^https:\/\//, '');

function htmlHead(lang, c) {
  return `<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(c.title)}</title><meta name="description" content="${esc(c.description)}">
<meta name="theme-color" content="#123831"><link rel="icon" type="image/svg+xml" href="/assets/kursat-mark.svg">
<link rel="canonical" href="${origin}${pagePath(lang)}"><link rel="alternate" hreflang="en" href="${origin}/"><link rel="alternate" hreflang="tr" href="${origin}/tr/"><link rel="alternate" hreflang="x-default" href="${origin}/">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(c.title)}"><meta property="og:description" content="${esc(c.description)}"><meta property="og:url" content="${origin}${pagePath(lang)}"><meta property="og:image" content="${origin}/assets/portfolio-preview.jpg?v=${assetRevision}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:locale" content="${lang === 'en' ? 'en_GB' : 'tr_TR'}"><meta name="twitter:card" content="summary_large_image">
<link rel="stylesheet" href="/assets/fonts/fonts.css"><link rel="stylesheet" href="${stylesheet}"><noscript><link rel="stylesheet" href="/assets/nojs.css?v=${assetRevision}"></noscript><script type="module" src="/assets/bench.mjs?v=${assetRevision}"></script>`;
}

function languageLinks(lang, c) {
  return `<div class="language" role="group" aria-label="${c.languages}">${['en','tr'].map(l => `<a href="${pagePath(l)}" lang="${l}" hreflang="${l}" aria-label="${l==='en'?'English':'Türkçe'}" ${l === lang ? 'aria-current="page"' : ''}>${l.toUpperCase()}</a>`).join('<span aria-hidden="true">/</span>')}</div>`;
}

function instrument(c) {
  return `<section class="bench" id="bench" aria-labelledby="bench-title"><div class="wrap">
    <div class="section-intro"><h2 id="bench-title">${c.bench}</h2><p>${c.benchIntro}</p></div>
    <div class="lab">
      <div class="device">
        <div class="bench-head"><span class="device-name">${icon('scope')}${c.device}</span><div class="modes" role="tablist" aria-label="${c.modelGroup}">
          ${topics.map((t,i) => `<button type="button" role="tab" id="tab-${t.id}" aria-controls="panel-${t.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-model="${t.id}">${c.models[i].short}</button>`).join('')}
        </div></div>
        <div class="instrument-face">
          <div class="scope-labels" aria-hidden="true"><span id="mode-label">${c.models[0].mode}</span><span id="context-label">${c.models[0].context}</span></div>
          <div class="plot-holder"><img class="plot-fallback" src="/assets/lissajous.webp?v=${assetRevision}" width="840" height="410" alt=""><canvas id="scope" role="img" aria-label="${c.plot} — ${c.models[0].title}" aria-describedby="panel-xy" width="840" height="410"></canvas></div>
          <div class="control-band"><label for="parameter" id="parameter-label">${c.models[0].label}</label><output for="parameter" id="readout">56°</output><input type="range" min="0" max="180" step="1" value="56" id="parameter"><button id="sweep" type="button" data-run="${c.run}" data-stop="${c.stop}" aria-pressed="false"><i aria-hidden="true"></i><span>${c.run}</span></button></div>
        </div>
      </div>
      <div class="lab-notes">${topics.map((t,i)=>{
        const m = c.models[i];
        const split = m.desc.indexOf('. ') + 1;
        return `<div class="bench-note" role="tabpanel" tabindex="0" id="panel-${t.id}" aria-labelledby="tab-${t.id}" data-mode="${m.mode}" data-context="${m.context}" data-label="${m.label}" data-title="${m.title}" ${i?'hidden':''}>
          <span class="note-label">${c.theoryLabel}</span><h3>${m.title}</h3><p class="model-summary">${m.desc.slice(0,split)}</p>
          <p class="formula" dir="ltr">${t.formula}</p><details><summary>${c.notes}</summary><p>${m.desc.slice(split).trim()} <a href="${t.source}">${c.read} ${t.publisher}</a>.</p></details>
        </div>`;}).join('')}
        <noscript><p class="nojs-message">${c.fallback}</p></noscript>
      </div>
    </div></div></section>`;
}

function page(lang) {
  const c = copy[lang];
  const graphicAlts = lang === 'tr'
    ? ['Seri direnç ve toprağa bağlı kondansatörden oluşan RC alçak geçiren filtre', '0xA5 değerinin ikilik gösterimi 10100101', 'Birim basamak girişine birinci dereceden sistem yanıtı']
    : ['RC low-pass filter with a series resistor and a capacitor to ground', 'The byte 0xA5 written as 10100101', 'First-order response to a unit step input'];
  const figures = ['f<sub>c</sub> = 1/(2πRC)', '0xA5 = 165₁₀', 'y(t) = 1 − exp(−t/τ)'];
  const social = profiles.map(p => `<a href="${esc(p.url)}" rel="me">${p.label} ${upIcon}</a>`).join('');
  return `<!doctype html><html lang="${lang}"><head>${htmlHead(lang,c)}</head><body id="top">
  <a class="skip" href="#main">${c.skip}</a>
  <header class="mast"><div class="wrap mast-inner"><a class="brand" href="${pagePath(lang)}">${mark}<span>${name}</span></a>
    <nav class="main-nav" aria-label="${c.nav}"><a href="#practice">${c.practice}</a><a href="#bench">${c.bench}</a><a href="#background">${c.profile}</a></nav>
    <div class="mast-actions">${languageLinks(lang,c)}<a href="#contact" class="header-contact">${c.contact} ${upIcon}</a>
      <details class="compact-nav"><summary>${c.menu}</summary><nav aria-label="${c.nav}"><a href="#practice">${c.practice}</a><a href="#bench">${c.bench}</a><a href="#background">${c.profile}</a><a href="#contact">${c.contact}</a></nav></details>
    </div>
  </div></header>
  <main id="main">
    <section class="hero" aria-labelledby="name">
      <picture class="hero-picture"><source media="(max-width: 680px)" srcset="/assets/circuit-board-mobile.webp"><source media="(max-width: 1040px)" srcset="/assets/circuit-board-medium.webp">
        <img src="/assets/circuit-board.webp" width="1942" height="809" alt="" fetchpriority="high" decoding="async"></picture>
      <div class="wrap hero-inner"><div class="intro"><p class="availability"><span aria-hidden="true"></span>${c.stage}</p>
        <h1 id="name">${name}</h1><p class="discipline">${c.field}</p><p class="intro-text">${c.heroIntro}</p>
        <div class="actions"><a class="primary" href="${cvPath(lang)}" download>${downloadIcon}${c.download}</a><!--email_off--><a class="text-action" href="mailto:${email}">${icon('mail')}${c.getInTouch}</a><!--/email_off--></div>
      </div></div>
    </section>
    <div class="programming-band"><div class="wrap programming"><h2 id="programming-heading">${c.programmingLabel}</h2><ul aria-labelledby="programming-heading">${languagesFor(c).map(label => `<li>${label}</li>`).join('')}</ul></div></div>
    <section class="practice wrap" id="practice" aria-labelledby="practice-title"><div class="section-intro"><h2 id="practice-title">${c.practice}</h2><p>${c.practiceIntro}</p></div>
      <div class="practice-grid">${c.skills.map((skill,i)=>`<article><div class="practice-heading"><span class="domain-icon">${icon(['circuit','chip','signal'][i])}</span><h3>${skill.title}</h3></div>
        <p>${skill.body}</p><p class="tools">${skill.tools}</p>
        <figure class="schematic"><img src="/assets/diagram-${i+1}.png?v=${assetRevision}" alt="${graphicAlts[i]}" width="204" height="84" loading="lazy"><figcaption dir="ltr">${figures[i]}</figcaption></figure></article>`).join('')}</div>
    </section>
    ${instrument(c)}
    <section class="background wrap" id="background" aria-labelledby="background-title"><div class="background-inner">
      <figure class="portrait"><img src="/assets/kursat-kaya.webp" alt="${c.alt}" width="640" height="800" loading="lazy"><figcaption><strong>${name}</strong><span>${c.caption}</span></figcaption></figure>
      <div class="credentials"><h2 id="background-title">${c.profileHeading}</h2>
        <div class="credential"><div class="credential-meta">${c.dates}</div><div><h3>${c.educationName}</h3><p class="degree">${c.discipline}</p><p>${c.educationText}</p></div></div>
        <div class="credential"><div class="credential-meta">${c.training}</div><div><h3>${c.trainingTitle}</h3><p>${c.trainingText}</p></div></div>
        <dl class="extras"><div><dt>${c.languageLabel}</dt><dd>${c.languageText}</dd></div><div><dt>${c.moreTools}</dt><dd>${c.moreToolsText}</dd></div></dl>
      </div></div></section>
    <section class="contact" id="contact" aria-labelledby="contact-title"><div class="wrap contact-inner">
      <div><h2 id="contact-title">${c.contactHeading}</h2><p>${c.contactText}</p><p class="references">${c.references}</p></div>
      <div class="contact-actions"><!--email_off--><a class="email-link" href="mailto:${email}">${email} ${upIcon}</a><!--/email_off--><nav class="profile-links" aria-label="${c.profilesLabel}">${social}</nav>
        <a class="contact-cv" href="${cvPath(lang)}" download>${downloadIcon}${c.download} <small>${c.cvLanguage}</small></a>
      </div></div></section>
  </main><footer class="wrap footer"><span class="footer-name">${icon('mark')}${name}</span><a href="#top">${c.back} ↑</a></footer></body></html>`;
}

function printPage(lang) {
  const c = copy[lang];
  const asset = file => pathToFileURL(join(site,'assets',file)).href;
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${name} | ${c.cvTitle}</title><link rel="stylesheet" href="${asset('fonts/fonts.css')}"><style>
@page{size:A4;margin:17mm 19mm}*{box-sizing:border-box}body{margin:0;font:10.3pt/1.43 'DM Sans',Arial,sans-serif;color:#1a302b}h1,h2,h3,p{margin:0}header{display:flex;justify-content:space-between;align-items:center;border-bottom:2.5pt solid #21574b;padding-bottom:12pt;margin-bottom:13pt}header img{width:66pt;height:79pt;object-fit:cover;border-radius:4pt}h1{font:600 32pt/1.13 'DM Sans',sans-serif;letter-spacing:-1pt}header p{margin-top:4pt}a{color:#245d50;text-decoration:none}h2{font:600 14pt/1.15 'DM Sans',sans-serif;color:#245d50;margin:14pt 0 5pt}h3{font-size:10.8pt;margin:6pt 0 1.5pt}small{font-size:9pt;color:#52625b}p+p{margin-top:3pt}.degree{font-weight:650}.skill{break-inside:avoid;margin-bottom:4pt}.twocol{display:grid;grid-template-columns:1fr 1.2fr;gap:18pt}
.socials{display:flex;flex-wrap:wrap;gap:2pt 12pt;font-size:9pt}.print-references{border-top:.6pt solid #c8d4cb;padding-top:6pt;margin-top:12pt;color:#394c44}
</style></head><body><header><div><h1>${name}</h1><p class="degree">${c.field}</p><p><a href="mailto:${email}">${email}</a> · <a href="${origin}${pagePath(lang)}">${printUrl(origin + (lang === 'tr' ? '/tr/' : ''))}</a></p><p class="socials">${profiles.map(p => `<a href="${esc(p.url)}" aria-label="${p.label}">${esc(printUrl(p.url))}</a>`).join(' ')}</p></div><img src="${asset('kursat-kaya.webp')}" alt=""></header>
<h2>${c.cvAbout}</h2><p>${c.intro}</p><h2>${c.education}</h2><h3>${c.educationName}</h3><p>${c.discipline} · ${c.dates}</p><p>${c.educationText}</p><h2>${c.practice}</h2>
${c.skills.map(s=>`<div class="skill"><h3>${s.title}</h3><p>${s.body}</p><small>${s.tools}</small></div>`).join('')}
<h2>${c.programmingLabel}</h2><p>${languagesFor(c).join(', ')}</p>
<h2>${c.training}</h2><h3>${c.trainingTitle}</h3><p>${c.trainingText}</p><div class="twocol"><div><h2>${c.languageLabel}</h2><p>${c.languageText}</p></div><div><h2>${c.moreTools}</h2><p>${c.moreToolsText}</p></div></div><p class="print-references">${c.references}</p></body></html>`;
}

await mkdir(join(site,'tr'), {recursive:true});
if (printDir) await mkdir(printDir, {recursive:true});
for (const lang of Object.keys(copy)) {
  await writeFile(join(site,lang === 'tr' ? 'tr/index.html' : 'index.html'),page(lang).replace(/\b(href|src|srcset)="\/(?!\/)/g, '$1="'+(lang === 'tr' ? '../' : './')));
  if (printDir) await writeFile(join(printDir,`cv-${lang}.html`),printPage(lang));
}
await writeFile(join(site,'404.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page not found | ${name}</title><link rel="stylesheet" href="/assets/fonts/fonts.css"><link rel="stylesheet" href="${stylesheet}"><main class="not-found"><img src="/assets/kursat-mark.svg" width="44" height="44" alt=""><p>404</p><h1>Page not found</h1><a href="/">English portfolio</a> / <a href="/tr/" lang="tr">Türkçe portfolyo</a></main></html>`);
await writeFile(join(site,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
await writeFile(join(site,'_redirects'), Object.keys(copy).map(lang => `/assets/m-kursat-kaya-cv-${lang}.pdf ${cvPath(lang)} 301\n`).join(''));
await writeFile(join(site,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Object.keys(copy).map(l=>`<url><loc>${origin}${pagePath(l)}</loc></url>`).join('')}</urlset>\n`);
