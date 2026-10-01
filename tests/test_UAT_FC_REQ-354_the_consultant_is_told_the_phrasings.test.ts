import { describe, expect, it } from 'vitest'
import { containmentCheck } from '../tools/generate/src/cli/ai/account-core'
import { delegationMethod } from '../tools/generate/src/cli/ai/roles'

/**
 * [[REQ-354]] behaviour 5 — **the consultant is told the phrasings** the host
 * settles for free, in the delegation method it is primed with.
 *
 * The prose and the host's matcher are two statements of one contract, so this
 * holds them in step: every example the consultant is shown is one the host
 * actually claims. An example the host would not claim would teach the consultant
 * to write a check that silently goes to the worker after all.
 */
describe('REQ-354 the consultant is told how to ask for a host-settled check', () => {
  it('test_UAT_FC_REQ-354_the_delegation_method_names_each_phrasing_and_the_host_claims_every_example', () => {
    for (const writing of [false, true]) {
      const method = delegationMethod(true, writing)!
      const paragraph = method.split('\n\n').find((p) => p.startsWith('Three kinds of check'))
      expect(paragraph).toBeDefined()

      const examples = [...paragraph!.matchAll(/"([^"]+)"/g)].map((m) => m[1])
      expect(examples).toHaveLength(3)
      expect(examples.map((e) => containmentCheck(e)?.kind)).toEqual(['page', 'fields', 'addresses'])
    }
  })
})
