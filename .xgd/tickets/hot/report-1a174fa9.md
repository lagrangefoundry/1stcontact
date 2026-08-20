---
uid: report-1a174fa9
id: REPORT-2376
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-08-20T05:12:19.558889+00:00'
updated_at: '2026-08-20T05:12:19.558889+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-77b28def
  plan_item_index: '8'
---

Story created and verified: 9 acceptance criteria attached, working tree clean.

```
Story #8 created for reconciliation bundle-77b28def

Story UID: story-3f4a5f2b (STORY-118)
Title: Site Storage Port: One Async Store Behind Every Edit, Provable In The Workers Runtime
Type: feature
Acceptance Criteria: 9 created

Progress: 8 of 9 plan items complete
```

**Capability**: CAP-101 (`capability-c4c7a854`) — *Site Storage Port: One Async Store Behind Every Edit*. No existing capability covered how the platform reaches storage: CAP-86 owns what a validated edit *means*, CAP-99 what a change record *says*, CAP-85 the origin's confinement, CAP-82 the deployed snapshot's store on the far side of a deploy.

**ACs** (AC-1321 … AC-1329): total/async contract including the empty answers for a slug the store holds nothing for; bytes-and-keys rather than locations; one multi-file command → one whole change; the editing surface completing with no filesystem behind it; adapter equivalence from one seed; unchanged CLI arguments/output/refusal envelopes (code + path + hint, 400 at the builder route, NOT_FOUND on a missing asset source); preview pages *and* asset bytes from whichever store rendered them; two runtimes routed by filename with real D1/R2 and production compatibility settings; and the Astro container-render path surviving the split with no assertion changed.

Three things the plan flagged, and how they were handled:

- **The retracted pin diagnosis.** `vitest.workers.config.mts:23-28` still carries the supply-chain-gate rationale that was retracted after promotion (actual cause: pnpm 11.9.0's incremental resolution dropping optional dependencies). AC-1328 is written about the routing convention, the bindings and the compatibility parity — the deliverable — and encodes neither the pin nor its stated reason. The retraction is recorded in Technical Context so a later reader does not re-derive the theory from the stale comment.
- **Journal overlap.** The counter/append/changes-since verbs are named as part of the contract and exercised in the filesystem-free and equivalence ACs, but *what a record says and what the counter means* is left to CAP-99 — stated as an explicit out-of-scope clause rather than duplicated.
- **"A stored site is a directory that holds a definition."** In the tree this is a test-side store walk (`test_UAT_FC_REQ-137_palette_shade.test.ts:80`, `test_UAT_FC_REQ-140_segment_colour.test.ts:401`), not production code — `commands.ts:75` still lists slugs by `draft/` existing. I did not make it a standalone AC; its observable, port-level half (a slug the store holds nothing for answers "no draft / no definition / no pages" rather than raising) is folded into AC-1321.

Also recorded rather than absorbed: the filesystem store is deliberately **not** atomic and no AC claims it is; the in-memory store is deliberately not a revision store; preview trades streaming for buffering; and the pre-existing failing suites (upstream `@lagrangefoundry/ai` toolbox change) are attributed away from this bundle.
