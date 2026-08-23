---
uid: request-847b979f
id: REQ-107
type: request
title: 'Authored L1 bypasses the envelope validator: validateL1 never runs outside
  the reproduction path'
created_by: xgd
created_at: '2026-07-27T23:31:36.175745+00:00'
updated_at: '2026-08-06T04:54:59.003344+00:00'
completed_at: '2026-08-06T04:54:59.003344+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 94b6842d307e311718b5f5382625c199ceddbd56
    reconcile_sha: null
    main_sha: null
  version: 0.0.220
  story_points: 2
  bundled_in: bundle-ee56a66e
  chat_comment: comment-98856643
---

## The gap

**An authored L1 document never passes the envelope validator.**

`grep -rn validateL1` over the source tree returns exactly two call sites:

- `tools/generate/src/l1/fold.ts:2148`

- `tools/generate/src/l1/probes.ts:902`

Both are on the **reproduction** path (capture → fold → probe). Nothing on the authoring or render path calls it.

So for a hand-authored page, `pageSchema`'s `l1: l1DocumentSchema.optional()` runs — that is the **shape** check (zod, `.strict()`, closed enums) — while `validateL1` — the **envelope** — does not:

check

authored page

reproduced document

shape / unknown keys / enums

✅ `l1DocumentSchema`

✅

numeric range bounds (`L1_ENVELOPE`)

❌

✅

URL scheme allowlist (`src`, `backgroundImageUrl`, `link.href`, font `src`)

❌

✅

node-count cap

❌

✅

dangling `geometry.anchor` without a `column`

❌

✅

duplicate node ids (REQ-106)

❌

✅

## Why it matters

This is backwards. The reproduction path derives its values mechanically from a capture; the **authoring** path is the one with a human or an AI free-typing numbers and URLs into a JSON file, and it is the path with no envelope.

Observed on REQ-95: every document authored for xgd.dev over seven passes bypassed the envelope entirely. When REQ-106 added the duplicate-id rule, an authored page with two `id="signup"` nodes **rendered without complaint** — the rule existed and simply never fired. It was caught by reading the emitted HTML, which is not a control.

It is not a security hole. The renderer independently re-checks `isSafeUrl` at every URL sink and degrades rather than emitting an unsafe value, which is why REQ-106's unsafe-href UAT asserts on the renderer _and_ the validator. But defence-in-depth is the argument for keeping the renderer check, not for skipping the validator: an out-of-range numeric axis, a node-count blowout, or a duplicate id has no second line of defence at all.

It also means the envelope's error messages — which exist to tell an AI author exactly what to fix, per DOC-8 §6 — are never shown to the one caller written to consume them.

## Behaviour required

`validateL1` runs on `page.l1` wherever a site definition is validated, with its errors path-prefixed into the page's error list so a failure points at `/pages/<i>/l1/root/children/…` rather than at a detached `/root/…`.

## Risk — this is expected to surface existing failures

Turning an unenforced check on will fail documents that have been out of envelope all along. **That triage is the work**, not the one-line call:

- authored sites under `storage/sites/**`

- test fixtures carrying hand-written `l1` blocks

- any reproduced document whose fold-time envelope has since drifted

Each failure is either a real defect (fix the document) or an over-tight envelope bound (fix the bound, with the reason recorded). Neither should be resolved by weakening the check to make the suite pass.

## Acceptance criteria

1. A site definition whose `page.l1` violates the envelope fails validation, with errors path-prefixed to the page.

2. An out-of-range numeric axis, an unsafe `image.src`, an over-cap node count and a duplicate node id are each rejected at authoring time.

3. The renderer keeps its independent `isSafeUrl` degradation — this ticket adds a line of defence, it does not replace one.

4. Every existing `storage/sites/**` document either passes, or has been fixed and the fix recorded.

5. Any envelope bound relaxed to accommodate a legitimate authored document is changed deliberately, with the reason in the code comment — never widened just to turn a suite green.

-