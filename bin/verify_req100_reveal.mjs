#!/usr/bin/env node
/**
 * Throwaway runtime check for REQ-100 (not shipped; not part of the test suite).
 *
 * The UATs pin the emitted CSS/HTML and drive the observer against a stubbed
 * IntersectionObserver. This drives a REAL browser end-to-end:
 *
 *   1. desktop, JS on         → below-fold content starts in its pre-state and
 *                               settles as the reader scrolls it into view.
 *   2. JUMP to the foot       → every band scrolled PAST settles too, rather
 *                               than staying laid-out-but-invisible. (The case
 *                               the script's `bottom < 0` clause closes.)
 *   3. JS DISABLED            → fully visible. The "fails visible" property.
 *   4. prefers-reduced-motion → fully visible immediately, no scroll needed.
 *   5. mobile width           → the paired subtree swaps and still reveals.
 *
 * `display:none` nodes are excluded throughout: the page pairs a desktop and a
 * mobile subtree for the same content and hides one, so at any width ~a third of
 * the `l1-rv` nodes have no box. An IntersectionObserver never fires for a boxless
 * element — correctly, since the reader cannot see it.
 */
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(join(process.cwd(), 'tools/generate/src/index.ts'))
const { chromium } = require('playwright')

const ROOT = join(process.cwd(), 'storage/dist/sites/xgd/draft')
const TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
}

const server = createServer(async (req, res) => {
  const rel = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[/\\])+/, '')
  try {
    const p = join(ROOT, rel === '/' ? 'index.html' : rel)
    res.writeHead(200, { 'content-type': TYPES[extname(p)] ?? 'application/octet-stream' })
    res.end(await readFile(p))
  } catch {
    res.writeHead(404).end('nope')
  }
})
await new Promise((r) => server.listen(0, r))
const base = `http://127.0.0.1:${server.address().port}/`

const browser = await chromium.launch()

/** Every revealing node that actually has a box, with its live opacity. */
const probe = () =>
  [...document.getElementsByClassName('l1-rv')]
    .filter((el) => getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0)
    .map((el) => ({
      o: Number(getComputedStyle(el).opacity),
      top: el.getBoundingClientRect().top + window.scrollY,
    }))

const open = async (opts) => {
  const ctx = await browser.newContext(opts)
  const page = await ctx.newPage()
  await page.goto(base, { waitUntil: opts.javaScriptEnabled === false ? 'load' : 'networkidle' })
  await page.waitForTimeout(1200)
  return { ctx, page }
}

const results = []

// ── 1 & 5. JS on — desktop and mobile, scrolled the way a reader scrolls ─────
for (const [label, viewport] of [
  ['1. desktop 1440 — reveals on scroll', { width: 1440, height: 900 }],
  ['5. mobile 390 — paired subtree reveals', { width: 390, height: 844 }],
]) {
  const { ctx, page } = await open({ viewport })
  const atLoad = await page.evaluate(probe)
  const marker = await page.evaluate(() => document.documentElement.hasAttribute('data-l1-motion'))
  const below = atLoad.filter((n) => n.top > viewport.height)
  const above = atLoad.filter((n) => n.top <= viewport.height)

  const h = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y < h; y += 400) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y)
    await page.waitForTimeout(120)
  }
  await page.waitForTimeout(2000)
  const unsettled = (await page.evaluate(probe)).filter((n) => n.o < 0.95).length

  results.push({
    scenario: label,
    marker,
    visibleNodes: atLoad.length,
    aboveFoldSettled: `${above.filter((n) => n.o > 0.95).length}/${above.length}`,
    belowFoldInPreState: `${below.filter((n) => n.o < 0.05).length}/${below.length}`,
    unsettled,
    pass:
      marker &&
      below.length > 0 &&
      below.every((n) => n.o < 0.05) &&
      above.every((n) => n.o > 0.95) &&
      unsettled === 0,
  })
  await ctx.close()
}

// ── 2. JUMP straight to the foot — the `bottom < 0` clause ──────────────────
{
  const { ctx, page } = await open({ viewport: { width: 1440, height: 900 } })
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(2500)
  const nodes = await page.evaluate(probe)
  const unsettled = nodes.filter((n) => n.o < 0.95).length
  results.push({
    scenario: '2. JUMP to foot — passed bands settle',
    visibleNodes: nodes.length,
    unsettled,
    pass: nodes.length > 0 && unsettled === 0,
  })
  await ctx.close()
}

// ── 3. JS DISABLED — the "fails visible" property ───────────────────────────
{
  const { ctx, page } = await open({
    viewport: { width: 1440, height: 900 },
    javaScriptEnabled: false,
  })
  const nodes = await page.evaluate(probe)
  const unsettled = nodes.filter((n) => n.o < 0.95).length
  results.push({
    scenario: '3. JS DISABLED (fails visible)',
    visibleNodes: nodes.length,
    unsettled,
    pass: nodes.length > 0 && unsettled === 0,
  })
  await ctx.close()
}

// ── 4. prefers-reduced-motion ───────────────────────────────────────────────
{
  const { ctx, page } = await open({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  })
  const nodes = await page.evaluate(probe)
  const marker = await page.evaluate(() => document.documentElement.hasAttribute('data-l1-motion'))
  const unsettled = nodes.filter((n) => n.o < 0.95).length
  results.push({
    scenario: '4. prefers-reduced-motion',
    marker,
    visibleNodes: nodes.length,
    unsettled,
    pass: !marker && nodes.length > 0 && unsettled === 0,
  })
  await ctx.close()
}

await browser.close()
server.close()

console.table(results)
const failed = results.filter((r) => !r.pass)
console.log(failed.length ? `\nFAIL: ${failed.length} scenario(s)` : '\nALL SCENARIOS PASS')
process.exit(failed.length ? 1 : 0)
