import { afterAll, describe, expect, it } from 'vitest'
import { secretHookHarness } from './support/secret-hook'

/**
 * story-39c992d3 — the image credential's deploy hook ([[REQ-208]]).
 *
 * Driven through the real `bin/deploy.d/secrets/30-openai-api-key` script with
 * the shared stub `npx wrangler` first on PATH (the one boundary faked: the
 * Cloudflare secret store).
 */
const harness = secretHookHarness('bin/deploy.d/secrets/30-openai-api-key', 'OPENAI_API_KEY')

afterAll(() => harness.dispose())

describe('story-39c992d3 — deploying never fails for a missing image credential', () => {
  it('test_UAT_AC2392_the_image_credential_deploy_step_never_fails_and_says_what_it_did', () => {
    // Push: set in the operator's environment.
    const push = harness.run({ value: 'sk-img-rotated', stored: [] })
    expect(push.code).toBe(0)
    expect(push.pushed).toBe('sk-img-rotated')
    expect(push.out).toMatch(/pushed OPENAI_API_KEY/)

    // Keep: unset here, already stored in the deployment.
    const keep = harness.run({ stored: ['OPENAI_API_KEY'] })
    expect(keep.code).toBe(0)
    expect(keep.pushed).toBeNull()
    expect(keep.out).toMatch(/already on .* left alone/)

    // Skip: absent everywhere.
    const absent = harness.run({ stored: [] })
    expect(absent.code).toBe(0)
    expect(absent.pushed).toBeNull()
    expect(absent.out).toMatch(/this deployment will have no image generation/)
    expect(absent.out).toMatch(/no image tool/)

    // Skip: the store could not be read.
    const unreadable = harness.run({ listFails: true })
    expect(unreadable.code).toBe(0)
    expect(unreadable.pushed).toBeNull()
    expect(unreadable.out).toMatch(/could not be read to check/)

    // Dry run: reports each decision and changes nothing.
    const dryPush = harness.run({ value: 'sk-img-x', stored: [], dryRun: true })
    expect(dryPush.code).toBe(0)
    expect(dryPush.out).toMatch(/would push OPENAI_API_KEY/)
    expect(dryPush.pushed).toBeNull()
    const dryKeep = harness.run({ stored: ['OPENAI_API_KEY'], dryRun: true })
    expect(dryKeep.code).toBe(0)
    expect(dryKeep.out).toMatch(/would leave it/)
    expect(dryKeep.pushed).toBeNull()
    const drySkip = harness.run({ stored: [], dryRun: true })
    expect(drySkip.code).toBe(0)
    expect(drySkip.out).toMatch(/would deploy without it/)
    expect(drySkip.pushed).toBeNull()

    // Any other app: does nothing.
    const other = harness.run({ app: 'public-site', value: 'sk-img-y', stored: [] })
    expect(other.code).toBe(0)
    expect(other.pushed).toBeNull()
    expect(other.out.trim()).toBe('')
  })
})
