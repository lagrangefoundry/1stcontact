import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { chromiumAvailable, createPlaywrightDriver, runCapturePipeline } from '../tools/generate/src/cli/capture'

/**
 * [[BUG-202]] — a trade site whose network never goes idle is captured.
 *
 * rosenthalplumbing.com failed with `Navigation timeout of 30000 ms exceeded`
 * three times over, on a page that loads in under four seconds: chat, review and
 * consent widgets hold connections open, and navigation required `networkidle`.
 * This page does the same — a long-poll the server never answers, re-armed
 * forever, plus a beacon every 200 ms — and must be captured, with its
 * screenshot, well inside the timeout that used to expire.
 *
 * A REAL BROWSER, because the bug is in how a real one is told to wait. Skipped
 * (reported as such) where no Chromium can launch.
 */

const browserOk = await chromiumAvailable()

const PAGE = `<!doctype html><html><head><title>Busy Plumbing</title></head>
<body style="margin:0;font-family:sans-serif">
<h1 style="margin:40px">Busy Plumbing — 24/7 emergency service</h1>
<p style="margin:40px">Chat with us now.</p>
<script>
  function poll() { fetch('/poll').then(poll, poll) }
  poll()
  setInterval(function () { fetch('/beacon?t=' + Date.now()) }, 200)
</script>
</body></html>`

describe('BUG-202 — a page whose network never goes idle', () => {
  let server: Server
  let origin = ''

  beforeAll(async () => {
    server = createServer((req, res) => {
      if ((req.url ?? '').startsWith('/poll')) return // held open, never answered
      if ((req.url ?? '').startsWith('/beacon')) {
        res.statusCode = 204
        return void res.end()
      }
      res.setHeader('content-type', 'text/html; charset=utf-8')
      res.end(PAGE)
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  })

  afterAll(async () => {
    server?.closeAllConnections()
    await new Promise<void>((resolve) => server?.close(() => resolve()))
  })

  it.runIf(browserOk)(
    'test_UAT_FC_BUG-202_a_page_whose_network_never_goes_idle_is_captured_with_its_screenshot',
    async () => {
      const started = Date.now()
      const result = await runCapturePipeline(`${origin}/`, { driverFactory: createPlaywrightDriver, retries: 0 })
      const elapsed = Date.now() - started

      // The page, captured: its heading was read, and its screenshot is a PNG.
      expect(JSON.stringify(result.capture)).toContain('Busy Plumbing')
      expect(Array.from(result.screenshot.slice(0, 4))).toEqual([137, 80, 78, 71])
      // And well inside the 30 s navigation timeout that used to expire on it.
      expect(elapsed).toBeLessThan(25_000)
    },
    60_000,
  )
})
