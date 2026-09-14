import { env } from 'cloudflare:test'
import { beforeAll, describe, expect, it } from 'vitest'
import { registerReferenceBundleContract } from './support/reference-bundle-contract'
import { applySchema, ensureTenant, storeEnv } from './support/d1-site-factory'
import { FakeCaptureDriver } from './support/fake-capture-driver'
import { r2ReferenceStore } from '../tools/generate/src/store/r2-reference-store'
import type { ReferenceStoreEnv } from '../tools/generate/src/store/r2-reference-store'
import { memoryReferenceStore } from '../tools/generate/src/store/memory-reference-store'
import { UnknownTenantError, d1r2SiteStore } from '../tools/generate/src/store/d1r2-store'
import { CAPTURE_MEMBER, SCREENSHOT_MEMBER } from '../tools/generate/src/store/reference-store'
import { cmdCapturePage } from '../tools/generate/src/cli/capture/capture'
import {
  readCapture,
  readForms,
  readHints,
  readL1,
  readMultiState,
} from '../tools/generate/src/cli/capture/bundle'
import type { BrowserDriver } from '../tools/generate/src/cli/capture/types'

/**
 * Reconciliation UATs for story-0cb7f25b — the cloud half, inside workerd.
 *
 * WHAT MAKES THESE WORTH ANYTHING. Every assertion runs inside the runtime the
 * deployed Worker uses, against a REAL R2 bucket and a REAL D1 tenant registry
 * supplied by `@cloudflare/vitest-pool-workers`. The one thing that is not real
 * is the browser on the far side of the driver seam — a third party reached over
 * a wire protocol, and never the thing under test. Everything between it and the
 * bucket is the production code path: the capture pipeline, the bundle codec,
 * the cloud backing.
 *
 * THE FILE IS ITS OWN EVIDENCE FOR AC-1762. `capture.ts` is imported and run
 * here; if the capture pipeline still reached the filesystem — a `node:fs`
 * default backing, an inline `writeFileSync` — this module would not load at
 * all, let alone complete a capture. "It has no default backing, so the same
 * pipeline code runs on the operator's machine and in the cloud" is therefore
 * proved by the run rather than asserted about it.
 */

/** The bindings this backing needs. `BLOBS`, never `SITES` — client-private. */
function refEnv(): ReferenceStoreEnv {
  return env as unknown as ReferenceStoreEnv
}

function blobs(): R2Bucket {
  return (env as unknown as { BLOBS: R2Bucket }).BLOBS
}

/** The fake browser, injected the way the deployed caller injects the real one. */
const CAPTURE_OPTS = {
  driverFactory: async (): Promise<BrowserDriver> => new FakeCaptureDriver(),
  isEngineAvailable: async (): Promise<boolean> => true,
}

const TENANT = 'tenant-bundle-storage'

beforeAll(async () => {
  await applySchema()
  await ensureTenant(TENANT)
})

// ── the backing-agnostic contract, over the cloud backing ────────────────────

/**
 * THE SAME ASSERTIONS THE NODE SUITE RUNS (AC-1768/1769/1770/1771/1774), against
 * the third backing. A criterion is stated once, in
 * `support/reference-bundle-contract.ts`, and every backing is held to it —
 * which is what "identically on every backing" has to mean to be checkable.
 *
 * A FRESH TENANT PER STORE, because the contract asserts on `store.list()` being
 * empty to begin with. Isolating by tenant uses the barrier the backing already
 * has instead of inventing a second mechanism.
 */
let contractTenant = 0
registerReferenceBundleContract({
  name: 'cloud (R2)',
  async makeStore() {
    const id = `${TENANT}-contract-${(contractTenant += 1)}`
    await ensureTenant(id)
    return { store: await r2ReferenceStore(refEnv()).forTenant(id) }
  },
})

// ── AC-1762 — `1c capture page` completes where there is no filesystem ───────

describe('story-0cb7f25b — AC-1762 capture runs to completion in the serverless runtime', () => {
  it('test_UAT_AC1762_capture_page_completes_inside_workerd_and_names_its_bundle', async () => {
    const store = await r2ReferenceStore(refEnv()).forTenant(TENANT)

    // The pipeline is GIVEN its store — there is no default backing to fall back
    // to — so this is the same `cmdCapturePage` the operator's machine runs,
    // driven here against the client-private bucket.
    const result = await cmdCapturePage('http://cloudrun.test/pricing', store, CAPTURE_OPTS)

    // It returns a result naming the bundle it wrote…
    expect(result.name).toBe('cloudrun.test/pricing')
    // …and the run did not fail for want of a filesystem: the bundle is really
    // in the bucket, readable back as the artifact that went in.
    expect(await store.list()).toContain(result.name)
    const bundle = store.bundle(result.name)
    expect((await readCapture(bundle)).host).toBe('cloudrun.test')
    expect((await readL1(bundle))?.widths.length).toBeGreaterThan(0)
    expect((await bundle.read(SCREENSHOT_MEMBER))?.length).toBeGreaterThan(0)
  })
})

// ── AC-1765 — a cloud bundle and a laptop bundle are equivalent ──────────────

describe('story-0cb7f25b — AC-1765 a cloud bundle equals a locally written one', () => {
  /**
   * HOW THIS IS CHECKABLE AT ALL. The filesystem backing cannot run in workerd
   * and the cloud one cannot run in node, so no single test can hold both
   * bundles. What both projects CAN hold is the in-memory backing — so the claim
   * is proved in two composing halves: the node suite's contract run asserts
   * filesystem ≡ memory, and this asserts memory ≡ cloud, over the SAME capture
   * driven by the SAME fake browser. Equivalence is transitive, and the shared
   * backing is what carries it across the runtime boundary.
   *
   * WHAT "EQUIVALENT" MEANS, STATED RATHER THAN DISCOVERED: same name, same
   * member set, equal derived artifacts, equal capture records except
   * `capturedAt`. NOT byte-equal PNGs — the story names the sources (capture
   * time, what the live site served at each moment, font-load and layout settle
   * timing, per-engine ladder differences, and outright different PNG encoders),
   * and a test asserting past them would assert something the system does not
   * promise.
   */
  it('test_UAT_AC1765_the_same_capture_yields_equivalent_bundles_on_either_backing', async () => {
    const cloud = await r2ReferenceStore(refEnv()).forTenant(TENANT)
    const laptop = memoryReferenceStore()

    const inCloud = await cmdCapturePage('http://parity.test/', cloud, CAPTURE_OPTS)
    const locally = await cmdCapturePage('http://parity.test/', laptop, CAPTURE_OPTS)

    // The same URL names the same bundle wherever it is captured, which is what
    // lets the two be compared at all.
    expect(inCloud.name).toBe(locally.name)
    const a = cloud.bundle(inCloud.name)
    const b = laptop.bundle(locally.name)

    // Member for member, including the per-width ladder members.
    const members = await a.list()
    expect(members).toEqual(await b.list())
    expect(members.filter((m) => /^screenshot-\d+\.png$/.test(m)).length).toBeGreaterThan(1)

    // The derived artifacts compare equal outright: each is a pure function of
    // the recorded observation, so a difference here would be a real one.
    expect(await readL1(a)).toEqual(await readL1(b))
    expect(await readForms(a)).toEqual(await readForms(b))
    expect(await readHints(a)).toEqual(await readHints(b))
    expect(await readMultiState(a)).toEqual(await readMultiState(b))

    // The capture records are equal EXCEPT `capturedAt`, which is asserted
    // present and well-formed rather than equal. Asserting it that way — rather
    // than deleting the field and calling the rest equal — keeps the exception
    // visible.
    const capA = await readCapture(a)
    const capB = await readCapture(b)
    expect({ ...capA, capturedAt: null }).toEqual({ ...capB, capturedAt: null })
    for (const stamp of [capA.capturedAt, capB.capturedAt]) {
      expect(stamp).toEqual(expect.any(String))
      expect(Number.isNaN(Date.parse(stamp))).toBe(false)
    }

    // Screenshots are not compared byte-wise. What a bundle promises is a PNG at
    // each ladder width and a full-page PNG, so that is what is asserted.
    for (const bundle of [a, b]) {
      const shot = await bundle.read(SCREENSHOT_MEMBER)
      expect([...(shot ?? []).slice(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47])
    }
  })
})

// ── AC-1772 — the tenant is checked when the store is bound ──────────────────

describe('story-0cb7f25b — AC-1772 binding the cloud store checks the tenant', () => {
  it('test_UAT_AC1772_an_unknown_or_inactive_tenant_is_refused_at_binding_time', async () => {
    // Refused at BINDING, before any bundle exists — a deferred check would
    // surface as an empty bundle instead of a refusal.
    await expect(r2ReferenceStore(refEnv()).forTenant('nobody')).rejects.toBeInstanceOf(
      UnknownTenantError,
    )
    await expect(r2ReferenceStore(refEnv()).forTenant('nobody')).rejects.toThrow(/No tenant/)
    // The SAME refusal type site storage raises for the same condition, so a
    // caller catching "unknown tenant" need not know which store turned it away.
    await expect(d1r2SiteStore(storeEnv()).forTenant('nobody')).rejects.toBeInstanceOf(
      UnknownTenantError,
    )

    // Registered but not active is a DIFFERENT refusal, and the distinction is
    // load-bearing: unknown is a state a caller owning the configuration may
    // resolve by registering; inactive is a decision no caller may undo by
    // retrying.
    await ensureTenant('tenant-bundle-storage-closed', 'suspended')
    const refusal = r2ReferenceStore(refEnv()).forTenant('tenant-bundle-storage-closed')
    await expect(refusal).rejects.toThrow(/not active/)
    await expect(refusal).rejects.toMatchObject({ reason: 'inactive' })

    // A registered, active tenant yields a store that actually works.
    const store = await r2ReferenceStore(refEnv()).forTenant(TENANT)
    const bundle = store.bundle('usable.test/index')
    await bundle.write(CAPTURE_MEMBER, new TextEncoder().encode('{}'))
    expect(await store.list()).toContain('usable.test/index')
  })
})

// ── AC-1773 — one tenant's captured material is unaddressable from another ───

describe('story-0cb7f25b — AC-1773 captured material is private to the account', () => {
  it('test_UAT_AC1773_one_tenants_capture_is_unaddressable_from_another_tenants_store', async () => {
    await ensureTenant('tenant-bundle-a')
    await ensureTenant('tenant-bundle-b')
    const a = await r2ReferenceStore(refEnv()).forTenant('tenant-bundle-a')
    const b = await r2ReferenceStore(refEnv()).forTenant('tenant-bundle-b')

    // A competitor's site, captured on one account's behalf.
    const captured = await cmdCapturePage('http://competitor.test/', a, CAPTURE_OPTS)

    // The capturing account lists it; the other does not.
    expect(await a.list()).toContain(captured.name)
    expect(await b.list()).not.toContain(captured.name)

    // Asking the other account's store for that bundle BY NAME yields a handle
    // whose members read as absent and whose enumeration is empty. The read is
    // not refused, it is unaddressable: the handle composes every key from its
    // own account's prefix.
    const foreign = b.bundle(captured.name)
    expect(await foreign.read(CAPTURE_MEMBER)).toBeNull()
    expect(await foreign.read(SCREENSHOT_MEMBER)).toBeNull()
    expect(await foreign.list()).toEqual([])

    // …and the capturing account still reads its own bundle, so the assertion
    // above is about separation rather than about nothing having been written.
    expect(await a.bundle(captured.name).read(CAPTURE_MEMBER)).not.toBeNull()

    // The bytes are addressed under that account's reference prefix in the
    // client-private store. The barrier is a property of the key, so the key is
    // what is asserted — and it is `BLOBS`, not the bucket a public site is
    // served from by path.
    const listed = await blobs().list({ prefix: `t/tenant-bundle-a/ref/${captured.name}/` })
    expect(listed.objects.map((o) => o.key)).toContain(
      `t/tenant-bundle-a/ref/${captured.name}/${CAPTURE_MEMBER}`,
    )
    // Nothing of A's landed under B's prefix.
    const crossed = await blobs().list({ prefix: 't/tenant-bundle-b/ref/' })
    expect(crossed.objects).toEqual([])
  })
})
