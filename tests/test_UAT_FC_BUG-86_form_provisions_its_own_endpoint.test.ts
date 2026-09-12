import { describe, expect, it } from 'vitest'
import { contactForm } from '../packages/framework/src/modules/contact-form/component'
import { LEAD_ACTION, LEAD_PATH } from '../packages/framework/src/modules/contact-form/fields'
import { contactFormMeta } from '../packages/framework/src/modules/contact-form/meta'
import { contactFormV4ToV5 } from '../packages/framework/src/modules/contact-form/migrate'
import { validateBehaviorConfig } from '../packages/framework/src/modules/behavior'
import { latestModuleVersion } from '../packages/framework/src/modules/catalog'
import { upgradeInstance } from '../packages/framework/src/modules/upgrade'
import { contactFormPreset } from '../packages/framework/src/l2/contact-form'
import { LEAD_PATH as SERVER_LEAD_PATH } from '../apps/public-site/src/lead'

/**
 * [[BUG-86]] — the form provisions its own endpoint.
 *
 * The defect these cover: submitting "Apply to join the early beta" answered
 * **404**. The form's `action` was an author-supplied, ROOT-relative
 * `/api/lead`, which resolves against the ORIGIN and discards the document's
 * directory — so in the builder preview, served at
 * `/b/<biz>/preview/<slug>/draft/`, the submit went to `app.1stcontact.io/api/lead`,
 * a path no route in `control-app` matches. It fell through to the asset binding
 * and came back 404.
 *
 * The same root-relative value is why a published NON-APEX site's leads would
 * land in the apex tenant's contact list ([[BUG-78]] finding 2): the site key
 * `public-site` reads out of the path is the apex's when the path starts at `/`.
 */

const FIELDS = [{ name: 'email', label: 'Email address', type: 'email', required: true }]

describe('BUG-86 — the contact form provisions its own endpoint', () => {
  it('test_UAT_FC_BUG-86_the_form_carries_the_endpoint_with_no_config_supplying_it', () => {
    // The config names no endpoint, because there is no key for one.
    const html = contactForm({
      config: { fields: FIELDS },
      slots: { form: contactFormPreset(FIELDS) },
    })
    expect(html).toContain(`action="${LEAD_ACTION}"`)
    expect(html).toContain('method="post"')
  })

  it('test_UAT_FC_BUG-86_action_is_not_a_setting_an_author_may_supply', () => {
    // Not merely defaulted — undeclared. An instance carrying one is refused,
    // and the refusal names the key, so a stale page says so rather than
    // quietly posting somewhere else.
    expect(contactFormMeta.config).not.toHaveProperty('action')

    const errors = validateBehaviorConfig(contactFormMeta, {
      fields: FIELDS,
      action: '/api/lead',
    })
    expect(errors.map((e) => e.field)).toContain('config.action')
  })

  it('test_UAT_FC_BUG-86_the_emitted_action_is_document_relative', () => {
    // The whole of the 404. A leading `/` resolves against the origin and
    // throws the channel prefix away; `./` resolves against the document's
    // directory, which is the channel root on every surface.
    expect(LEAD_ACTION.startsWith('/')).toBe(false)
    expect(LEAD_ACTION.startsWith('./')).toBe(true)
    // BUG-30's other reading: a colon in the first segment would be parsed as a
    // scheme. `./` forecloses it.
    expect(LEAD_ACTION.slice(2)).not.toContain(':')

    const html = contactForm({
      config: { fields: FIELDS },
      slots: { form: contactFormPreset(FIELDS) },
    })
    expect(html).not.toContain('action="/')
  })

  it('test_UAT_FC_BUG-86_it_resolves_to_the_real_endpoint_on_every_surface', () => {
    // The regression proof, against real document URLs rather than a shape
    // assertion. Each row is a surface that serves a form today.
    const cases: Array<{ document: string; endpoint: string }> = [
      // The builder preview — the surface this bug was reported from. The route
      // `control-app` answers is `/preview/<slug>/draft/api/lead`, under the
      // business-scope prefix the iframe's URL carries.
      {
        document: 'https://app.1stcontact.io/b/biz_1/preview/1stcontact/draft/',
        endpoint: 'https://app.1stcontact.io/b/biz_1/preview/1stcontact/draft/api/lead',
      },
      // …and from a sub-page of the same preview, whose directory is the same
      // channel root because a page slug is a single flat segment.
      {
        document: 'https://app.1stcontact.io/b/biz_1/preview/xgd/draft/whitepapers',
        endpoint: 'https://app.1stcontact.io/b/biz_1/preview/xgd/draft/api/lead',
      },
      // The published apex, where `leadTarget` resolves APEX_SITE_KEY.
      { document: 'https://1stcontact.io/', endpoint: 'https://1stcontact.io/api/lead' },
      { document: 'https://1stcontact.io/whitepapers', endpoint: 'https://1stcontact.io/api/lead' },
      // A published NON-APEX site. The site key in the resolved path is that
      // site's own — which is [[BUG-78]] finding 2, the cross-tenant lead leak,
      // closed by the same constant.
      {
        document: 'https://1stcontact.io/site/site_abc/',
        endpoint: 'https://1stcontact.io/site/site_abc/api/lead',
      },
      {
        document: 'https://1stcontact.io/site/site_abc/whitepapers',
        endpoint: 'https://1stcontact.io/site/site_abc/api/lead',
      },
    ]
    for (const { document, endpoint } of cases) {
      expect(new URL(LEAD_ACTION, document).toString()).toBe(endpoint)
    }
  })

  it('test_UAT_FC_BUG-86_a_root_relative_action_would_have_missed_every_prefixed_surface', () => {
    // The counter-proof: the value that shipped. Kept so the regression cannot
    // come back as "either shape works".
    const previewDoc = 'https://app.1stcontact.io/b/biz_1/preview/1stcontact/draft/'
    expect(new URL('/api/lead', previewDoc).toString()).toBe('https://app.1stcontact.io/api/lead')

    const siteDoc = 'https://1stcontact.io/site/site_abc/'
    expect(new URL('/api/lead', siteDoc).toString()).toBe('https://1stcontact.io/api/lead')
  })

  it('test_UAT_FC_BUG-86_the_edit_channel_still_advertises_no_endpoint', () => {
    // [[REQ-116]] — the edit render is deliberately non-functional. A channel
    // that cannot submit must not carry an action.
    const html = contactForm({
      config: { fields: FIELDS },
      slots: { form: contactFormPreset(FIELDS) },
      edit: true,
    })
    expect(html).not.toContain('action=')
    expect(html).not.toContain('method="post"')
  })

  it('test_UAT_FC_BUG-86_a_stored_v4_instance_upgrades_and_loses_its_action', () => {
    // Removing a required key is a breaking contract change, so the version is
    // bumped — and [[BUG-85]] makes a declared step the precondition for a bump,
    // because an instance pinned to a version the catalog no longer holds fails
    // to resolve and takes the page down with it.
    expect(latestModuleVersion('contact-form')).toBe(5)
    expect(contactFormMeta.migrations).toHaveProperty('5')

    const { instance, droppedConfigKeys } = upgradeInstance({
      id: 'beta-form',
      type: 'contact-form',
      version: 4,
      config: {
        action: '/api/lead',
        fields: FIELDS,
        submitLabel: 'Apply to join the early beta',
      },
      slots: { form: contactFormPreset(FIELDS) },
    })

    expect(instance.version).toBe(5)
    expect(droppedConfigKeys).toContain('action')
    expect(instance.config).not.toHaveProperty('action')
    // Everything else survives: the upgrade takes the endpoint away and nothing
    // the author designed.
    expect(instance.config!.submitLabel).toBe('Apply to join the early beta')
    expect(instance.config!.fields).toEqual(FIELDS)
    expect(validateBehaviorConfig(contactFormMeta, instance.config!)).toEqual([])
  })

  it('test_UAT_FC_BUG-86_the_migration_carries_everything_it_is_given', () => {
    // The step is an identity function, declared so the bump is not mistaken
    // for the omission BUG-85's guard exists to catch. It must not invent or
    // discard anything of its own — the key drop is `upgradeInstance`'s.
    const before = { config: { fields: FIELDS, action: '/api/lead' }, slots: {} }
    expect(contactFormV4ToV5(before)).toEqual(before)
  })

  it('test_UAT_FC_BUG-86_the_form_and_the_server_read_one_definition', () => {
    // `LEAD_PATH` lived in `public-site` while the module that has to post to it
    // lived in the framework. Two spellings would be a form and a server that
    // agree until they do not.
    expect(SERVER_LEAD_PATH).toBe(LEAD_PATH)
    expect(LEAD_ACTION).toBe(`./${LEAD_PATH}`)
  })
})
