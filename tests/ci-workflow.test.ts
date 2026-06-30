import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { parse } from 'yaml'

const wf = parse(readFileSync('.github/workflows/ci.yml', 'utf8'))

describe('ci workflow', () => {
  it('test_UAT_FC_REQ-1_ci_workflow_lints', () => {
    // (1) triggers on pull_request
    expect(wf.on.pull_request).toBeTruthy()

    // (2) and (3) runs dryrun:public, dryrun:control, and pnpm test
    const runs = wf.jobs['build-and-test'].steps
      .filter((s: { run?: string }) => s.run)
      .map((s: { run: string }) => s.run)
      .join('\n')
    expect(runs).toContain('pnpm test')
    expect(runs).toContain('dryrun:public')
    expect(runs).toContain('dryrun:control')
  })
})
