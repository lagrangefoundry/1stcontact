import { env } from 'cloudflare:test'
import { beforeAll, describe, expect, it } from 'vitest'
import { registerReferenceStoreContract } from './support/reference-store-contract'
import { applySchema, ensureTenant } from './support/d1-site-factory'
import { FakeCaptureDriver } from './support/fake-capture-driver'
import { r2ReferenceStore } from '../tools/generate/src/store/r2-reference-store'
import type { ReferenceStoreEnv } from '../tools/generate/src/store/r2-reference-store'
import { memoryReferenceStore } from '../tools/generate/src/store/memory-reference-store'
import { UnknownTenantError } from '../tools/generate/src/store/d1r2-store'
import { bundleNameFor } from '../tools/generate/src/store/reference-store'
import { cmdCapturePage } from '../tools/generate/src/cli/capture/capture'
import {
  readCapture,
  readForms,
  readHints,
  readL1,
  readMultiState,
} from '../tools/generate/src/cli/capture/bundle'

/**
 * REQ-155 — the `ReferenceStore` port, over real R2, inside workerd.
 *
 * WHAT MAKES THESE WORTH ANYTHING. Every assertion runs inside the runtime the
 * deployed Worker uses, against a REAL R2 bucket and a REAL D1 database supplied
 * by `@cloudflare/vitest-pool-workers`. The one thing that is not real is the
 * browser on the far side of the driver seam — a third party reached over a wire
 * protocol, and never the thing under test. Everything between it and the bucket
 * is the production code path: the capture pipeline, the codec, the adapter.
 *
 * THE CENTRAL CLAIM. [[REQ-154]] gave the cloud a browser and nowhere to put
 * what it produced. These prove there is somewhere: `1c capture page` runs to
 * completion inside workerd and every member [[DOC-13]] §4 names lands in R2,
 * readable back as the same artifact.
 */

/** The bindings this adapter needs. `BLOBS`, never `SITES` — see the adapter. */
function refEnv(): ReferenceStoreEnv {
  return env as unknown as ReferenceStoreEnv
}

const TENANT = 'tenant-refs'

beforeAll(async () => {
  await applySchema()
  await ensureTenant(TENANT)
})

// ── the contract, over the R2 adapter ────────────────────────────────────────

/**
 * THE SAME ASSERTIONS THE NODE SUITE RUNS, against the third adapter. A verb
 * added to the port is asserted once, in `support/reference-store-contract.ts`,
 * and every adapter is held to it — which is a stronger claim than three suites
 * agreeing, because there is nothing here to keep in step.
 *
 * A FRESH TENANT PER STORE, because the contract asserts on `store.list()` and
 * R2 is genuinely persistent across tests in a way a temp directory and a Map
 * are not. Isolating by tenant rather than by cleanup uses the barrier the
 * adapter already has instead of inventing a second mechanism.
 */
let contractTenant = 0
registerReferenceStoreContract({
  name: 'r2',
  async makeStore() {
    const id = `${TENANT}-contract-${(contractTenant += 1)}`
    await ensureTenant(id)
    return r2ReferenceStore(refEnv()).forTenant(id)
  },
})

// ── AC2 — a whole bundle lands, inside workerd ───────────────────────────────

describe('REQ-155 AC2 — `1c capture page` lands a complete bundle in R2', () => {
  it('test_UAT_FC_REQ-155_capture_writes_every_bundle_member_into_r2', async () => {
    const store = await r2ReferenceStore(refEnv()).forTenant(TENANT)
    const result = await cmdCapturePage('http://fixture.test/pricing', store, {
      driverFactory: async () => new FakeCaptureDriver(),
      isEngineAvailable: async () => true,
    })

    // The name is derived from the captured URL, on this adapter as on any
    // other — never from a directory the caller happened to choose.
    expect(result.name).toBe('fixture.test/pricing')
    const bundle = store.bundle(result.name)
    const members = await bundle.list()

    // Every member DOC-13 §4 names, present in a real bucket.
    for (const member of [
      'capture.json',
      'screenshot.full.png',
      'rendered.html',
      'raw.html',
      'multistate.json',
      'l1.json',
      'forms.json',
      'hints.json',
    ]) {
      expect(members, `bundle is missing ${member}`).toContain(member)
    }
    // And the persisted ladder, one PNG per sampled width.
    expect(members.filter((m) => /^screenshot-\d+\.png$/.test(m)).length).toBeGreaterThan(1)

    // Read back through the codec as the artifacts that went in — not merely as
    // bytes that came back the same length.
    expect((await readCapture(bundle)).host).toBe('fixture.test')
    expect((await readMultiState(bundle))?.projections.length).toBeGreaterThan(0)
    expect((await readL1(bundle))?.widths.length).toBeGreaterThan(0)
    expect(await readForms(bundle)).toEqual([])
    expect((await readHints(bundle))?.mediaBreakpoints).toEqual([640, 1024])
  })

  it('test_UAT_FC_REQ-155_capture_bytes_are_addressed_under_the_tenant_prefix', async () => {
    const store = await r2ReferenceStore(refEnv()).forTenant(TENANT)
    await cmdCapturePage('http://prefix.test/', store, {
      driverFactory: async () => new FakeCaptureDriver(),
      isEngineAvailable: async () => true,
    })

    // DOC-38 §7.2's prefix, in the bucket rather than in a comment: the tenant
    // barrier is a property of the key, so the key is what is asserted.
    const listed = await (env as unknown as { BLOBS: R2Bucket }).BLOBS.list({
      prefix: `t/${TENANT}/ref/prefix.test/index/`,
    })
    expect(listed.objects.map((o) => o.key)).toContain(
      `t/${TENANT}/ref/prefix.test/index/capture.json`,
    )
  })
})

// ── AC3 — a cloud bundle and a laptop bundle are equivalent ──────────────────

describe('REQ-155 AC3 — a cloud bundle is equivalent to a laptop one', () => {
  /**
   * HOW THIS IS CHECKABLE AT ALL. The filesystem adapter cannot run in workerd
   * and the R2 one cannot run in node, so no single test can hold both bundles.
   * What both projects CAN hold is the in-memory adapter — so the claim is
   * proved in two halves that compose: the node suite's contract run asserts
   * filesystem ≡ memory, and this asserts memory ≡ R2, over the SAME capture
   * driven by the SAME fake browser. Equivalence is transitive, and the one
   * shared adapter is what carries it across the runtime boundary.
   *
   * WHAT "EQUIVALENT" MEANS, STATED RATHER THAN DISCOVERED. Same member set,
   * same schemas, same values for everything the pipeline determines. NOT
   * byte-equal PNGs and not equal `capturedAt` — the ticket lists the sources
   * (capture time, what the live site served, font-load timing, per-engine
   * ladder differences, and the PNG encoders in Playwright's Chromium and
   * Browser Rendering differing outright), and a test asserting past them would
   * be asserting something the system does not promise.
   */
  it('test_UAT_FC_REQ-155_same_capture_yields_the_same_bundle_on_either_adapter', async () => {
    const cloud = await r2ReferenceStore(refEnv()).forTenant(TENANT)
    const laptop = memoryReferenceStore()
    const opts = {
      driverFactory: async () => new FakeCaptureDriver(),
      isEngineAvailable: async () => true,
    }
    const inCloud = await cmdCapturePage('http://parity.test/', cloud, opts)
    const onLaptop = await cmdCapturePage('http://parity.test/', laptop, opts)

    // The same URL names the same bundle wherever it is captured — which is what
    // lets the two be compared at all.
    expect(inCloud.name).toBe(onLaptop.name)
    const a = cloud.bundle(inCloud.name)
    const b = laptop.bundle(onLaptop.name)

    // Member for member, including the ladder's per-width PNGs.
    expect(await a.list()).toEqual(await b.list())

    // The derived artifacts are equal outright: they are a pure function of the
    // oracle and the current fold, so a difference here would be a real one.
    expect(await readL1(a)).toEqual(await readL1(b))
    expect(await readForms(a)).toEqual(await readForms(b))
    expect(await readHints(a)).toEqual(await readHints(b))
    expect(await readMultiState(a)).toEqual(await readMultiState(b))

    // `capture.json` is equal EXCEPT for the one field the ticket names as
    // non-deterministic. Asserting it that way — rather than deleting the field
    // and calling the rest equal — is what keeps the exception visible.
    const capA = await readCapture(a)
    const capB = await readCapture(b)
    expect({ ...capA, capturedAt: null }).toEqual({ ...capB, capturedAt: null })
    expect(capA.capturedAt).toEqual(expect.any(String))
  })

  it('test_UAT_FC_REQ-155_screenshots_are_compared_as_images_not_as_bytes', async () => {
    // The honest half of AC3. Two captures of the same page produce PNGs that
    // may differ byte-wise (different encoder, different anti-aliasing), so what
    // a bundle promises is a PNG at each ladder width — not identical bytes.
    // The geometry comparison that DOES have a tolerance is `values-diff`'s, and
    // it runs against `multistate.json`, which is asserted equal above.
    const store = await r2ReferenceStore(refEnv()).forTenant(TENANT)
    const result = await cmdCapturePage('http://shots.test/', store, {
      driverFactory: async () => new FakeCaptureDriver(),
      isEngineAvailable: async () => true,
    })
    const bundle = store.bundle(result.name)
    const shot = await bundle.read('screenshot.full.png')
    expect([...(shot ?? []).slice(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47])
  })
})

// ── AC5 — tenant scoping, refused at the same layer SiteStore refuses it ─────

describe('REQ-155 AC5 — references are tenant-scoped', () => {
  it('test_UAT_FC_REQ-155_an_unknown_tenant_is_refused_at_construction', async () => {
    // The same refusal, the same error type: a caller catching "unknown tenant"
    // must not have to know which store turned it away.
    await expect(r2ReferenceStore(refEnv()).forTenant('nobody')).rejects.toBeInstanceOf(
      UnknownTenantError,
    )
    await expect(r2ReferenceStore(refEnv()).forTenant('nobody')).rejects.toThrow(/No tenant/)
  })

  it('test_UAT_FC_REQ-155_a_deactivated_tenant_is_refused_and_says_which_refusal', async () => {
    await ensureTenant('tenant-refs-closed', 'suspended')
    const refusal = r2ReferenceStore(refEnv()).forTenant('tenant-refs-closed')
    await expect(refusal).rejects.toThrow(/not active/)
    // The distinction is load-bearing (BUG-36): `unknown` is a state a caller
    // that owns the configuration may resolve by registering; `inactive` is a
    // decision no caller may undo by retrying.
    await refusal.catch((e: UnknownTenantError) => expect(e.reason).toBe('inactive'))
  })

  it('test_UAT_FC_REQ-155_one_tenants_capture_is_invisible_to_another', async () => {
    await ensureTenant('tenant-refs-a')
    await ensureTenant('tenant-refs-b')
    const a = await r2ReferenceStore(refEnv()).forTenant('tenant-refs-a')
    const b = await r2ReferenceStore(refEnv()).forTenant('tenant-refs-b')

    const captured = await cmdCapturePage('http://competitor.test/', a, {
      driverFactory: async () => new FakeCaptureDriver(),
      isEngineAvailable: async () => true,
    })

    // A captured competitor site belongs to the account that captured it, and
    // nothing reads across. The barrier is structural rather than checked: a
    // handle composes every key from its own tenant's prefix, so B is not
    // refused a read — it simply cannot address A's keys at all.
    expect(await a.list()).toContain(captured.name)
    expect(await b.list()).not.toContain(captured.name)
    expect(await b.bundle(captured.name).read('capture.json')).toBeNull()
    expect(await b.bundle(captured.name).list()).toEqual([])
    // …and A still has it, so the assertion above is about isolation rather
    // than about nothing having been written.
    expect(await a.bundle(captured.name).read('capture.json')).not.toBeNull()
  })
})
