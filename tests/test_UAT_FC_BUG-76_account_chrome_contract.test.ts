/**
 * [[BUG-76]] Defects 1 and 1b — the reference surfaces that describe
 * `account-chrome` must describe the component that exists.
 *
 * The session this ticket came from asked why the sign-in panel showed nothing
 * but a field and a Continue button. Every surface the AI could read said the
 * label was visible: `meta.ts` said "visible unless L1 hides it", the projected
 * reference said only who painted it, and the stylesheet three files away
 * clipped it to 1×1px unconditionally. So the AI concluded the component was
 * broken, told the operator to report a defect against it, wrote its own copy of
 * the line into the dialog slot, and warned the line would one day appear twice.
 * The component was correct throughout.
 *
 * These cases pin both halves: the label really is clipped and really does carry
 * the configured words, and every surface now says so in the same words —
 * generated from the declaration rather than hand-written per surface.
 */
import fs from 'node:fs'
import path from 'node:path'
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'
import { getModule, latestModuleVersion } from '../packages/framework/src/modules/registry'
import { accountChromeMeta } from '../packages/framework/src/modules/account-chrome/meta'
import { contactFormMeta } from '../packages/framework/src/modules/contact-form/meta'
import { accountChromePreset } from '../packages/framework/src/l2/account-chrome'
import { editBehaviorList } from '../tools/generate/src/cli/edit'
import { projectBehaviorCatalogue } from '../tools/generate/src/cli/kb-projection'

const CONFIG = {
  signIn: 'https://app.example/sign-in',
  portal: 'https://app.example/account',
  businesses: 'https://app.example/builder',
}

function render(overrides: Record<string, unknown> = {}): string {
  const { Component } = getModule('account-chrome', latestModuleVersion('account-chrome'))
  return Component({
    config: { ...CONFIG, ...overrides },
    slots: accountChromePreset(),
    instanceId: 'chrome',
    capabilities: { accounts: true },
  })
}

function dom(html: string): Document {
  return new JSDOM(`<!doctype html><html><body>${html}</body></html>`).window.document
}

const STYLES = fs.readFileSync(
  path.join(__dirname, '../packages/framework/src/modules/account-chrome/styles.css'),
  'utf8',
)

describe('BUG-76 Defect 1 — the label renders, invisibly, and the surfaces say so', () => {
  it('test_UAT_FC_BUG-76_email_label_carries_the_configured_words_and_is_clipped', () => {
    const doc = dom(render({ emailLabel: 'Your email' }))
    const label = doc.querySelector('label.account-chrome__label') as HTMLElement

    // It renders, with the configured text, associated with the field — the three
    // things the AI concluded were broken.
    expect(label).not.toBeNull()
    expect(label.textContent).toBe('Your email')
    expect(label.getAttribute('for')).toBe('chrome-email')
    expect(doc.querySelector('#chrome-email')).not.toBeNull()

    // And it is deliberately invisible: the module's own stylesheet clips it, so
    // "nothing appeared on the page" and "the label is not rendering" were never
    // the same statement.
    expect(label.hasAttribute('data-fc-invariant')).toBe(true)
    expect(STYLES).toContain('.account-chrome__label')
    expect(STYLES).toContain('clip-path: inset(50%)')
  })

  it('test_UAT_FC_BUG-76_the_declared_element_is_the_element_emitted', () => {
    // A declaration that names the wrong tag is a reference surface lying about
    // the component it describes. Both modules emitted `<label>` and declared
    // `span`.
    expect(accountChromeMeta.controls.emailLabel.element).toBe('label')
    expect(contactFormMeta.controls.label.element).toBe('label')
    expect(dom(render()).querySelector('label.account-chrome__label')).not.toBeNull()
  })

  it('test_UAT_FC_BUG-76_every_surface_tells_the_same_story_about_an_invariant', () => {
    const spec = accountChromeMeta.controls.emailLabel
    expect(spec.invariant).toBe(true)
    // ONE source for the sentence, stated beside the declaration.
    expect(spec.invariantPresentation).toBeTruthy()
    expect(spec.invariantPresentation).toContain('visually hidden')

    // The catalogue, which is what an author configuring an instance reads,
    // offers no way to bind it — it never has.
    const behaviors = editBehaviorList().data.behaviors as {
      type: string
      controls: Record<string, unknown>
    }[]
    const chrome = behaviors.find((b) => b.type === 'account-chrome')!
    expect(Object.keys(chrome.controls)).not.toContain('emailLabel')

    // The projected reference, which is what an author DIAGNOSING one reads,
    // lists it — and now says the same two things the catalogue says by omission
    // and the stylesheet says in CSS: you cannot bind it, and it does not paint.
    const doc = projectBehaviorCatalogue()
    // The CONTROL entry, not the config field of the same name — the config
    // field is the words, the control is the element that holds them.
    const line = doc.body
      .split('\n')
      .find((l) => l.includes('`emailLabel` — an HTML `label` element'))!
    expect(line).toContain('cannot be bound from L1')
    expect(line).toContain(spec.invariantPresentation!)
    // The claim that started the false defect is gone from every surface.
    expect(doc.body).not.toContain('visible unless L1 hides it')
  })
})

describe('BUG-76 Defect 1b — a panel authored from config alone has a visible prompt', () => {
  it('test_UAT_FC_BUG-76_label_mode_placeholder_puts_the_words_in_the_box', () => {
    // `contact-form` has had this answer since REQ-93; `account-chrome` had no
    // equivalent, so its only label was the clipped one and a config-only panel
    // shipped a bare field with no prompt of any kind.
    const placeholder = dom(render({ labelMode: 'placeholder', emailLabel: 'Your email' }))
    const field = placeholder.querySelector('#chrome-email') as HTMLInputElement
    expect(field.getAttribute('placeholder')).toBe('Your email')

    // The accessible name is not a mode: the clipped `<label>` is emitted either
    // way, so the words are never only in the placeholder.
    expect(placeholder.querySelector('label.account-chrome__label')!.textContent).toBe('Your email')
  })

  it('test_UAT_FC_BUG-76_label_mode_visible_leaves_the_words_to_L1', () => {
    // `visible` means the page authors a text run beside the control — which is
    // what the session's AI did by hand, and it is the supported route rather
    // than a workaround that will one day double up.
    const visible = dom(render({ labelMode: 'visible', emailLabel: 'Your email' }))
    const field = visible.querySelector('#chrome-email') as HTMLInputElement
    expect(field.hasAttribute('placeholder')).toBe(false)
    expect(visible.querySelector('label.account-chrome__label')!.textContent).toBe('Your email')

    // The default, so an instance that says nothing gets the authored route.
    const silent = dom(render({ emailLabel: 'Your email' }))
    expect((silent.querySelector('#chrome-email') as HTMLInputElement).hasAttribute('placeholder')).toBe(
      false,
    )
    expect(accountChromeMeta.config.labelMode.default).toBe('visible')
  })
})
