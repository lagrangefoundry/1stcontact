/**
 * [[BUG-237]] — the layout check measures only text a reader can see.
 *
 * A `contact-form` renders, beside the L1 form a designer controls, text no one
 * is meant to see: an accessible label per field (clipped to a 1px box, the
 * sr-only pattern) and an `aria-hidden` honeypot labelled "Leave this field
 * empty". The check read them as visible text, so every field's label was "drawn
 * on top of" its own hidden twin and "cut off by the box it sits in", at both
 * widths, after every build — faults no setting could clear.
 *
 * The form here is a real one: four visibly-labelled fields laid out by the
 * framework's own preset, rendered by the catalog renderer into an L1 seam and
 * served, exactly the shape a builder page ships.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { latestModuleVersion } from '../packages/framework/src/index'
import { contactFormPreset, type ContactFormPresetField } from '../packages/framework/src/l2/contact-form'
import { engineAvailable, createPlaywrightDriver } from '../tools/generate/src'
import { serveOneModulePage } from '../tools/generate/src/conformance'
import { checkLayoutAt, layoutLine } from '../tools/generate/src/cli/ai/layout-check'

const browserOk = await engineAvailable('chromium')

const FIELDS: ContactFormPresetField[] = [
  { name: 'name', label: 'Name', type: 'text', labelMode: 'visible' },
  { name: 'phone', label: 'Phone', type: 'tel', labelMode: 'visible' },
  { name: 'email', label: 'Email', type: 'email', labelMode: 'visible' },
  { name: 'message', label: 'Message', type: 'textarea', labelMode: 'visible' },
]

describe.runIf(browserOk)('BUG-237 layout check skips text no reader can see', () => {
  it('test_UAT_FC_BUG-237_a_visibly_labelled_contact_form_has_no_findings', async () => {
    const served = await serveOneModulePage(
      'contact-form',
      {
        label: 'four-visible-fields',
        props: {
          version: latestModuleVersion('contact-form'),
          config: { fields: FIELDS.map((f) => ({ ...f, placeholder: '' })), submitLabel: 'Send' },
          slots: { form: contactFormPreset(FIELDS) },
        },
      },
      { mountInL1: true },
    )
    try {
      // The page really carries the hidden text the check used to trip on.
      const html = readFileSync(path.join(served.handle.rootDir, 'index.html'), 'utf8')
      expect(html).toContain('class="contact-form__label"')
      expect(html).toContain('Leave this field empty')

      const found = await checkLayoutAt(served.handle.url, 'contact', createPlaywrightDriver)
      expect(found.map(layoutLine)).toEqual([])
    } finally {
      await served.dispose()
    }
  }, 120000)
})
