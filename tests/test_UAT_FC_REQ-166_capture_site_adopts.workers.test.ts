import { env } from 'cloudflare:test'
import { beforeAll, describe, expect, it } from 'vitest'
import { applySchema, ensureTenant } from './support/d1-site-factory'
import { FakeCaptureDriver } from './support/fake-capture-driver'
import { r2ReferenceStore } from '../tools/generate/src/store/r2-reference-store'
import type { ReferenceStoreEnv } from '../tools/generate/src/store/r2-reference-store'
import type { ReferenceStore } from '../tools/generate/src/store/reference-store'
import { fidelityOperations } from '../tools/generate/src/cli/ai/fidelity-core'
import type { FidelityDeps } from '../tools/generate/src/cli/ai/fidelity-core'
import { adoptCapture } from '../apps/control-app/src/capture-material'
import { ticketStoreFor, type TicketStore } from '../apps/control-app/src/tickets'
import { listMaterial } from '../apps/control-app/src/material'

/**
 * REQ-166 — **`capture_site` finishes the job it starts.**
 *
 * WHY THIS IS THE ENTRY POINT AND NOT A NEW ROUTE. The assistant already
 * captures: `capture_site` is a declared operation on [[REQ-157]]'s fidelity
 * surface, and until this ticket its bundle landed in the `ReferenceStore` and
 * STOPPED THERE — the asymmetry the ticket exists to close. So the second half
 * belongs to the operation that already had the first, and these drive the
 * production operation rather than a wrapper written to be testable.
 *
 * WHAT IS REAL. The capture pipeline, the R2 reference store, the D1 ticket
 * store and the adoption are all production code inside workerd. The ONE double
 * is the browser — a third party reached over a wire protocol, and the seam the
 * whole `BrowserDriver` design exists to have injected. The describer is absent
 * rather than stubbed here, which is deliberate: it proves the degraded path
 * that a deployment with no vision key actually takes.
 *
 * THE TWO CLAIMS:
 *
 *  1. `capture_site` YIELDS BOTH A BUNDLE AND A REFERENCE, and says which.
 *  2. A HOST WITH NO TICKET STORE CAPTURES EXACTLY AS BEFORE and says no
 *     reference was written — rather than failing, and rather than being silent.
 */

function refEnv(): ReferenceStoreEnv {
  return env as unknown as ReferenceStoreEnv
}

const TENANT = 'tenant-adopt'

beforeAll(async () => {
  await applySchema()
  await ensureTenant(TENANT)
})

/** The fidelity deps, with the browser doubled and adoption optionally wired. */
function deps(
  references: ReferenceStore,
  adopt?: (bundle: string) => Promise<{ uid: string; created: boolean }>,
): FidelityDeps {
  return {
    slug: 'site',
    origin: 'https://app.test',
    references,
    driverFactory: async () => new FakeCaptureDriver(),
    // The guard is the production one; the driver behind it is the fake.
    guardedDriver: () => async () => new FakeCaptureDriver(),
    ...(adopt ? { adoptCapture: adopt } : {}),
  }
}

async function tenantStores(tenantId: string): Promise<{
  tickets: TicketStore
  references: ReferenceStore
}> {
  await ensureTenant(tenantId)
  const tickets = await ticketStoreFor({
    DB: env.DB as D1Database,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: tenantId,
  })
  const references = await r2ReferenceStore(refEnv()).forTenant(tenantId)
  return { tickets, references }
}

describe('REQ-166 — capture_site writes the site up as well as storing it', () => {
  it('test_UAT_FC_REQ-166_capture_site_yields_both_a_bundle_and_a_reference', async () => {
    const { tickets, references } = await tenantStores(`${TENANT}-both`)
    const ops = fidelityOperations(
      deps(references, async (bundle) => {
        const adopted = await adoptCapture(tickets, references.bundle(bundle), {
          clientDomain: 'theirsite.test',
        })
        return { uid: adopted.ticket.uid, created: adopted.created }
      }),
    )

    const result = (await ops.capture_site({ url: 'http://fixture.test/pricing' })) as {
      bundle: string
      url: string
      reference: { adopted: boolean; uid: string | null; created: boolean; why: string | null }
    }

    // The bundle is still the operation's headline answer — nothing about the
    // corpus changed what `capture_site` is FOR.
    expect(result.bundle).toBe('fixture.test/pricing')

    // AND IT SAYS WHETHER THE SITE WAS WRITTEN UP. A capture that stored
    // perfectly but was never adopted looks identical to a successful one
    // unless this says otherwise.
    expect(result.reference.adopted).toBe(true)
    expect(result.reference.created).toBe(true)
    expect(result.reference.why).toBeNull()
    expect(result.reference.uid).toBeTruthy()

    // The reference is real, is a `reference`, and is IN THE LIBRARY — which is
    // the whole point: a bundle the assistant can find and the client can see.
    const rows = await listMaterial(tickets)
    const row = rows.find((r) => r.uid === result.reference.uid)
    expect(row).toBeDefined()
    expect(row!.kind).toBe('capture')
    expect(row!.source_url).toBe('http://fixture.test/pricing')
    // The captured host is not the client's declared domain, so DOC-38 §10.1's
    // second row applies and the bytes may never be republished.
    expect(row!.republishable).toBe(false)

    // The title came from the page's own title, through the real extractor.
    expect(row!.title).toBe('Fixture Site')

    // With no describer configured the entry is still FINDABLE — by address,
    // palette and structure — and says plainly what is missing.
    const item = await tickets.get({ uid: result.reference.uid! })
    expect(item.ticket.body).toContain('](http://fixture.test/pricing)')
    expect(item.ticket.fields.description_status).toBe('no_describer')
  })

  it('test_UAT_FC_REQ-166_a_host_with_no_corpus_captures_as_before_and_says_so', async () => {
    const references = await r2ReferenceStore(refEnv()).forTenant(TENANT)
    // No `adoptCapture` — the `1c` CLI's shape, which has no ticket store at all.
    const ops = fidelityOperations(deps(references))

    const result = (await ops.capture_site({ url: 'http://nocorpus.test/' })) as {
      bundle: string
      assets: number
      reference: { adopted: boolean; why: string | null }
    }

    // THE CAPTURE IS UNAFFECTED. Every member is in the store, exactly as it was
    // before this ticket existed.
    expect(result.bundle).toBe('nocorpus.test/index')
    const members = await references.bundle(result.bundle).list()
    expect(members).toContain('capture.json')
    expect(members).toContain('screenshot.full.png')

    // AND THE ABSENCE IS REPORTED rather than passed over in silence.
    expect(result.reference.adopted).toBe(false)
    expect(result.reference.why).toContain('stored but not indexed')
  })

  it('test_UAT_FC_REQ-166_a_failed_adoption_does_not_lose_the_capture', async () => {
    const references = await r2ReferenceStore(refEnv()).forTenant(TENANT)
    const ops = fidelityOperations(
      deps(references, async () => {
        throw new Error('the corpus is unreachable')
      }),
    )

    const result = (await ops.capture_site({ url: 'http://flaky.test/' })) as {
      bundle: string
      reference: { adopted: boolean; why: string | null }
    }

    // 11–23MB of successfully mirrored site is not discarded because a write-up
    // failed — the same trade REQ-163 makes when indexing fails.
    expect(result.bundle).toBe('flaky.test/index')
    expect(await references.bundle(result.bundle).list()).toContain('capture.json')
    expect(result.reference.adopted).toBe(false)
    expect(result.reference.why).toContain('the corpus is unreachable')
  })
})
