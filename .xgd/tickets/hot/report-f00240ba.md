---
uid: report-f00240ba
id: REPORT-1712
type: report
title: 'Overlap resolution: cluster 3'
created_by: xgd
created_at: '2026-08-09T01:14:31.896044+00:00'
updated_at: '2026-08-09T01:14:31.896044+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-69e94af9
  cluster_id: '3'
---

## Cluster 3 Resolution

**Boundary**: Cross-cutting 1c CLI correctness filed inside one domain capability
**Stories resolved**: 3
**Action taken**: confirm (all three) — no story reassignment; CAP-63's scope amended to declare the ownership rule

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-e15a19ef (STORY-79) | confirm | capability-aa030c83 (CAP-63) | (no change) | The deliverable is the CLI *mechanism*, not any verb's behaviour: argv parsing, stream discipline, bootstrap quiet, store-flag propagation into a triggered render/serve, and the install preflight. All five are implemented once at dispatch, ahead of the command switch, and CAP-63 is the only cluster capability whose declared scope names the CLI surface at all. No better home exists: CAP-66, the predecessor CLI capability, was retired into CAP-63 by the 2026-08-05 rebalance for being below the UAT threshold, and CAP-71/CAP-89/CAP-82 are each strictly narrower than the verb set the story covers. |
| story-5e7eb0c5 (STORY-97) | confirm | capability-b4ac88fc (CAP-89) | (no change) | Owns the *meaning* of `1c colors`, which CAP-89's scope names verbatim ("site colour census & palette retrofit"). Its nine ACs are census content, palette derivation, lossless-or-refuse and re-runnability. AC-940's `--json` clause is a payload contract — what the census document carries and that its numbers agree with the human form — not the stream-hygiene guarantee STORY-79 owns. |
| story-c46abfa6 (STORY-102) | confirm | capability-b4ac88fc (CAP-89) | (no change) | Owns the *meaning* of the asset listing, named verbatim in CAP-89's scope ("the site asset store"). Its six ACs are registry/directory union, provenance, handle vocabulary and usage kind. AC-1022 ("answers from the command line") asserts the surface is reachable without an editing gesture — a claim about the store, not about argv parsing. |

### Why this overlap is acceptable

The survey's reading is factually right — STORY-79's ACs do name verbs that CAP-71,
CAP-89 and CAP-82 own — but the inference that a defect therefore has no
unambiguous home does not follow. The boundary is **mechanism versus meaning**, and
it falls cleanly:

| Concern | Implemented | Owner |
|---|---|---|
| Boolean flag parsing, `--json` stdout hygiene, bootstrap quiet | Once, in the CLI dispatcher / launcher config | CAP-63 / STORY-79 |
| Store-flag propagation into a sub-command's render+serve | Once, at the `aligned-crops` call site | CAP-63 / STORY-79 |
| Install preflight (`COMMAND_DEPS`) | Once, at dispatch, ahead of the command switch | CAP-63 / STORY-79 |
| What `l1-gate` decides | The 3-probe gate | CAP-71 |
| What `1c colors --json` carries | The census document | CAP-89 |
| What a deploy reports and refuses | The deploy verb | CAP-82 |

Three things make this the right cut rather than a convenient one:

1. **The evidence is only meaningful verb-set-wide.** AC-1017 pins the gated set
   *as a whole* precisely so that adding a browser-driving verb without gating it
   is a visible regression. AC-738 asserts quiet boot across every command,
   including the ones that never render. Splitting these across four capabilities
   would yield four partial copies of one guarantee and destroy the property that
   makes them load-bearing.

2. **The mechanism does not actually reach the other two stories in this cluster.**
   Verified against `tools/generate/src/cli/preflight.ts`: `COMMAND_DEPS` gates
   only `capture`, `shot`, `values-diff`, `adopt-gaps`, `crop`, `diff`, `gate` and
   `aligned-crops`. `colors` and the `asset` verbs are absent from the map, so the
   preflight never fires on them; both are file-only and never construct the Astro
   container whose diagnostics motivated the stdout-hygiene work. The two CAP-89
   stories are not contested territory — they share a flag spelling, not a fault.

3. **The asymmetry is a naming artifact, not a misfiling.** The survey identified
   the cause correctly: CAP-66 (`1c CLI Argument Parsing & Output Hygiene`) was
   merged into CAP-63 on 2026-08-05, so a CLI-wide story now sits inside a
   capability whose *title* reads as a single domain while its *scope* has named
   the CLI surface since the merge. Reassigning STORY-79 to any of CAP-71, CAP-89
   or CAP-82 would move it from a capability that covers most of its subject to
   one that covers a fraction. Reviving CAP-66 would undo a deliberate rebalance
   and reinstate a sub-threshold capability.

### Ticket change made

One amendment, to **capability-aa030c83 (CAP-63)** — additive, no content removed:

- The `CLI argument parsing and output hygiene` scope bullet understated what
  STORY-79 now covers: it named only guarantees 1–2 (flag parsing, stdout hygiene)
  and was silent on store-flag propagation, the conditional Astro container, and
  the install preflight. It is rewritten as **"The `1c` CLI as a process —
  verb-agnostic correctness"**, naming all five.
- A new **Ownership rule** section states the mechanism/meaning boundary and its
  justification explicitly, and the Out-of-scope section now disclaims individual
  verb payload semantics.
- The History section records this cluster's resolution and why the asymmetry is a
  merge artifact.

Without that amendment the confirm would leave the matrix byte-identical to the
state the survey flagged, and the next survey would re-raise the same cluster. With
it, the boundary is declared where reconcile reads it rather than only in this
report.

### Verification

- Each of the three stories carries exactly one `capability_uid`, unchanged:
  STORY-79 → capability-aa030c83; STORY-97 and STORY-102 → capability-b4ac88fc.
- No story was reassigned, merged or archived, so no AC moved: AC counts are
  12 / 9 / 6, unchanged. No test renaming is required, since no AC changed story.
- No story body was modified.
