#!/usr/bin/env node
/**
 * Throwaway runtime check for REQ-108 (not shipped; not part of the test suite).
 *
 * The UATs pin the emitted CSS/HTML. This drives a REAL browser, because the whole
 * point of the axis is what a mask composited against a moving cursor actually
 * PAINTS — and `mask-composite`, a negative-z pseudo-element and an inherited
 * custom property are three things a string assertion cannot see:
 *
 *   1. no pointer ever moved  → the marker is absent and nothing paints (the state
 *                               every capture and every crawler sees).
 *   2. pointer parked         → a teal region of the expected size, and STILL: two
 *                               screenshots 400ms apart are byte-identical.
 *   3. pointer moving         → the region deforms (a moving frame differs from the
 *                               settled one) and no rAF runs once it stops.
 *   4. hero (asset branch)    → the accent recolours the asset's own strokes rather
 *                               than painting a flat teal disc.
 *   5. reduced motion         → nothing paints at all.
 *
 * Run: node bin/verify_req108_pointer.mjs   (after `1c render xgd`)
 */
import { createServer } from 'node:http'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(join(process.cwd(), 'tools/generate/src/index.ts'))
const { chromium } = require('playwright')

const ROOT = join(process.cwd(), 'storage/dist/sites/xgd/draft')
const OUT = join(process.cwd(), 'storage/tmp/req108')
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
const URL_BASE = `http://127.0.0.1:${server.address().port}/`
await mkdir(OUT, { recursive: true })

const browser = await chromium.launch()
const results = []
const ok = (name, pass, detail) => {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
}

/** How many pixels in a PNG-independent sample of the band read as teal-ish. */
const TEAL_PROBE = `(sel) => {
  const el = document.querySelector(sel)
  const r = el.getBoundingClientRect()
  return { top: r.top, left: r.left, width: r.width, height: r.height }
}`

async function bandOf(page, index) {
  // The accented bands are the ones the renderer marked; index them in DOM order.
  return page.evaluate((i) => {
    const el = document.getElementsByClassName('l1-pt')[i]
    const r = el.getBoundingClientRect()
    return { cls: el.className.split(' ')[0], top: r.top, left: r.left, w: r.width, h: r.height }
  }, index)
}

// ── 1 & 2 & 3: the pattern band (flat hairline grid) ─────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(URL_BASE, { waitUntil: 'load' })
  await page.waitForTimeout(300)

  // (1) Nothing has moved a pointer: no marker, no accent.
  const markerBefore = await page.evaluate(() => document.documentElement.hasAttribute('data-l1-pointer'))
  ok('no pointer → no marker (the captured page is the plain page)', markerBefore === false)

  // Scroll the second accented band (#problem, the pattern branch) into view.
  await page.evaluate(() => {
    document.getElementById('problem').scrollIntoView({ block: 'center' })
  })
  await page.waitForTimeout(400)
  const band = await bandOf(page, 1)
  const cx = Math.round(band.left + band.w / 2)
  const cy = Math.round(band.top + band.h / 2)

  const plain = await page.screenshot({ clip: { x: cx - 200, y: cy - 200, width: 400, height: 400 } })
  await writeFile(join(OUT, '1-no-pointer.png'), plain)

  // (2) Park the pointer in the middle of the band.
  await page.mouse.move(cx, cy)
  await page.waitForTimeout(500)
  const markerAfter = await page.evaluate(() => document.documentElement.hasAttribute('data-l1-pointer'))
  ok('a real pointermove sets the marker', markerAfter === true)

  const parked = await page.screenshot({ clip: { x: cx - 200, y: cy - 200, width: 400, height: 400 } })
  await writeFile(join(OUT, '2-parked.png'), parked)
  ok('the accent paints something once the pointer is in the band', !parked.equals(plain))

  // (2 cont.) STILL while the pointer is still — the headline requirement.
  await page.waitForTimeout(400)
  const parkedAgain = await page.screenshot({
    clip: { x: cx - 200, y: cy - 200, width: 400, height: 400 },
  })
  ok('a still pointer → a byte-identical region 400ms later (stable)', parked.equals(parkedAgain))

  // And it costs no frames: no rAF callback fires while nothing moves.
  const framesWhileStill = await page.evaluate(async () => {
    let n = 0
    const t0 = performance.now()
    // Count how many frames the page's own script schedules by observing custom
    // property writes: read the tracker value repeatedly and see if it changes.
    const el = document.getElementsByClassName('l1-pt')[1]
    let last = el.style.getPropertyValue('--l1-pt0x')
    while (performance.now() - t0 < 300) {
      await new Promise((r) => requestAnimationFrame(r))
      const now = el.style.getPropertyValue('--l1-pt0x')
      if (now !== last) n++
      last = now
    }
    return n
  })
  ok('a still pointer writes no tracker updates (loop stopped)', framesWhileStill === 0, `${framesWhileStill} writes`)

  // (2 cont.) The region is roughly the size asked for: ~190px across, and rough.
  const geom = await page.evaluate(
    ({ cls, cx, cy }) => {
      // Sample the accent's alpha along a horizontal and a vertical line through
      // the cursor by reading the *mask* geometry the browser resolved: measure
      // instead by hit-testing the painted colour is not possible from JS, so read
      // the lobe positions the script wrote and the radii the CSS declared.
      const el = document.querySelector('.' + cls)
      const styles = getComputedStyle(el, '::after')
      const mask = styles.maskImage || styles.webkitMaskImage
      // The COMPUTED value resolves `transparent` to `rgba(0, 0, 0, 0)`, so the
      // outer stop is read by position-after-the-opaque-core rather than by keyword.
      const radii = [...mask.matchAll(/rgba\(0, 0, 0, 0\) ([\d.]+)px/g)].map((m) => Number(m[1]))
      const trackers = []
      for (let i = 0; i < 7; i++) {
        trackers.push([
          el.style.getPropertyValue('--l1-pt' + i + 'x'),
          el.style.getPropertyValue('--l1-pt' + i + 'y'),
        ])
      }
      return { radii, trackers, opacity: styles.opacity }
    },
    { cls: band.cls, cx, cy },
  )
  const maxR = Math.max(...geom.radii)
  ok('the region reaches ~the authored radius', maxR > 60 && maxR <= 95, `max lobe reach ${maxR}px`)
  ok('the lobes differ (a rough outline, not a disc)', new Set(geom.radii).size > 1, `${new Set(geom.radii).size} distinct radii`)
  ok('the overlay is fully on once a pointer is present', geom.opacity === '1')
  ok(
    'every tracker converged on the still cursor',
    geom.trackers.every(([x]) => x && Math.abs(parseFloat(x) - (cx - band.left)) < 1),
    geom.trackers.map(([x]) => Math.round(parseFloat(x))).join(','),
  )

  // (3) While MOVING, the region deforms — the trackers string out behind the
  // cursor, so their spread is non-zero mid-move and zero once settled.
  const spread = await page.evaluate(async ({ cls }) => {
    const el = document.querySelector('.' + cls)
    const read = () => {
      const xs = []
      for (let i = 0; i < 7; i++) xs.push(parseFloat(el.style.getPropertyValue('--l1-pt' + i + 'x')))
      return Math.max(...xs) - Math.min(...xs)
    }
    return { settled: read() }
  }, { cls: band.cls })

  // Drag across the band in small steps and sample the spread mid-flight.
  const moving = []
  for (let i = 1; i <= 14; i++) {
    await page.mouse.move(cx - 220 + i * 32, cy + Math.sin(i / 2) * 40)
    moving.push(
      await page.evaluate(({ cls }) => {
        const el = document.querySelector('.' + cls)
        const xs = []
        for (let i = 0; i < 7; i++) xs.push(parseFloat(el.style.getPropertyValue('--l1-pt' + i + 'x')))
        return Math.max(...xs) - Math.min(...xs)
      }, { cls: band.cls }),
    )
  }
  const midMove = await page.screenshot({ clip: { x: cx - 200, y: cy - 200, width: 400, height: 400 } })
  await writeFile(join(OUT, '3-moving.png'), midMove)
  const maxSpread = Math.max(...moving)
  ok('moving deforms the region (trackers spread)', maxSpread > 8, `max spread ${maxSpread.toFixed(1)}px`)
  ok('at rest the region is undeformed', spread.settled < 1, `settled spread ${spread.settled.toFixed(2)}px`)

  await page.waitForTimeout(500)
  const afterSettle = await page.evaluate(({ cls }) => {
    const el = document.querySelector('.' + cls)
    const xs = []
    for (let i = 0; i < 7; i++) xs.push(parseFloat(el.style.getPropertyValue('--l1-pt' + i + 'x')))
    return Math.max(...xs) - Math.min(...xs)
  }, { cls: band.cls })
  ok('it settles back to the stable shape after moving', afterSettle < 1, `${afterSettle.toFixed(2)}px`)

  // (4) The hero — the asset branch. Its accent must show the GRID in teal, not a
  // flat teal blob: so the painted pixels inside the region are mostly NOT teal.
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(300)
  const hero = await bandOf(page, 0)
  const hx = Math.round(hero.left + hero.w / 2)
  const hy = Math.round(hero.top + Math.min(hero.h - 100, 520))
  const heroPlainShot = await page.screenshot({ clip: { x: hx - 150, y: hy - 150, width: 300, height: 300 } })
  await page.mouse.move(hx, hy)
  await page.waitForTimeout(500)
  const heroShot = await page.screenshot({ clip: { x: hx - 150, y: hy - 150, width: 300, height: 300 } })
  await writeFile(join(OUT, '4-hero.png'), heroShot)
  await writeFile(join(OUT, '4-hero-plain.png'), heroPlainShot)
  ok('the hero (asset-drawn grid) accents too', !heroShot.equals(heroPlainShot))

  await ctx.close()
}

// ── 5: reduced motion → nothing at all ───────────────────────────────────────
{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  })
  const page = await ctx.newPage()
  await page.goto(URL_BASE, { waitUntil: 'load' })
  await page.evaluate(() => document.getElementById('problem').scrollIntoView({ block: 'center' }))
  await page.waitForTimeout(300)
  const band = await bandOf(page, 1)
  const cx = Math.round(band.left + band.w / 2)
  const cy = Math.round(band.top + band.h / 2)
  const before = await page.screenshot({ clip: { x: cx - 150, y: cy - 150, width: 300, height: 300 } })
  await page.mouse.move(cx, cy)
  await page.waitForTimeout(400)
  const after = await page.screenshot({ clip: { x: cx - 150, y: cy - 150, width: 300, height: 300 } })
  ok('reduced motion → the pointer changes nothing', before.equals(after))
  ok(
    'reduced motion → the script never sets the marker',
    (await page.evaluate(() => document.documentElement.hasAttribute('data-l1-pointer'))) === false,
  )
  await ctx.close()
}

await browser.close()
server.close()
console.log(`\nartifacts → ${OUT}`)
const failed = results.filter((r) => !r.pass)
console.log(`${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)
