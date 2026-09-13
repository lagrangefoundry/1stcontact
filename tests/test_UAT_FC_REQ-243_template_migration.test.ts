/**
 * [[REQ-243]] — **the v6 → v7 step: a gated download keeps sending its mail.**
 *
 * WHY A STEP AT ALL, WHEN THE NEW KEY IS OPTIONAL. Because v7 gives an old shape
 * a NEW MEANING. Through v6 the receiver rendered one hardcoded template and
 * rendered it whenever the form declared an artifact; under v7 the message is
 * `config.template` and ABSENCE means *send nothing*. Every gated download this
 * product has ever delivered is a v6 instance carrying assets and, necessarily,
 * no `template` — there was no such key to carry. Read under v7's rule those
 * forms name nothing and go quiet.
 *
 * SO THE FAILURE THIS FILE EXISTS TO CATCH IS SILENCE, which is the worst shape
 * a regression can take here: an artifact somebody asked for never arriving,
 * through the one door nothing is watching. [[BUG-85]]'s guard catches a MISSING
 * step; nothing catches a step that is declared and wrong, and this one is not
 * an identity function.
 *
 * AND THE OTHER HALF IS THAT IT INVENTS NOTHING. A form that promised no
 * artifact sent no mail under v6, and an absent `template` is v7's way of saying
 * exactly that — so it must come out unchanged. Naming a welcome for it would be
 * this migration deciding what a business's copy says, which is the one thing it
 * must not do, and would mail a stranger words nobody wrote.
 *
 * THE FALSIFIERS THIS FILE EXISTS FOR:
 *
 *   - *an upgraded gated form naming no template* — every existing whitepaper
 *     delivery stops, silently;
 *   - *an upgraded empty form naming one* — copy invented on a business's behalf
 *     and sent to somebody who only joined a list;
 *   - *a form whose template was already chosen being overwritten* — the step is
 *     a default for a key that did not exist, not an opinion about one that does;
 *   - *the bump arriving without the step*, which is [[BUG-85]] again.
 */
import { describe, it, expect } from 'vitest'
import { getModuleMeta, latestModuleVersion } from '../packages/framework/src/modules/catalog'
import { missingMigrations, upgradeInstance } from '../packages/framework/src/modules/upgrade'
import { validateBehaviorConfig } from '../packages/framework/src/modules/behavior'
import { contactFormTemplateRefs } from '../packages/framework/src/modules/contact-form/templates'

/** The `form` slot is required, so every fixture below supplies the same one. */
const FORM_SLOT = {
  kind: 'box' as const,
  children: [{ kind: 'control' as const, control: 'submit' }],
}

const PAPER = { key: 'paper', name: 'the whitepaper', url: 'https://example.test/paper' }

/** One stored v6 `contact-form` — the shape every live instance is in today. */
function storedV6(config: Record<string, unknown>) {
  return {
    id: 'signup',
    type: 'contact-form',
    version: 6,
    config: {
      fields: [{ name: 'email', label: 'Your email', type: 'email', required: true }],
      submitLabel: 'Send',
      ...config,
    },
    slots: { form: FORM_SLOT },
  }
}

describe('REQ-243 — contact-form v6 → v7', () => {
  it('test_UAT_FC_REQ-243_a_stored_gated_form_keeps_sending_the_asset_template', () => {
    const { instance } = upgradeInstance(storedV6({ assets: [PAPER] }))

    // THE TEMPLATE IT WAS ALREADY SENDING, said out loud. Under v6 this was the
    // receiver's hardcoded choice; under v7 it is the form's own, and the step
    // is what carries the one into the other.
    expect(instance.config.template).toBe('asset')
    // The assets are untouched — this step is about the message, not the set.
    expect(instance.config.assets).toEqual([PAPER])

    // THE VERSION IS THE CATALOG'S CURRENT ONE AND NOT LITERALLY 7, so this
    // assertion keeps meaning what it says after the next bump.
    expect(instance.version).toBe(latestModuleVersion('contact-form'))
    expect(
      validateBehaviorConfig(getModuleMeta('contact-form', instance.version), instance.config),
    ).toEqual([])
  })

  it('test_UAT_FC_REQ-243_a_stored_form_promising_nothing_still_names_nothing', () => {
    const { instance } = upgradeInstance(storedV6({ assets: [] }))

    // NOT A DEFAULT DECLINING TO BE HELPFUL — the same behaviour it already had.
    // A v6 instance with no assets sent no mail, and an absent `template` is
    // v7's way of saying so.
    expect(instance.config.template).toBeUndefined()
    expect(
      validateBehaviorConfig(getModuleMeta('contact-form', instance.version), instance.config),
    ).toEqual([])
  })

  /**
   * A HALF-FINISHED ITEM COUNTS, and the direction is deliberate.
   *
   * The receiver reads an item missing its key or its URL as no item
   * ([[REQ-241]]), so such a form delivers nothing under either version and the
   * behaviour is preserved whichever way this goes. Naming the template anyway is
   * the forgiving choice: the author's intent to gate a download is on the page,
   * and completing the item later then simply works rather than failing for a
   * second, invisible reason.
   */
  it('test_UAT_FC_REQ-243_a_half_declared_asset_still_names_the_delivery_template', () => {
    const { instance } = upgradeInstance(storedV6({ assets: [{ key: 'orphan', name: 'a paper' }] }))
    expect(instance.config.template).toBe('asset')
  })

  /**
   * A form that ALREADY names a template is left alone.
   *
   * The step is a default for a key that did not exist in the version it is
   * migrating from — not an opinion about one that does. An instance written
   * against v7 and re-run through the ladder must come out saying what its author
   * said, and `asset` overwriting a business's own welcome is the shape of bug a
   * migration keyed on the assets rather than on the absence would have.
   */
  it('test_UAT_FC_REQ-243_a_template_already_chosen_is_not_overwritten', () => {
    const stored = { ...storedV6({ assets: [PAPER], template: 'house-welcome' }), version: 7 }
    const { instance } = upgradeInstance(stored)
    expect(instance.config.template).toBe('house-welcome')
  })

  it('test_UAT_FC_REQ-243_the_bump_ships_its_step_and_the_page_reader_finds_it', () => {
    expect(latestModuleVersion('contact-form')).toBe(7)
    // The bump did not arrive without the step that reaches it ([[BUG-85]]).
    expect(missingMigrations()).toEqual([])

    // …and the reader the publish check uses finds what the step wrote, which is
    // the seam between the two halves of this ticket: a migration that named the
    // template under a key the survey does not read would be invisible to the
    // gate.
    const { instance } = upgradeInstance(storedV6({ assets: [PAPER] }))
    expect(contactFormTemplateRefs({ modules: [instance] })).toEqual([
      { instanceId: 'signup', index: 0, templateKey: 'asset' },
    ])
  })

  /**
   * The reader is defensive, because what it is handed is a stored page — a JSON
   * blob out of a draft or a frozen revision, whose shape the contract governs at
   * the write and cannot govern retrospectively. A publish that died on a bad
   * page could not tell the author which page it was.
   */
  it('test_UAT_FC_REQ-243_the_page_reader_survives_a_malformed_page', () => {
    expect(contactFormTemplateRefs(null)).toEqual([])
    expect(contactFormTemplateRefs({ modules: 'not a list' })).toEqual([])
    expect(contactFormTemplateRefs({ modules: [null, { type: 'carousel' }] })).toEqual([])
    // A form naming nothing is ABSENT rather than present-and-empty: naming no
    // template is an intended configuration, so a ref would be a thing every
    // caller has to remember to skip.
    expect(contactFormTemplateRefs({ modules: [storedV6({ assets: [] })] })).toEqual([])
    expect(
      contactFormTemplateRefs({ modules: [{ type: 'contact-form', id: 'a', config: { template: '  ' } }] }),
    ).toEqual([])
  })
})
