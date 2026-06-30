import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { unstable_dev, type UnstableDevWorker } from 'wrangler'

describe('public-site worker', () => {
  let worker: UnstableDevWorker

  beforeAll(async () => {
    worker = await unstable_dev('apps/public-site/src/index.ts', {
      config: 'apps/public-site/wrangler.toml',
      experimental: { disableExperimentalWarning: true },
    })
  })

  afterAll(async () => {
    await worker.stop()
  })

  it('test_UAT_FC_REQ-1_public_site_returns_placeholder', async () => {
    const res = await worker.fetch('/')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('Hello from 1stcontact.io')
    expect(res.headers.get('content-type')).toContain('text/plain')
  })
})
