/**
 * [[BUG-76]] Defect 4 — the sign-in modal must become its confirmation.
 *
 * The operator's brief, verbatim: *"clicking the continue will replace that
 * content in the modal with a message — 'Please check your email…'"*. It did not.
 * `submitAddress` un-hid a paragraph and disabled two controls, so the panel did
 * not BECOME the confirmation, it grew one more line beneath a greyed-out form
 * (4a) — and the paragraph was a module-painted `<p>` emitted as a sibling of
 * the authored card, which under the overlay CSS made it a flex item centred on
 * the 50%-black scrim with no fill and no colour of its own (4c). Both were
 * invariant, so neither could be fixed from the page.
 *
 * WHY THE ASSERTIONS BELOW ARE STRUCTURAL. The unit test is JSDOM, where the
 * overlay CSS does not apply and geometry does not exist — which is exactly why
 * the existing REQ-200 UAT passed while the panel was visibly wrong: it asserted
 * `sent.hidden === false`, which was true. So what is asserted here is that the
 * confirmation IS the `sent` slot's authored subtree, and that no
 * component-painted message element remains anywhere in the output. The failure
 * mode was "an unstyleable element outside the region the author controls"; the
 * honest assertion is that no such element exists any more.
 */
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'
import { getModule, latestModuleVersion } from '../packages/framework/src/modules/registry'
import { accountChromeMeta } from '../packages/framework/src/modules/account-chrome/meta'
import { submitAddress } from '../packages/framework/src/modules/account-chrome/client.js'
import { accountChromePreset } from '../packages/framework/src/l2/account-chrome'

const CONFIG = {
  signIn: 'https://app.example/sign-in',
  portal: 'https://app.example/account',
  businesses: 'https://app.example/builder',
}

function render(slots = accountChromePreset()): string {
  const { Component } = getModule('account-chrome', latestModuleVersion('account-chrome'))
  return Component({
    config: CONFIG,
    slots,
    instanceId: 'chrome',
    capabilities: { accounts: true },
  })
}

function panel(html: string) {
  const doc = new JSDOM(`<!doctype html><html><body>${html}</body></html>`).window.document
  return {
    doc,
    section: doc.querySelector('[data-account-chrome]') as HTMLElement,
    form: doc.querySelector('form[data-account-chrome-dialog]') as HTMLFormElement,
    formPart: doc.querySelector('[data-account-chrome-form]') as HTMLElement,
    sent: doc.querySelector('[data-account-chrome-sent]') as HTMLElement,
    error: doc.querySelector('[data-account-chrome-error]') as HTMLElement,
  }
}

const completes = async () => ({ ok: true, status: 202 }) as Response
const unreachable = async () => {
  throw new TypeError('Failed to fetch')
}

describe('BUG-76 Defect 4a — the panel becomes the confirmation', () => {
  it('test_UAT_FC_BUG-76_a_completed_submit_replaces_the_form_with_the_message', async () => {
    const p = panel(render())

    // Before: the form is what the panel shows.
    expect(p.formPart.hidden).toBe(false)
    expect(p.sent.hidden).toBe(true)
    expect(p.error.hidden).toBe(true)

    await submitAddress(p.section, p.form, completes)

    // After: it is the message, and the form is no longer presented at all —
    // not greyed out beneath it. The address field, the submit, the close and
    // the label all go with it, which is what "replace that content" means.
    expect(p.formPart.hidden).toBe(true)
    expect(p.sent.hidden).toBe(false)
    for (const selector of ['[data-account-chrome-email]', 'button[type="submit"]', 'label']) {
      const node = p.doc.querySelector(selector)
      expect(node === null || p.formPart.contains(node)).toBe(true)
    }
  })

  it('test_UAT_FC_BUG-76_the_message_is_identical_at_every_status', async () => {
    // [[REQ-134]] survives the move from config to slot intact: the response is
    // still never read, so a known address and an unknown one are
    // indistinguishable by construction. The swap is what changed; when it
    // happens is not.
    const outcomes: string[] = []
    for (const status of [202, 404, 500]) {
      const p = panel(render())
      await submitAddress(p.section, p.form, async () => ({ ok: status < 400, status }) as Response)
      outcomes.push(
        [
          p.formPart.hidden,
          p.sent.hidden,
          p.error.hidden,
          (p.sent.textContent ?? '').replace(/\s+/g, ' ').trim(),
        ].join('|'),
      )
    }
    expect(new Set(outcomes).size).toBe(1)
    expect(outcomes[0]).toBe('true|false|true|Check your email for a sign-in link.')
  })

  it('test_UAT_FC_BUG-76_an_unreachable_server_shows_the_error_and_leaves_the_form', async () => {
    // A request that never arrived is a fact about the network, not about the
    // address — and the one case where trying again is the right next move. A
    // swapped-away form cannot be tried again, so this path does not swap.
    const p = panel(render())
    await submitAddress(p.section, p.form, unreachable)
    expect(p.error.hidden).toBe(false)
    expect(p.formPart.hidden).toBe(false)
    expect(p.sent.hidden).toBe(true)

    // And a later completed attempt clears it and swaps as usual.
    await submitAddress(p.section, p.form, completes)
    expect(p.error.hidden).toBe(true)
    expect(p.formPart.hidden).toBe(true)
    expect(p.sent.hidden).toBe(false)
  })
})

describe('BUG-76 Defect 4c — the confirmation is inside a card the author drew', () => {
  it('test_UAT_FC_BUG-76_the_message_is_the_sent_slots_authored_subtree', () => {
    // Both messages are slots now, so the words, the fill, the measure and the
    // rhythm are all the author's.
    expect(accountChromeMeta.slots.sent.required).toBe(true)
    expect(accountChromeMeta.slots.error.required).toBe(true)
    expect('sentMessage' in accountChromeMeta.config).toBe(false)

    const authored = {
      ...accountChromePreset(),
      sent: {
        kind: 'container' as const,
        layout: 'stack' as const,
        axes: { surfaceFill: '#00ff00' },
        children: [{ kind: 'text' as const, text: 'Please check your email.' }],
      },
    }
    const html = render(authored)
    const p = panel(html)

    // The author's own words and the author's own fill both reach the page …
    expect((p.sent.textContent ?? '').replace(/\s+/g, ' ').trim()).toBe('Please check your email.')
    expect(html).toContain('#00ff00')
    // … through the slot seam, like every other subtree this module mounts.
    expect(p.sent.getAttribute('data-l1-slot')).toBe('sent')
  })

  it('test_UAT_FC_BUG-76_no_component_painted_message_element_remains', () => {
    // The two invariant paragraphs are gone outright. Both messages are rendered
    // from slots the author supplied, so a panel whose slots say something else
    // says only that — there is no fallback copy left in the module to paint on
    // the scrim beside the card. (The stock words still appear when the L2 preset
    // is what supplied them, which is authored L1 like any other.)
    const html = render({
      ...accountChromePreset(),
      sent: { kind: 'text' as const, text: 'Sent.' },
      error: { kind: 'text' as const, text: 'No luck.' },
    })
    expect(html).not.toContain('account-chrome__sent')
    expect(html).not.toContain('account-chrome__error')
    expect(html).not.toContain('Could not reach the server')
    expect(html).not.toContain('Check your email')

    // The only `data-fc-invariant` element left in the dialog is the programmatic
    // label, which is an accessibility obligation rather than a message.
    const p = panel(html)
    const invariants = [...p.form.querySelectorAll('[data-fc-invariant]')]
    expect(invariants.length).toBe(1)
    expect(invariants[0].tagName.toLowerCase()).toBe('label')
  })
})
