import { describe, it, expect, afterAll } from 'vitest'
import { secretHookHarness, type HookRun } from './support/secret-hook'

// The harness — a stub `npx wrangler` first on PATH — is shared with the other
// hooks in `bin/deploy.d/secrets/` ([[REQ-196]]). It was written here first, for
// one hook; the contract it exercises belongs to the DIRECTORY, so a second copy
// would be two descriptions of one contract free to disagree.
const harness = secretHookHarness('bin/deploy.d/secrets/10-anthropic-api-key', 'ANTHROPIC_API_KEY')

afterAll(() => harness.dispose())

type Opts = Omit<HookRun, 'value'> & {
  key?: string // ANTHROPIC_API_KEY in the operator's shell
}

function runHook(o: Opts) {
  return harness.run({ ...o, value: o.key })
}

describe('REQ-149 — the deploy secret hook asks the store, not only the shell', () => {
  it('test_UAT_FC_REQ-149_secret_hook_keeps_a_secret_already_in_place', () => {
    // The regression this ticket fixes: nothing exported, but Cloudflare has
    // held the value since an earlier deploy. That must not stop the deploy.
    const r = runHook({ stored: ['ANTHROPIC_API_KEY'] })

    expect(r.code).toBe(0)
    expect(r.out).toMatch(/already on 1stcontact-control-app/)
    expect(r.out).toMatch(/left alone/)
    expect(r.pushed).toBeNull() // nothing was overwritten
  })

  it('test_UAT_FC_REQ-149_secret_hook_pushes_when_the_operator_supplies_a_value', () => {
    // Supplying a value is how a rotation is expressed, so it still pushes —
    // even when the name is already there.
    const r = runHook({ key: 'sk-ant-rotated', stored: ['ANTHROPIC_API_KEY'] })

    expect(r.code).toBe(0)
    expect(r.pushed).toBe('sk-ant-rotated') // exact: no trailing newline
    expect(r.out).toMatch(/pushed ANTHROPIC_API_KEY/)
  })

  it('test_UAT_FC_REQ-149_secret_hook_fails_when_the_key_exists_nowhere', () => {
    // The guard the original hook was written for is intact.
    const r = runHook({ stored: [] })

    expect(r.code).toBe(1)
    expect(r.out).toMatch(/ANTHROPIC_API_KEY is not set in your environment/)
    expect(r.out).toMatch(/the Worker has no ANTHROPIC_API_KEY either/)
    expect(r.pushed).toBeNull()
  })

  it('test_UAT_FC_REQ-149_secret_hook_fails_when_the_store_cannot_be_read', () => {
    // Only a positive read satisfies the guard. An unanswered question is not
    // a yes — a first deploy, a dead network and a token missing Workers
    // Scripts read all land here rather than skipping confidently.
    const r = runHook({ listFails: true })

    expect(r.code).toBe(1)
    expect(r.out).toMatch(/could not be read to check/)
    expect(r.pushed).toBeNull()
  })

  it('test_UAT_FC_REQ-149_secret_hook_rehearses_the_same_decision', () => {
    // --dry-run reports the decision it would have acted on, and changes
    // nothing. Both outcomes, plus the failure, must survive the rehearsal.
    const keep = runHook({ stored: ['ANTHROPIC_API_KEY'], dryRun: true })
    expect(keep.code).toBe(0)
    expect(keep.out).toMatch(/would leave it/)
    expect(keep.pushed).toBeNull()

    const push = runHook({ key: 'sk-ant-x', stored: [], dryRun: true })
    expect(push.code).toBe(0)
    expect(push.out).toMatch(/would push ANTHROPIC_API_KEY/)
    expect(push.pushed).toBeNull() // a rehearsal uploads nothing

    // A rehearsal that passed while the real deploy would abort is not a
    // rehearsal, so the missing-everywhere case fails here too.
    const gone = runHook({ stored: [], dryRun: true })
    expect(gone.code).toBe(1)
  })

  it('test_UAT_FC_REQ-149_secret_hook_never_prints_the_value', () => {
    // The standing rule for every hook in this directory: report the name and
    // the destination, never the value — not even truncated.
    const value = 'sk-ant-super-secret-do-not-print'
    const r = runHook({ key: value, stored: [] })

    expect(r.code).toBe(0)
    expect(r.out).not.toContain(value)
    expect(r.out).not.toContain(value.slice(0, 12))
  })

  it('test_UAT_FC_REQ-149_secret_hook_leaves_the_public_site_alone', () => {
    // public-site serves rendered bytes and must never carry a model
    // credential — it exits before it even looks at the store.
    const r = runHook({ app: 'public-site', stored: [] })

    expect(r.code).toBe(0)
    expect(r.pushed).toBeNull()
    expect(r.out.trim()).toBe('')
  })
})
