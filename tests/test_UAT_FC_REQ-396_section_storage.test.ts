/**
 * [[REQ-396]] — storing a page as sections, over the memory and filesystem
 * adapters. The D1 adapter runs the same contract in workerd
 * (`test_UAT_FC_REQ-396_section_storage.workers.test.ts`).
 */
import { afterEach, describe } from 'vitest'
import { makeFsSite, makeMemorySite, type SiteFixture, type SiteSeedOptions } from './support/site-factory'
import { describePageSectionsContract } from './support/page-sections-contract'

describe('REQ-396 — a page stored as a frame plus sections', () => {
  const open: SiteFixture[] = []
  afterEach(async () => {
    for (const f of open.splice(0)) await f.dispose()
  })
  for (const backend of [
    { name: 'filesystem', make: async (o?: SiteSeedOptions) => makeFsSite(o) },
    { name: 'memory', make: async (o?: SiteSeedOptions) => makeMemorySite(o) },
  ]) {
    describePageSectionsContract(backend, (f) => open.push(f))
  }
})
