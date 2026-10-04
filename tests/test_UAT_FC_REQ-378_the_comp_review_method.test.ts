import { describe, expect, it } from 'vitest'
import primingDocument from '../tools/generate/src/cli/ai/priming.json'

/**
 * [[REQ-378]] — **the comp review is the step before the first rough cut**, and
 * the consultant is told so in its own priming, with the tools to do it.
 *
 * Read off the configuration the session is primed from: the consultant's
 * priming, with and without a corpus. That the tools it names are granted is
 * proven by the workers suite, which reads them off the request the model is sent.
 */

type Section = { name?: string; text?: string[] }

const comps = (key: 'priming' | 'priming_without_corpus'): string => {
  const section = (primingDocument[key] as Section[]).find((s) => s.name === 'comps')
  expect(section, `${key} has a comps section`).toBeDefined()
  return (section!.text ?? []).join('\n')
}

describe('REQ-378 — the comp review method', () => {
  it('test_UAT_FC_REQ-378_the_priming_names_the_comp_review_as_the_step_before_the_first_build', () => {
    for (const key of ['priming', 'priming_without_corpus'] as const) {
      const text = comps(key)
      expect(text).toMatch(/comp review is the step before the\s+first build/)
      // The opening question, and the range to propose.
      expect(text).toContain('Who do\nyou lose jobs to?')
      expect(text).toMatch(/one national chain, one or two strong local\s+independents, and one outlier/)
      // Local independents are found, not remembered.
      expect(text).toMatch(/searching the web; never propose a site from memory/)
      // The tools it names, and the decision the conventions go into.
      for (const tool of ['capture_site', 'add_comp', 'note_comp', 'visual_concept']) expect(text).toContain(tool)
      expect(text).toMatch(/take screenshots sparingly/)
    }
  })
})
