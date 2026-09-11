---
uid: report-25a1d011
id: REPORT-4103
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-11T23:46:37.164315+00:00'
updated_at: '2026-09-11T23:46:37.164315+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` (BUG-37) — class **UU**, rule **2e**
  (intent/bookkeeping ticket: a `bug-*` ticket, user-authored content, not
  matrix state). Resolved per-fact. Staged with `git add --sparse` (path is
  outside the sparse-checkout cone on this reconcile branch, DOC-986
  §2/§4.1).

  Incoming commit: `2759e5b507` "xgd(ticket): update bug bug-6612c4b7"
  (2026-08-24 14:31:48), `last_field_updated: body`.

  **This is by far the most substantive commit of the sequence so far.** The
  four earlier picks in this bundle (`fe97d3bc34`, `b0af50e157`,
  `9255f773b5`, `1975a6876b`) were title/field bookkeeping. This one is the
  body rewrite that turns the ticket from a hypothesis writeup into the
  confirmed-root-cause + fix writeup: it deletes `## Leading hypothesis`,
  `## The deps.store complication`, `## Candidate fixes`, `## Prerequisite`
  and `## Not started`, and adds `## Root cause — CONFIRMED`,
  `## What this ticket fixes in code`, `## Result`, `## Superseded — the
  original hypothesis, recorded because it was wrong`, and
  `## Still outstanding (not in this ticket)`. **The overwhelming majority
  of that rewrite merged cleanly** — HEAD's body already derives from this
  very commit — leaving only three conflict hunks.

  Three conflict hunks:

  1. **Frontmatter lifecycle scalars** (`updated_at`, `completed_at`,
     `last_field_updated`, `status`). Same fact, both sides. HEAD:
     `2026-08-31T19:19:36`, non-null `completed_at`,
     `status: free_and_reconciled`. Incoming: `2026-08-24T21:31:48`,
     `completed_at: null`, `status: draft`. **Kept HEAD** — later position,
     and taking incoming would demote a `free_and_reconciled` ticket back to
     `draft`.

  2. **Observability section — the one hunk with real content at stake.**
     Both sides make a claim about *the same fact*: whether
     `apps/control-app/wrangler.toml` declares an `[observability]` block.
     They state it in two different states of the world:
     - Incoming: `## Still outstanding (not in this ticket)` — "declares no
       `[observability]` block … Worth adding; config-only, no code."
     - HEAD: `## Observability — added here` — it *was* added, in both
       places, with `head_sampling_rate = 1`, plus a note on the TOML
       table-ordering trap it exposed, the UAT that pins it
       (`test_UAT_FC_BUG-37_the_production_route_survives_the_new_table`),
       and `wrangler deploy --env production --dry-run` verification. HEAD
       also carries a `## Deployment` section the incoming side lacks.

     These are mutually exclusive descriptions of one fact, not disjoint
     edits, so the per-fact timeline rule applies: **kept HEAD.** The work
     the incoming commit listed as outstanding was subsequently done, and
     HEAD is the later record of it. Keeping the incoming text would have
     reinstated "no `[observability]` block" into a ticket whose own body
     documents adding one and names the test that guards it.

  3. **Final line of `## Relationship to BUG-36`.** Both sides carry the
     byte-identical sentence `BUG-36 neither caused this nor fixes it.`; the
     hunk exists only because of the end-of-file newline difference. Taken
     with the trailing newline — see below.

## Incoming changes preserved

Verified against `git show 2759e5b507 -- .xgd/tickets/hot/bug-6612c4b7.md`.
Because this commit's payload is a large body rewrite, I checked its added
sections are actually present rather than relying on the absence of conflict
markers. All present in the resolved file:

- `## Root cause — CONFIRMED` (line 40), incl. "The account was on the
  Workers Free plan…" (line 42)
- `## What this ticket fixes in code` (line 58), incl. the **FIX: memoise
  the assembled (validated) definition per isolate** paragraph (line 72)
- `## Result` (line 106), incl. "~78 ms to ~5 ms" (line 108)
- `## Superseded — the original hypothesis, recorded because it was wrong`
  (line 112), incl. "Edit is the cheaper channel" (line 124)
- `## Reproduction (historical)` (line 171)
- The Symptom tense change to past tense — "Switching the builder to **Edit**
  mode on `app.1stcontact.io` returned" (line 36)

And the sections this commit *deletes* are confirmed absent: no
`## Leading hypothesis`, `## Candidate fixes`, or `## Not started` remain.

**The trailing newline — this commit's one change that HEAD did NOT already
have.** The incoming diff ends by converting
`BUG-36 neither caused this nor fixes it.\ No newline at end of file` into
the same line *with* a terminating newline. HEAD still lacks it. I kept the
incoming's newline, so unlike the four preceding picks **this resolution is
NOT a no-op**: `git diff --no-index` against the HEAD blob shows exactly one
changed line, that newline normalisation, and `git status --porcelain`
reports `M  .xgd/tickets/hot/bug-6612c4b7.md`. The staged diff is non-empty
and finalize should commit it rather than skip it.

Two facts from the incoming commit were deliberately superseded per the
per-fact timeline rule, both documented above: the lifecycle scalars (hunk 1)
and the observability status (hunk 2). Neither is a discard of unlanded
developer content — both are earlier states of facts that HEAD records in
their later, completed form.

No hunks were dropped under the BUG-1301 precedence exception. No test files
were involved, so 2f did not apply.

## Post-merge review flag

Per the enrichment's "flag this file for post-merge review" directive: both
sides' commit subjects are the generic `xgd(ticket): update bug
bug-6612c4b7`. This is the **fifth** distinct commit in this bundle carrying
that identical subject against this one file, and its diff is enormously
larger than the four before it — the subject gave no hint of that. Resolution
rested entirely on diff contents.

Worth a reviewer's eye: hunk 2 is the first hunk in this bundle where taking
the wrong side would have changed what the ticket *asserts about the codebase*
(that `[observability]` is undeclared) rather than just losing bookkeeping
fields. The staged result keeps HEAD's "added here" account, which is
consistent with the UAT named in that same section.
