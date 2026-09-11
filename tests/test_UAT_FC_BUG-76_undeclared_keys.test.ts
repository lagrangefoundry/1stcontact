/**
 * [[BUG-76]] Defect 2 — a key the contract has never heard of must be refused,
 * not stored.
 *
 * The session's AI passed `account: "https://app.1stcontact.io/account"` to
 * `account-chrome`. That key belongs to `account-portal`. It was stored, echoed
 * back in `changed`, and never questioned. The cause is structural: the loop
 * that validates a declaration is a loop over the DECLARED names, so a key
 * nobody declared cannot produce an error — a typo or a misremembered setting is
 * accepted, reads back verbatim, and does nothing.
 *
 * An undeclared SLOT name is the identical failure and is pinned here too: the
 * same loop, the same silent drop, and a subtree the author believed they had
 * placed that simply never renders.
 */
import { describe, expect, it } from 'vitest'
import {
  validateBehaviorConfig,
  validateBehaviorInstance,
  validateBehaviorSlots,
} from '../packages/framework/src/modules/behavior'
import { accountChromeMeta } from '../packages/framework/src/modules/account-chrome/meta'
import { getModule, latestModuleVersion } from '../packages/framework/src/modules/registry'
import { accountChromePreset } from '../packages/framework/src/l2/account-chrome'

const CONFIG = {
  signIn: 'https://app.example/sign-in',
  portal: 'https://app.example/account',
  businesses: 'https://app.example/builder',
}

describe('BUG-76 Defect 2 — undeclared keys are refused, naming what was declared', () => {
  it('test_UAT_FC_BUG-76_an_undeclared_config_key_is_refused_by_name', () => {
    // The exact key, from the exact session.
    const errors = validateBehaviorConfig(accountChromeMeta, {
      ...CONFIG,
      account: 'https://app.1stcontact.io/account',
    })
    expect(errors.length).toBe(1)
    expect(errors[0].field).toBe('config.account')
    // Named, so the author knows WHICH key was wrong …
    expect(errors[0].message).toContain("'account'")
    // … and told what the contract does declare, so they can find the right one
    // without a second round trip.
    expect(errors[0].message).toContain('signIn')
    expect(errors[0].message).toContain('portal')

    // A config with only declared keys is untouched by the new rule.
    expect(validateBehaviorConfig(accountChromeMeta, CONFIG)).toEqual([])
  })

  it('test_UAT_FC_BUG-76_an_undeclared_slot_name_is_refused_the_same_way', () => {
    // The same loop-over-declared-names shape. A slot called `dialogue` binds
    // nothing and renders nothing; before this it was accepted in silence.
    const slots = { ...accountChromePreset() }
    const typo = { ...slots, dialogue: slots.dialog }
    const errors = validateBehaviorSlots(accountChromeMeta, typo)
    const undeclared = errors.filter((e) => e.field === 'slots.dialogue')
    expect(undeclared.length).toBe(1)
    expect(undeclared[0].message).toContain("'dialogue'")
    expect(undeclared[0].message).toContain('dialog')

    expect(validateBehaviorSlots(accountChromeMeta, slots)).toEqual([])
  })

  it('test_UAT_FC_BUG-76_the_refusal_is_at_the_write_boundary_not_the_render', () => {
    // `validateBehaviorInstance` is what every edit verb goes through, so this is
    // where a stray key is stopped.
    const errors = validateBehaviorInstance(accountChromeMeta, {
      config: { ...CONFIG, account: 'https://app.1stcontact.io/account' },
      slots: accountChromePreset(),
    })
    expect(errors.map((e) => e.field)).toContain('config.account')

    // But an instance already stored with one still PAINTS. Isolation
    // ([[DOC-25]]): a malformed instance costs its own corner of the page and not
    // the page, so the strictness is a write-time refusal and never a blank
    // section on a published site.
    const { Component } = getModule('account-chrome', latestModuleVersion('account-chrome'))
    const html = Component({
      config: { ...CONFIG, account: 'https://app.1stcontact.io/account' },
      slots: accountChromePreset(),
      instanceId: 'chrome',
      capabilities: { accounts: true },
    })
    expect(html).toContain('data-account-chrome-dialog')
    expect(html).toContain('https://app.example/sign-in')
  })
})
