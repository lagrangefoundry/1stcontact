---
uid: report-c8fd0348
id: REPORT-6819
type: report
title: 'Report: aligned_to_tip for story-31204812'
created_by: xgd
created_at: '2026-10-28T03:54:01.981072+00:00'
updated_at: '2026-10-28T03:54:01.981072+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: aligned_to_tip
  subject_uid: story-31204812
  anchor_ticket: bundle-5607a08d
  rule: code_frozen
  batch_index: 0
  acs:
  - acceptance_criterion-2b82c3cf
  - acceptance_criterion-d553d8fb
  - acceptance_criterion-7db0225c
  - acceptance_criterion-b4af8127
  - acceptance_criterion-e4c4d77e
  - acceptance_criterion-26d0ac51
  ruling_reason: REQ-157 owns these ACs and is the only in-window intent on this surface,
    so no later in-window intent orders the conflict in the ACs' favour; xgd-working's
    tip decides. Neither the window code nor the tip implements the builder's proposed
    fixes (tolerant readCapture, Node redirect-hop guard, applied 60 s cap, refusal
    of a cap-tripped capture), and out-of-window BUG-172/BUG-127 move further from
    the ACs, so a code_frozen grant would invent behaviour rather than port it. The
    ACs are rewritten to the code as landed; clauses where the tip later diverges
    are retired rather than asserted either way.
  tip_ref: reconcile-src-BUNDLE-32
  tip_evidence:
  - file: tools/generate/src/cli/capture/bundle.ts
    lines: 95-99
    snippet: |-
      /** Read a bundle's `capture.json` back into a {@link Capture}. */
      export async function readCapture(bundle: ReferenceBundle): Promise<Capture> {
        const capture = await readJson<Capture>(bundle, CAPTURE_MEMBER)
        if (!capture) throw new Error(`Bundle '${bundle.name}' has no ${CAPTURE_MEMBER}.`)
        return capture
  - file: tools/generate/src/cli/ai/fidelity-core.ts
    lines: 245-253
    snippet: |2-
          `${picture.label} — ${reduced.width}×${reduced.height}` +
          (reduced === raster ? '' : ` (reduced from ${raster.width}×${raster.height})`) +
          // REQ-216 — the channel's caption, on the same block that already says what
          // was looked at. Appended rather than given a block of its own because the
          // two are one sentence about one picture, and a transcript that has had the
          // image redacted out of it still carries both.
          (picture.note ? `. ${picture.note}` : '')
        return {
          blocks: [
  - file: tools/generate/src/cli/ai/fidelity-core.ts
    lines: 309-357
    snippet: |2-
              source: { type: 'base64', media_type: mediaType, data: bytesToBase64(bytes) },
            },
          )
        }
        if (plan.after) blocks.push({ type: 'text', text: plan.after })
        return blocks
      }

      // ── the operations ───────────────────────────────────────────────────────────

      /** Validated arguments, as the Toolbox hands them over. See `toolbox-core.ts`. */
      type Params = Record<string, unknown>

      /** One operation implementation, keyed by the `op` the declaration names. */
      export type FidelityOperations = Record<string, (params: Params) => unknown>

      /** What the surface needs from its host — the runtime, named at the edge. */
      export interface FidelityDeps extends PictureDeps {
        /**
         * A driver factory built around a fresh {@link EgressGuard}, for the one verb
         * that fetches a URL a model chose.
         *
         * SEPARATE FROM `driverFactory` DELIBERATELY. The guard is stateful and its
         * budgets belong to one capture; a single guarded factory shared across a
         * session would let one capture's traffic refuse the next one's. The host
         * builds a new one per call and hands its refusals back.
         */
        guardedDriver(guard: ReturnType<typeof egressGuard>): BrowserDriverFactory

        /**
         * Make a completed bundle findable — [[REQ-166]].
         *
         * OPTIONAL, AND ITS ABSENCE IS AN ORDINARY DEPLOYMENT rather than a
         * misconfiguration. Writing a `reference` ticket needs a ticket store, which
         * is the Worker's D1; the `1c` CLI has none, and [[REQ-155]] deliberately
         * removed `node:fs` from the capture module's import graph rather than let
         * storage decisions leak into it. So the host that HAS a store supplies this
         * and the host that does not omits it — the same conditional-composition rule
         * this whole surface is registered under.
         *
         * The bundle is named rather than passed: the store the capture just wrote
         * into is `deps.references`, and handing a second handle to the same bundle
         * would be two ways to name one thing.
         */
        adoptCapture?(bundle: string): Promise<{ uid: string; created: boolean }>

        /**
         * [[REQ-363]] — how `screenshot` tiles a page. Absent in every deployment,
         * which reads `picture-tiles.json`; present only where a caller wants other
  - file: tools/generate/src/cli/capture/egress-guard.ts
    lines: 228-275
    snippet: |-
      function isPrivateIpv6(host: string): boolean {
        const bare = host.replace(/^\[|\]$/g, '').toLowerCase()
        if (bare === '::1' || bare === '::') return true
        if (bare.startsWith('fe80:')) return true // link-local
        if (/^f[cd][0-9a-f]{2}:/.test(bare)) return true // unique-local fc00::/7
        const mapped = /^::ffff:(.+)$/.exec(bare)
        if (mapped) {
          const octets = ipv4Octets(mapped[1])
          if (octets) return isPrivateIpv4(octets)
          // `::ffff:a9fe:a9fe` — the same address written as hex groups.
          const hex = /^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(mapped[1])
          if (hex) {
            const high = parseInt(hex[1], 16)
            const low = parseInt(hex[2], 16)
            return isPrivateIpv4([high >> 8, high & 0xff, low >> 8, low & 0xff])
          }
        }
        return false
      }

      /** Whether `host` names private, loopback or link-local space. */
      export function isPrivateHost(host: string): boolean {
        const lower = host.toLowerCase()
        if (lower === 'localhost') return true
        if (LOCAL_SUFFIXES.some((suffix) => lower.endsWith(suffix))) return true
        if (lower.includes(':') || lower.startsWith('[')) return isPrivateIpv6(lower)
        const octets = ipv4Octets(lower)
        if (octets) return isPrivateIpv4(octets)
        return false
      }

      /**
       * Classify one URL. Returns null when it may be fetched, or the refusal.
       *
       * Pure and total, so the same rule can be applied to the typed URL up front and
       * to every request the page makes afterwards without either caller re-deriving
       * it.
       */
      export function classifyUrl(raw: string): UrlRefusal | null {
        let url: URL
        try {
          url = new URL(raw)
        } catch {
          return { url: raw, reason: 'scheme', detail: `'${raw}' is not a URL.` }
        }
        if (!ALLOWED_SCHEMES.has(url.protocol)) {
          return {
            url: raw,
  - file: tools/generate/src/cli/capture/playwright-driver.ts
    lines: 101-110
    snippet: |2-
          this.page.on('requestfailed', (req) => this.diag.failedRequests.push(req.url()))
          // Every request, before it resolves — the full egress surface (REQ-40). A
          // failed cross-origin request never becomes a response, so egress cannot be
          // derived from `responses()`; it must be observed at request time.
          this.page.on('request', (req) => this.diag.requestedUrls.push(req.url()))

          // REQ-157 — the same per-request rule the Browser Rendering driver applies,
          // for the same reason: this is the only point that sees a redirect hop and a
          // subresource, and `capture_site` takes its URL from a model. A route is
          // installed only when a guard was supplied, so `1c capture` against a URL an
  - file: tools/generate/src/cli/capture/cf-driver.ts
    lines: 231-232
    snippet: |2-
          await page.goto(url, { waitUntil: 'load', timeout })
          await page.waitForNetworkIdle(QUIET).catch(() => undefined)
  - file: tools/generate/src/cli/capture/cf-driver.ts
    lines: 280-280
    snippet: '    const main = this.page?.mainFrame?.()'
  intent_ticket: REQ-157
  intent_sentence: '`capture_site` is refused for private address space, over-large
    responses and redirect loops;'
  tests:
  - test_UAT_AC2045_list_references_reports_recorded_url_and_capture_time
  - test_UAT_AC2046_describe_reference_reports_widths_images_findings_and_refuses_unknown
  - test_UAT_AC2047_capture_site_preflight_refuses_unsafe_addresses_without_leasing
  - test_UAT_AC2048_every_request_is_guarded_refused_ones_never_sent_and_reported
  - test_UAT_AC2049_redirect_cap_counts_hops_not_subresource_origins
  - test_UAT_AC2050_byte_and_time_budgets_abandon_the_capture_in_both_hosts
---

## Aligned to running code (REQ-895)

REQ-157 owns these ACs and is the only in-window intent on this surface, so no later in-window intent orders the conflict in the ACs' favour; xgd-working's tip decides. Neither the window code nor the tip implements the builder's proposed fixes (tolerant readCapture, Node redirect-hop guard, applied 60 s cap, refusal of a cap-tripped capture), and out-of-window BUG-172/BUG-127 move further from the ACs, so a code_frozen grant would invent behaviour rather than port it. The ACs are rewritten to the code as landed; clauses where the tip later diverges are retired rather than asserted either way.

- **ACs retired or rewritten**: acceptance_criterion-2b82c3cf, acceptance_criterion-d553d8fb, acceptance_criterion-7db0225c, acceptance_criterion-b4af8127, acceptance_criterion-e4c4d77e, acceptance_criterion-26d0ac51
- **Failing tests covered**: test_UAT_AC2045_list_references_reports_recorded_url_and_capture_time, test_UAT_AC2046_describe_reference_reports_widths_images_findings_and_refuses_unknown, test_UAT_AC2047_capture_site_preflight_refuses_unsafe_addresses_without_leasing, test_UAT_AC2048_every_request_is_guarded_refused_ones_never_sent_and_reported, test_UAT_AC2049_redirect_cap_counts_hops_not_subresource_origins, test_UAT_AC2050_byte_and_time_budgets_abandon_the_capture_in_both_hosts
- **Tip evidence** (read at `reconcile-src-BUNDLE-32`):
  - `tools/generate/src/cli/capture/bundle.ts` lines 95-99
  - `tools/generate/src/cli/ai/fidelity-core.ts` lines 245-253
  - `tools/generate/src/cli/ai/fidelity-core.ts` lines 309-357
  - `tools/generate/src/cli/capture/egress-guard.ts` lines 228-275
  - `tools/generate/src/cli/capture/playwright-driver.ts` lines 101-110
  - `tools/generate/src/cli/capture/cf-driver.ts` lines 231-232
  - `tools/generate/src/cli/capture/cf-driver.ts` lines 280-280
- **Intent** `REQ-157`: "`capture_site` is refused for private address space, over-large responses and redirect loops;"
