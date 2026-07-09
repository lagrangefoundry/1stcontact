---
uid: request-f3342338
id: REQ-33
type: request
title: Fresh diff-driven re-import of gigabytealchemy.ai (re-capture + values-diff
  to zero deltas)
created_by: xgd
created_at: '2026-07-03T16:07:34.937608+00:00'
updated_at: '2026-07-09T23:59:12.253473+00:00'
completed_at: '2026-07-09T23:59:12.253473+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
  commits:
  - ddfcba9e8cc8b3d50fe499666a2b30439fb677c0
  - 04d9e56cfe28230f02e1c1d9e7c7797f3fb99204
  - 1f3e38ab48c62c8a5cdffb8a187af96d580f619d
  - 360a9361204b103ff0c577117256a5c9a85752ce
  - 72b3e12a36f57c02e850f2be5d89af4066dd27bb
  version: 0.0.31
  bundled_in: bundle-adc60ee8
---

## Goal

Re-import gigabytealchemy.ai **from scratch**, driven by the mechanical values-diff loop ([[REQ-31]]) and the runbook [[DOC-19]], targeting **zero deltas** before eyes. The previous hand-built reproduction has been moved to the gitignored sandbox tree (`storage/sandbox/gigabytealchemy`) so `sites/gigabytealchemy` is clean for a fresh build. Closes the remaining gap on the [[REQ-20]] milestone.

## Why now

The on-disk capture bundle (`storage/references/gigabytealchemy.ai/index/`, captured 2026-07-02 09:32) **predates REQ-31**, so it never recorded gradient direction, per-element sizes/left-bars, the hero scrim, or the content anchor. The first job is to **re-capture** so the diff has a complete reference. REQ-31 (+ casing and section-level scrim/anchor extensions) and REQ-32 primitives have all landed since the last attempt.

## Known deltas the fresh loop must resolve

Observed on the current (sandboxed) draft vs the original front page — each should now be **mechanically flagged** by `1c values-diff` once the reference is re-captured:

1. Title (wordmark) text smaller than original and positioned higher → `fontSizePx` + `contentAnchor`.
2. Title colour **gradient** not reproduced → `gradient` (angle + stops).
3. Subtitle "Intentional Software" too large and mis-placed → `fontSizePx` (fine sibling-relative position is not manifest-encoded — eyes to confirm).
4. Paragraph below: font a little small and rendered **white**, original is **gold** → `fontSizePx` + `color`.

## Procedure (per [[DOC-19]])

1. `1c capture page https://gigabytealchemy.ai/` — re-capture (writes a REQ-31-complete bundle under `storage/references/`).
2. `1c new gigabytealchemy` — fresh site in the tracked `sites/` tree.
3. Structure → values → treatment passes, transcribing from `raw.html`/`capture.json` (not the screenshot). Verbatim text incl. casing.
4. `1c render gigabytealchemy --source draft` → `1c values-diff gigabytealchemy --ref storage/references/gigabytealchemy.ai/index` — fix every delta and re-run until it exits clean.
5. `1c shot` + eyes for what the manifest can't encode (composition, does the gradient read intentional).

## Acceptance criteria

- A re-captured, REQ-31-complete reference bundle exists for gigabytealchemy.ai.
- `1c values-diff gigabytealchemy --ref <bundle>` exits **clean (zero deltas)** on the fresh draft.
- The four known deltas above are each resolved (verified in the diff output, then by eye).
- No new framework module was created without first exhausting generalization (CLAUDE.md rule); any framework-code change follows the free-coding process. Most of the work should be site-def/config.

## Notes

- Site-def / config / theme edits are exempt from the free-coding ceremony; only framework *code* changes need scope-ticket + UAT + `[FREE-CODED]` + version bump.
- If the diff surfaces a genuinely new capability gap, generalize an existing module before adding one, and file it against [[REQ-32]].