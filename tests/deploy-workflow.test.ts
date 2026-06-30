import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { parse } from 'yaml'

const wf = parse(readFileSync('.github/workflows/deploy.yml', 'utf8'))

describe('deploy workflow', () => {
  it('test_UAT_FC_REQ-1_deploy_workflow_lints', () => {
    // (1) triggers on push to xgd-stable
    expect(wf.on.push.branches).toContain('xgd-stable')

    // (2) has a concurrency group
    expect(wf.concurrency?.group).toBeTruthy()

    // (3) exposes both Cloudflare secrets to the deploy job env
    const env = wf.jobs.deploy.env
    expect(env.CLOUDFLARE_API_TOKEN).toContain('CLOUDFLARE_API_TOKEN')
    expect(env.CLOUDFLARE_ACCOUNT_ID).toContain('CLOUDFLARE_ACCOUNT_ID')

    // (4) invokes wrangler deploy for both Workers
    const runs = wf.jobs.deploy.steps
      .filter((s: { run?: string }) => s.run)
      .map((s: { run: string }) => s.run)
      .join('\n')
    expect(runs).toContain('wrangler deploy')
    expect(runs).toContain('@1stcontact/public-site')
    expect(runs).toContain('@1stcontact/control-app')
  })
})
