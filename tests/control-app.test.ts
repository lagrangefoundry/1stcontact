import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { unstable_dev, type UnstableDevWorker } from 'wrangler'

describe('control-app worker', () => {
  let worker: UnstableDevWorker

  beforeAll(async () => {
    worker = await unstable_dev('apps/control-app/src/index.ts', {
      config: 'apps/control-app/wrangler.toml',
      // Disable filesystem persistence: this placeholder worker has no storage
      // bindings, and the default `.wrangler/state` dir is shared across
      // parallel test files, causing SQLITE_BUSY contention on Miniflare's
      // internal SQLite when workerd starts up.
      persist: false,
      experimental: { disableExperimentalWarning: true },
    })
  })

  afterAll(async () => {
    await worker.stop()
  })

  it('test_UAT_FC_REQ-1_control_app_returns_placeholder', async () => {
    const res = await worker.fetch('/')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('Hello from app.1stcontact.io')
    expect(res.headers.get('content-type')).toContain('text/plain')
  })
})
