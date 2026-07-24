---
uid: report-07aa6dd1
id: REPORT-907
type: report
title: 'Capability-Intent Alignment: 1c CLI Argument Parsing & Output Hygiene (level=story)'
created_by: xgd
created_at: '2026-07-24T07:51:13.712444+00:00'
updated_at: '2026-07-24T07:51:13.712444+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-ac7ca849
  level: story
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c CLI Argument Parsing & Output Hygiene
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability (both bundles;
both `free_and_reconciled`, so both count toward cumulative intent):

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| bundle-ab9e0cb6 (BUNDLE-6, "REQ-58 pass-3") | free_and_reconciled | created 2026-07-17, merged 7a42e182 | Guarantee 1: `--multi-viewport` is a boolean flag that does not consume the following positional (slug survives in any order) — commit 4f681c73. Guarantee 2: `--json` output hygiene — render/bootstrap diagnostics routed to stderr, stdout restored after run/failure — commit a4323720. | YES (capability's `intent_uid`) |
| bundle-31e474b9 (BUNDLE-7) | free_and_reconciled | created 2026-07-22, merged edeb1c2c | Guarantee 3: store-selecting flags (`--sandbox` + source + cwd) propagate into the render/serve a sub-command drives; `aligned-crops --sandbox` renders/serves from the sandbox store — commit 09fa7cf5. | YES (STORY-79 `updated_by`) |

Cumulative intent = guarantees 1 + 2 + 3. No intent in the ledger retires or
modifies any earlier behavior; both bundles are purely additive.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-79 (story-e15a19ef, kind=upgrade, status=updated) | bundle-ab9e0cb6 (G1, G2) + bundle-31e474b9 (G3) | aligned — body's three guarantees map 1:1 onto the cumulative intent; no unsupported text, no missing intent behavior |
| CAP-66 body (capability-ac7ca849 description) | bundle-ab9e0cb6 only | stale summary — prose describes only G1+G2 and cites only bundle-ab9e0cb6; omits G3 / bundle-31e474b9 (warning #1) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | coverage | capability-ac7ca849 (CAP-66) body | (capability-summary edit — outside the story/AC/UAT taxonomy) | The capability description documents only two guarantees ("Flag parsing", "Machine-readable output hygiene") and states it "documents behavior reconciled from bundle-ab9e0cb6 (REQ-58 pass-3), plan item 5". Guarantee 3 (store-selecting flag propagation into sub-commands), added to STORY-79 by bundle-31e474b9 (free_and_reconciled, 2026-07-22), is absent from the capability prose. The behavioral matrix (STORY-79) covers G3 correctly, so there is no coverage gap in the story tree — this is documentation freshness of the capability header only. | Add a third bullet to the CAP-66 body for store-selecting-flag propagation and cite bundle-31e474b9 alongside bundle-ab9e0cb6. |

## Notes for the Editor

- **Story tree is fully aligned; the only drift is in the capability's own prose
  header.** STORY-79's body already carries all three guarantees with correct
  intent attribution in its Technical Context section (G1/G2 → bundle-ab9e0cb6
  commits 4f681c73 + a4323720; G3 → bundle-31e474b9 commit 09fa7cf5). This is why
  the finding is a warning (opportunistic capability-body refresh), not a
  violation — no story-, AC-, or UAT-level element is wrong or missing.
- **No exclusivity concern with the aligned-crops capability.** Guarantee 3 here
  is scoped to CLI flag-propagation *correctness* (does `--sandbox` reach the
  render/serve). STORY-79's out-of-scope note explicitly delegates the
  content/shape of the crop artifacts to the aligned-crops capability, so the two
  do not describe the same behavior.
- **Guarantees 1 and 3 are distinct despite both concerning flags.** G1 is
  parse-time token consumption (a boolean flag must not eat the next positional);
  G3 is post-parse forwarding of store-selection flags into triggered
  sub-commands. No internal overlap within STORY-79.

