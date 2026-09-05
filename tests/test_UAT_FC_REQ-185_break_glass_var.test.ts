import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { readWranglerConfig } from './support/wrangler-toml'

/**
 * REQ-185 — **the break-glass var is declared, and it is declared empty.**
 *
 * WHY THIS IS A TEST AND NOT A README LINE. [[REQ-185]] moved "owner of the 1st
 * Contact business" onto `memberships.role`, which put it behind a ROW — and
 * [[DOC-40]] §6's defence of an ambient flag is that it "works before any
 * membership row exists, and it cannot lock its holder out of the system that
 * grants it". `PLATFORM_ADMINS` is what keeps that promise once ownership is a
 * row, so a deployment where the key does not exist is one where the recovery
 * path does not exist either — discovered at the only moment it is ever reached
 * for, which is the moment nobody can get in.
 *
 * A named environment inherits NEITHER vars nor bindings, so "declared" has to
 * mean declared twice. That is this repository's standing rule for
 * `wrangler.toml` ([[REQ-144]], [[REQ-147]]) and the failure it guards is silent:
 * the deploy succeeds and the key is simply absent.
 *
 * AND EMPTY IS THE CORRECT STEADY STATE. The var is break glass — it is filled
 * in to recover a deployment and emptied again, because using it WRITES the
 * membership and the repair outlives the var. A value checked in here would be a
 * standing second authorisation path that no `memberships` row records.
 */

const REPO = path.resolve(import.meta.dirname, '..')
const WRANGLER = path.join(REPO, 'apps', 'control-app', 'wrangler.toml')

describe('REQ-185 — PLATFORM_ADMINS is configured for every environment', () => {
  it('test_UAT_FC_REQ-185_the_break_glass_var_is_declared_on_both_sides', () => {
    const config = readWranglerConfig(WRANGLER)
    expect(
      config.topLevel.vars,
      'PLATFORM_ADMINS is not declared at the top level',
    ).toContain('PLATFORM_ADMINS')
    expect(
      config.envs.production.vars,
      'PLATFORM_ADMINS is not declared for production, which inherits no vars — ' +
        'the recovery path DOC-40 §6 describes would not exist in the deployed Worker.',
    ).toContain('PLATFORM_ADMINS')
  })

  it('test_UAT_FC_REQ-185_the_break_glass_var_ships_empty', () => {
    const toml = readFileSync(WRANGLER, 'utf8')
    const declarations = toml
      .split('\n')
      .filter((line) => /^\s*PLATFORM_ADMINS\s*=/.test(line))
      .map((line) => line.trim())

    expect(declarations).toHaveLength(2)
    for (const line of declarations) {
      expect(
        line,
        'PLATFORM_ADMINS carries a value. It confers ownership of the 1st Contact ' +
          'business and entry into any business — a standing grant that no ' +
          'memberships row records. Fill it in to recover, then empty it: the seed ' +
          'writes the membership, so the repair survives the var.',
      ).toMatch(/^PLATFORM_ADMINS\s*=\s*""$/)
    }
  })
})
