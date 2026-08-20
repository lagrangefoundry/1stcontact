---
uid: report-daaf7c07
id: REPORT-2369
type: report
title: Fix 1c Capture & Diff Fidelity (ac) — attempt 7 (final)
created_by: xgd
created_at: '2026-08-20T04:41:06.569904+00:00'
updated_at: '2026-08-20T04:41:06.569904+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-aa030c83
  level: ac
  fixes_applied: 6
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-2485c83c
---

# Fix Summary — 1c Capture & Diff Fidelity (ac)

**Attempt**: 7 (second call of this attempt)
**Fixes applied this call**: 6
**Violations remaining**: 0
**Needs more work**: false

The first call of this attempt closed findings 1, 2, 6, 7, 8, 9, 10 (10 mutations,
REPORT-2365 / `report-c353409a`). This call closes the **three remaining violations**
(findings 3, 4, 5) and **both warnings** (12, 13). All ten violations and both
warnings in `report-6d2d7d31` are now addressed.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | ac-add | AC-1314 → STORY-75 item 9 | **Capture-time font settling (BUG-16)**, all three mechanisms as one AC because the story presents them as one closure: (a) the web-font barrier positioned *after* page settle, force-loading each visible run's exact face (family + real weight + style + the run's own text), generic-skipped and dedup'd, with every wait bounded so a 404/timeout face cannot hang the capture and is honestly reported `fontLoaded:false`; (b) the offline re-extraction path — absolute `http(s)` URLs whose basename is a mirrored asset rewritten to loopback-relative (and an unmirrored URL left alone), extensionless CSS mirror served as `text/css`; (c) the `fontLoaded` probe built from the full shorthand with the real numeric weight and style. Written explicitly as the **complement** of AC-715, not a restatement — the criterion says so in its first sentence, per the story's "the two are complements, not alternatives". **Finding 3** |
| 2 | ac-add | AC-1315 → STORY-75 item 11, second rule | **All-collapse body-spanning fallback (BUG-15)**. States its independence from AC-815's painted-extent rule in the criterion itself (that rule widens a band that exists; this one manufactures a band where the scan found none). Asserts the L1-style flat-tree case yields a non-empty actual-side manifest, uses the **byte-identical-across-two-different-renders** failure signature as the verification (a scoreboard that does not move when the render changes is measuring nothing), and asserts dormancy on a semantic multi-band page. **Finding 4** |
| 3 | ac-add | AC-1316 → STORY-75 item 12, colour-probe clause | **Modern-syntax scrim capture (BUG-24)**. Pins the colour syntaxes AC-816 left unpinned: an overlay authored as `color-mix(in oklab, …)`, `oklab()`, `oklch()` or `color()` is captured **with its alpha preserved**, not skipped; the probe prefers the colour's lossless serialization over a painted pixel read-back (premultiplied bytes lose up to a level per channel); an unreadable serialization falls through to the pixel probe so the preference only adds precision; opaque/fully-transparent fills and invalid strings record no overlay. Closes with the dependency the report identified — AC-816's translucent-fill *exclusion* only holds if the scrim is genuinely recorded as the band's overlay — and verifies that link directly. **Finding 5** |
| 4 | ac-edit | AC-1286 (`acceptance_criterion-0c4c0e8b`) | Added the `--collapse` **JSON** clause: the same collapsed defect rows emitted as a machine-readable document (element, property, folded expected/actual, width set), with a verification asserting the JSON entries match the text view's rows one-for-one. **Warning 13** |
| 5 | ac-edit | AC-1289 (`acceptance_criterion-3dfc51df`) | Added the `--clusters` **JSON** clause: ranked causes emitted as a document carrying count, severity tier, representative elements, width set and disposition — plus the precedence rule (`--clusters` wins over `--collapse` in JSON mode, grounded at `index.ts:797`). **Warning 13** |
| 6 | ac-edit | AC-656 (`acceptance_criterion-3e4b0eab`) | Took the **retain** branch the assessor offered rather than folding into AC-1290, and made the retention explicit: a leading scope note stating this is the named REQ-58 regression instance (the flag the fault was actually reported through) while AC-1290 carries the general registry-derived guarantee. Overlap is now declared rather than accidental. Criterion and Verification otherwise byte-unchanged. **Warning 12** |

STORY-75: 14 → **21** ACs across the two calls. STORY-76: 5 → **8** (one durably deprecated).
STORY-116: 5 ACs, two now carrying their JSON clause. STORY-79: AC-656 scoped.

## Grounding

Every AC this call was written against code read at HEAD, not against the report's
citations on trust:

| Claim | Verified at |
|---|---|
| Barrier runs after settle; force-loads exact face + run's own text; `bounded()` on both waits (4000ms / 2000ms) | `tools/generate/src/cli/capture/playwright-driver.ts:21-68`, re-established post-settle at `:155-159` |
| `fontLoadedOf` builds style + real numeric weight + size and passes the run's text | `capture/extract.ts:389-406` |
| Mirrored-ref rewrite is basename-scoped and leaves unmirrored URLs alone; extensionless CSS sniffed to `text/css` | `capture/reextract.ts:36-42` (`contentTypeFor`), `:50-55` (`rewriteMirroredRefs`), `:76-105` |
| All-collapse fallback: empty top-level scan → one body-spanning band | `capture/extract.ts:1382-1403`; the same bug referenced as the *other* rule at `:469-473` |
| Scrim resolved through `rgbaOf`, not a raw `rgba()` regex | `capture/extract.ts:1055-1063` |
| Lossless serialization preferred, pixel probe as fallback; invalid colour → null | `capture/extract.ts:265-290` (`parseSerializedColor`), `:294-318` (`rgbaOf`) |
| `--collapse`/`--clusters` JSON payloads and the clusters-wins precedence | `tools/generate/src/cli/index.ts:790-803` |

## Code Edits (if any)

None this call, and none across the attempt. The two stale comments in
`packages/framework/src/modules/validate.ts` (`:131` "a bare colour string
(hex/role)", `:167` "Absolute value (#hex) or a palette-role alias") that the report
flagged as out-of-scope remain untouched — still worth a free-coded cleanup, since
they are the most likely reason AC-638 survived five cycles while the executed path
was hex-only throughout.

## Follow-on (not a violation at this level)

The eleven ACs authored across this attempt carry `uat_coverage: pending`, so they are
by construction a level=uat gap for the next phase. They are TypeScript/browser-capture
behaviours (Playwright capture, `values-diff` CLI), not pytest surfaces, so authoring
their UATs belongs to the uat-level cycle with the right runner, not here. Each AC's
Verification section was written as an executable test plan — concrete fixtures,
concrete assertions — precisely so that cycle has something to implement rather than
re-derive.

## needs_review Items Forwarded

None. One recorded judgement carried over from the first call: finding 10 had a
flagged alternative resolution (retire STORY-76's authoring half from the body instead
of authoring an AC, since `resolveSurfaceGradient` has no production callers). I
followed the assessor's `ac-add` categorisation, since retiring it would overturn the
capability body's deliberate retention of the resolver — a scope judgement above this
level. Recording it so the choice is not re-litigated next cycle.
