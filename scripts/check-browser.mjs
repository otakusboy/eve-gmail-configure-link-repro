import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { startServer } from './server.mjs';

const server = await startServer();
let browser;
try {
  browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  });
  const results = [];
  for (const width of [320, 390, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 844 } });
    const page = await context.newPage();
    page.setDefaultTimeout(10_000);
    const base = `http://127.0.0.1:${server.address().port}/integrations/chat-sdk-gmail`;
    await page.goto(base);
    const link = page.getByRole('link', { name: 'Configure', exact: true });
    assert.equal(await link.getAttribute('href'), '#configure');
    assert.equal(await link.getAttribute('target'), '_blank');
    const popupReady = page.waitForEvent('popup');
    await link.click();
    const popup = await popupReady;
    await popup.waitForLoadState('domcontentloaded');
    assert.equal(context.pages().length, 2);
    assert.equal(new URL(page.url()).hash, '');
    assert.equal(new URL(popup.url()).hash, '#configure');
    const actual = {
      tabs: context.pages().length,
      originalHash: new URL(page.url()).hash,
      newTabHash: new URL(popup.url()).hash,
    };
    await popup.close();
    await page.goto(base);
    await page.locator('#fragment-control').click();
    await page.waitForURL(`${base}#configure`);
    assert.equal(context.pages().length, 1);
    const control = { tabs: context.pages().length, originalHash: new URL(page.url()).hash };
    results.push({ viewport: width, actual, control });
    await context.close();
  }
  const provenance = JSON.parse(await readFile(new URL('../SOURCE-PROVENANCE.json', import.meta.url), 'utf8'));
  const evidence = {
    node: process.version,
    platform: `${process.platform} ${process.arch}`,
    browser: await browser.version(),
    sourceCommit: provenance.commit,
    method: 'Unchanged upstream Markdown component and exact Gmail paragraph, server-rendered in an isolated local HTML harness. No hydration or full Next.js site verification.',
    results,
  };
  await writeFile(new URL('../browser-evidence.json', import.meta.url), `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence, null, 2));
  console.log('Reproduction confirmed. Exit 0 means the bug and native-link control matched expectations.');
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
