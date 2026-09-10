import { describe, expect, it } from 'vitest'
import { CATALOG } from '../packages/framework/src/worker'
import { MODULE_CLIENT_JS } from '../packages/framework/src/modules/module-assets'
import { scopeBehaviorJs } from '../tools/generate/src/cli/module-assets'

/**
 * BUG-75 — `capabilities.js` must be a JavaScript module a browser will run.
 *
 * WHAT THIS GUARDS. Every behavior's `client.js` is spliced into one file and
 * shipped as `capabilities.js`. Three behaviors independently declared a
 * top-level `const ERROR_SELECTOR` — private names that happened to agree — and
 * in one shared scope that is a *parse* error, so the browser discarded the
 * whole bundle before running a line. Every behavior died for five days: the
 * sign-in dialog never became an overlay, the contact form navigated away
 * instead of submitting inline, carousels stopped advancing, portals stopped
 * loading.
 *
 * WHY IT SURVIVED THE EXISTING SUITE. Each `client.js` is unit-tested on its own
 * by importing the source, and REQ-145's UAT compares `module-assets.ts` to the
 * files it was generated from. Both pass on a bundle that cannot be parsed:
 * every input was valid and the composition was not, and nothing anywhere
 * parsed the composed result. That gap is what this file closes.
 *
 * HOW PARSING IS CHECKED. The bundle is imported as a `data:` module, so the
 * check is the real thing — the same module goal, the same grammar, the same
 * duplicate-binding rule a browser applies — rather than a regex approximating
 * it. Importing also runs it, which is a second claim worth having: every
 * behavior self-wires behind a `typeof document !== 'undefined'` guard, so in
 * this (node, no DOM) project a correct bundle loads and does nothing at all.
 */

/** Import `src` as an ES module, exactly as a browser would parse it. */
async function importAsModule(src: string): Promise<unknown> {
  const base64 = Buffer.from(src, 'utf8').toString('base64')
  return import(`data:text/javascript;base64,${base64}`)
}

describe('BUG-75 — the composed behavior bundle', () => {
  it('test_UAT_FC_BUG-75_the_composed_bundle_parses_as_a_module', async () => {
    // The regression itself. Before the fix this threw
    // `SyntaxError: Identifier 'ERROR_SELECTOR' has already been declared`.
    await expect(importAsModule(MODULE_CLIENT_JS)).resolves.toBeDefined()

    // Non-vacuous: an empty bundle would parse trivially, and the catalog does
    // ship client behaviour.
    expect(MODULE_CLIENT_JS.length).toBeGreaterThan(0)
  })

  it('test_UAT_FC_BUG-75_two_behaviors_may_declare_the_same_top_level_name', async () => {
    // The property the fix actually establishes, asserted independently of what
    // today's modules happen to be called. Renaming `ERROR_SELECTOR` would fix
    // the collision and wait for the next one; the composition must not depend
    // on behaviors choosing unique top-level names at all.
    const one = scopeBehaviorJs('alpha', "const SELECTOR = '[data-alpha]'\nexport function a() { return SELECTOR }")
    const two = scopeBehaviorJs('beta', "const SELECTOR = '[data-beta]'\nexport function b() { return SELECTOR }")

    await expect(importAsModule([one, two].join('\n\n'))).resolves.toBeDefined()

    // And the same two sources spliced flat — the old composition — is exactly
    // the failure this ticket is about. Without this the test above could pass
    // for reasons unrelated to scoping.
    const flat = "const SELECTOR = '[data-alpha]'\nconst SELECTOR = '[data-beta]'"
    await expect(importAsModule(flat)).rejects.toThrow(/already been declared/)
  })

  it('test_UAT_FC_BUG-75_every_behavior_is_scoped_and_still_marked', () => {
    // Each behavior keeps its `/* behavior: <id> */` marker, so the bundle stays
    // readable and attributable, and each marker is followed by its own block.
    const behaviors = CATALOG.filter((meta) =>
      MODULE_CLIENT_JS.includes(`/* behavior: ${meta.id} */`),
    )
    expect(behaviors.length).toBeGreaterThan(1)

    for (const meta of behaviors) {
      expect(MODULE_CLIENT_JS).toContain(`/* behavior: ${meta.id} */\n{\n`)
    }

    // Every behavior self-wires on load; the wrap must not have cost any of them
    // its auto-init, which is the only thing that makes the bundle do anything.
    const guards = MODULE_CLIENT_JS.match(/typeof document !== 'undefined'/g) ?? []
    expect(guards.length).toBeGreaterThanOrEqual(behaviors.length)
  })

  it('test_UAT_FC_BUG-75_no_export_statement_survives_composition', () => {
    // `export` is not legal inside a block, so the wrap requires dropping it.
    // Nothing imports the bundle — it self-wires — and the unit tests import
    // each `client.js` source directly, so this costs nothing; but a stray
    // statement-leading `export` would be a parse error inside the block.
    const statementLeadingExport = /^export\s/m
    expect(statementLeadingExport.test(MODULE_CLIENT_JS)).toBe(false)

    // The sources genuinely do export — otherwise the assertion above is empty.
    expect(scopeBehaviorJs('x', 'export function f() {}')).not.toMatch(/^export\s/m)
    expect(scopeBehaviorJs('x', 'export function f() {}')).toContain('function f() {}')
  })
})
