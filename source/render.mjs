import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const assets = join(root,'site','assets');
export async function render(siteURL, printDirectory) {
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_BIN || undefined, channel: process.env.CHROME_BIN ? undefined : 'chrome',
    headless:true, args:['--allow-file-access-from-files']
  });
  try {
    const page=await browser.newPage();
    await page.setViewport({width:1440,height:900,deviceScaleFactor:1.5});
    await page.goto(siteURL,{waitUntil:'networkidle0'});
    await page.waitForSelector('.bench.ready');
    await page.evaluate(()=>document.fonts.ready);
    const fallback=await page.$eval('#scope',node=>node.toDataURL('image/webp',.94).split(',')[1]);
    await writeFile(join(assets,'lissajous.webp'),Buffer.from(fallback,'base64'));
    await page.setViewport({width:1200,height:630,deviceScaleFactor:1});
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await page.screenshot({path:join(assets,'portfolio-preview.jpg'),type:'jpeg',quality:90});
    await mkdir(assets,{recursive:true});
    for(const lang of ['en','tr']){
      await page.goto(pathToFileURL(resolve(printDirectory,`cv-${lang}.html`)).href,{waitUntil:'networkidle0'});
      await page.evaluate(()=>document.fonts.ready);
      await page.pdf({path:join(assets,`kursat-kaya-cv-${lang}.pdf`),preferCSSPageSize:true,printBackground:true,tagged:true,displayHeaderFooter:false});
    }
  } finally { await browser.close(); }
}
