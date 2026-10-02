---
uid: bug-60f2c4f8
id: BUG-172
type: bug
title: 'capture_site: entry page refused for exceeding the 32 MiB budget before any
  page has been captured'
created_by: xgd
created_at: '2026-10-02T00:11:17.651238+00:00'
updated_at: '2026-10-02T01:19:01.870315+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-d6e18197
  commits:
  - working_sha: 8ec81c1b8aa16894e593f2338ee084b638633702
    reconcile_sha: null
    main_sha: null
  - working_sha: 3483e1a32c4bb90523ae602e49de602af837ead0
    reconcile_sha: null
    main_sha: null
  version: 0.2.432
  story_points: 2
---

## What I was doing

First call to `capture_site` in a fresh session, against a public `https://` origin (a small single-page marketing site). No prior capture had been made in this session — `list_references` returned an empty list immediately before the call.

## What I expected

A capture to be created, or — if the target genuinely exceeds the byte budget — a refusal that reflects work actually done, i.e. after the entry document had been fetched and some subresources had been mirrored.

## What happened

```
REFUSED: the page itself was refused, so there is no capture to adopt —
https://<target>/: the capture had already delivered more than 33554432 bytes
when this page was requested, so it was refused; the capture is incomplete.
(1 subresource refusals besides)
```

No reference was created. The exact address is in the refusal record the capture subsystem keeps.

## Why this looks wrong rather than just unlucky

The message asserts that **more than 33,554,432 bytes had already been delivered at the moment the entry page was requested**. At that point the capture had requested nothing else: this was its first page, in a store with zero existing references. So either

1. the byte accounting is not reset per capture run (a counter carried over from a previous run, another tenant's run, or a process-lifetime accumulator), or
2. the entry page is being charged the cost of its own subresources *before* it is fetched — note the trailing "(1 subresource refusals besides)", which implies subresource fetching was attempted and also refused, so ordering/accounting between document and subresources may be inverted, or
3. the budget is being compared against the wrong quantity entirely (e.g. an uncompressed or content-length-declared size rather than bytes delivered).

In all three cases the user-visible outcome is the same and is the real defect: **an origin that cannot be captured at all, with a message that attributes the failure to work the capture had not yet done.** There is no way to proceed from here — no partial reference is adopted, so there is nothing to inspect to find out which asset was large.

## Reproduction

1. Fresh session, `list_references` → `{ "references": [] }`.
2. `capture_site` with the target address → refusal above.
3. Retry with the `www.` host variant → identical refusal, and the message reports the apex host, so the normalisation happened but the outcome did not change.

## What would make this actionable from my side

- The refusal naming **which resource** blew the budget and **how many bytes had been counted**, rather than only that the limit was passed. Right now I cannot tell a genuinely 32 MiB page from an accounting fault, and I have to tell the user "I can't capture your site" with no explanation.
- Adopting the **partial capture** rather than discarding it. The tool's own contract says a refusal is recorded and the capture is "incomplete" — but nothing is adopted, so "incomplete" is indistinguishable from "absent". An entry document plus whatever was mirrored before the cap would still be far more useful than nothing, and `describe_reference` already exists to report that a capture is incomplete.
- A way to capture **without subresource mirroring**, for exactly this case: a page whose imagery is too heavy to mirror but whose structure, colour and type I still want to read.

## Severity

High for the workflow it blocks. Capture is the entry point to reproducing an existing site, and a site that refuses to capture cannot be reproduced at all — there is no degraded path and no retry that changes the outcome.

## Control result — the capture engine itself is working

Immediately after the second refusal, in the same session, I captured `https://example.com/` as a control:

```
bundle: example.com/index
pages: 12
assets: 1
reference: adopted=true, created=true
refusals: []
```

This rules out hypothesis (1) from the original report. **The byte counter is not stuck globally or across runs** — if it were, this capture would have been refused too, since it ran after the one that reported the budget already exceeded. So the fault is specific to the target origin, and the accounting is per-run as intended.

That narrows it to hypotheses (2) and (3), plus a fourth that the control also raises:

4. The target may genuinely deliver >32 MiB, in which case the defect is **not** the refusal but the *reporting* of it. The message attributes the overrun to bytes already delivered "when this page was requested", which for an entry document is a confusing way to describe its own payload, and it names no resource and no byte count. From the caller's side a genuinely enormous page and an accounting fault are indistinguishable, and both end the workflow dead.

Also worth a separate look: the control reports `pages: 12` for `example.com`, which serves a single document with one link out to IANA. Twelve pages from that origin is surprising and may indicate the crawler is counting something other than distinct captured pages, or is following off-origin links. Not the subject of this report, but it suggests the page-accounting and the byte-accounting are worth auditing together.

## Revised ask, in priority order

1. Name the resource and the running byte total in the refusal. Without that neither I nor the user can tell which of the four cases they are in.
2. Adopt the partial capture so `describe_reference` can report what was reached before the cap.
3. Offer a document-only capture mode that skips subresource mirroring, which would make a legitimately image-heavy origin capturable for structure, colour and type.


## Investigation (2026-10-01) — root cause and proposed direction

**Root cause.** `MAX_RESPONSE_BYTES = 32 MiB` (`tools/generate/src/cli/capture/egress-guard.ts`) is a *whole-capture* budget that latches. `cf-driver.ts` calls `guard.record(body.byteLength)` for every response, and one guard is shared by every pass of one `capture_site` call (`fidelity-core.ts`): each width on the viewport ladder, the height probes, and up to 3 retry attempts per host spelling. The per-URL dedupe (`this.cached`) is per driver instance, so the same hero images are counted again on every pass. A modest image-heavy page crosses 32 MiB after a few widths; from then on `tripped` latches, the next pass's *document* request is refused, and BUG-127's verdict turns a document refusal into `REFUSED` for the whole capture. The "(1 subresource refusals besides)" is the guard's own `(total)` record. That matches every observation above, including the example.com control, which is tiny enough to stay under the cap at every width.

**Operator direction.** Capture is cheap and mechanical. The cost is tokens, not bytes. So the byte budget doesn't control anything and should be removed. It was never a security boundary either. The security controls are the URL classifier (SSRF, scheme allowlist) and the per-chain redirect cap, and both stay. Runaway protection is already provided by the wall-clock ceiling `MAX_CAPTURE_MS`.

**Proposed fix (not yet coded).** Delete `MAX_RESPONSE_BYTES`, `EgressGuard.record`, `tripped`, the `response-cap` refusal reason and the `guard.record` call in `cf-driver.ts`. Rewrite `test_UAT_FC_BUG_127_a_refused_document_fails_rather_than_adopting` so it no longer depends on the cap (it can trip a document refusal via the URL classifier instead). Add `test_UAT_FC_BUG-172_*`: a capture whose passes together deliver well over 32 MiB is adopted. Asks 1–3 in the original report (naming the resource, adopting partial captures, document-only mode) don't apply once the cap is gone.

**Budgets must be per business (operator, point 2).** Survey of the current "budgets":
- No *spend* limit exists anywhere. Token spend is already **metered per business** (`apps/control-app/src/spend.ts`, REQ-292/293/297, `tenant_id`), but nothing enforces a limit against it.
- The token "budgets" that do exist are technical ceilings, not cost controls. They are per request, turn or session: the context-window fraction (`budget-core.ts`, REQ-296), the turn clock (`turn-clock-core.ts`, BUG-168), the per-session image cap (`imagegen.ts` `IMAGE_BUDGET`, documented as a runaway-loop stop), room auto-turn caps (`group-core.ts`), and character caps on rendered text (`account-core.ts` `DIFFERENCE_BUDGET`, `knowledge.ts`, `session-delta.ts`).
- So a per-business token budget would be **new work**: an allowance per business enforced against the existing meter. It is not a rescoping of existing code, and it is out of scope for this bug.


## Resolution (2026-10-01) — the capture download limit is removed

**Operator decision:** capture is cheap and mechanical, so the byte budget controlled no cost and is removed outright rather than raised. Budgets in general, including per-business token budgets, are deferred to later work.

**What changed (user-visible):** `capture_site` is never refused because of how many bytes it downloaded. That holds for any total, across every pass of the viewport ladder. An image-heavy site that used to fail with "the capture had already delivered more than 33554432 bytes…" now captures and is adopted like any other. No `response-cap` refusal reason exists any more.

**What did not change:** the egress guard still enforces the address rules (SSRF: private/loopback/link-local/`.local`/`.internal` addresses, non-http(s) schemes, embedded credentials) and the per-chain redirect-loop cap. A page refused by either rule still fails the capture rather than being adopted (BUG-127).

**Code:**
- `tools/generate/src/cli/capture/egress-guard.ts`: removed `MAX_RESPONSE_BYTES`, `EgressGuard.record`, `EgressGuard.tripped`, the `maxBytes` option and the `response-cap` reason.
- `tools/generate/src/cli/capture/cf-driver.ts`: no longer reports response sizes to the guard.

**Test plan:**
- `tests/test_UAT_FC_BUG-172_capture_has_no_download_limit.test.ts`: the real Browser Rendering driver and the real guard, with one guard shared across every ladder width. A page with three 12 MiB photographs (36 MiB a pass, ~216 MiB total) is allowed and fully mirrored on every pass, with no refusals and no 403s. Verified to fail against the previous guard.
- `tests/support/fake-puppeteer.ts` gains a `network` option so the boundary double can serve network responses and emit puppeteer `response` events. A technical consequence: the navigation request is labelled `document`, as a browser labels it.
- `test_UAT_FC_BUG_127_a_refused_document_fails_rather_than_adopting` now refuses the page with the redirect cap instead of the byte cap.
- `test_UAT_FC_REQ_157_the_guard_caps_redirects_and_size_and_records_both` was renamed `…_caps_redirects_and_records_them`, and its size half was removed.
- Regression scope: BUG-127, REQ-157, BUG-172, and both REQ-154 suites, all passing.