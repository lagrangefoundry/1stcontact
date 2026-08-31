---
uid: request-909e42f8
id: REQ-164
type: request
title: 'Corpus export correctness: doc_kind filter, unrestricted shipped corpus, exhaustive
  listing'
created_by: xgd
created_at: '2026-08-31T20:33:32.231166+00:00'
updated_at: '2026-08-31T22:10:20.021140+00:00'
completed_at: null
last_field_updated: body
status: free_coded
fields:
  priority: high
  story_points: 3
  depends_on:
  - REQ-827
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-6fb39b2a
  commits:
  - working_sha: 858d63202fae2badbaf3e8495363244f8bd3a9fd
    reconcile_sha: null
    main_sha: null
  - working_sha: c056002a525bf126e635f32118b64e2c76ad3ab0
    reconcile_sha: null
    main_sha: null
  version: 0.2.22
---

# Corpus export correctness: the `doc_kind` filter, an unrestricted shipped corpus, and exhaustive listing

## Why these are one ticket

Three small changes to `1c kb export` / `1c kb build` that share a single failure
mode: **each one silently produces a smaller corpus than intended.** No error, no
warning — just an index that builds, works, and is missing documents. The symptom
surfaces much later as *"the assistant doesn't seem to know about that"*, several
artifacts downstream of the cause.

They also cannot land separately without leaving a window where the export is
wrong. [[REQ-158]] cannot produce a corpus anyone should trust until all three
are done.

## 1. The export filter reads `doc_kind`, not `system_kb`

[[DOC-39]] §3.3 settles membership as **`doc_kind: system_kb`** — a kind rather
than a boolean, because a flag invites *"this architecture document is **also** a
system document"*, which is the category error [[DOC-39]] §3.1 exists to prevent.

State of play: the `system_kb: true` boolean has already been cleared from all 38
doc tickets, and four documents have been chosen for reclassification — DOC-33
(Consultation Playbook), DOC-35 (Personas, Modes & Registers), DOC-31
(Differentiation Audit) and DOC-17 (Design Lessons Log). They are a *starting*
corpus flagged for rewriting, not the finished set: all four were written for us
rather than for the AI ([[DOC-39]] §3.5).

**Blocked on xgd REQ-827**, which adds `system_kb` to the `doc_kind` enum — the
enum is closed and defined in xgd source, so the value cannot be set until it
ships.

## 2. The shipped KB's corpus becomes unrestricted

Today the KB config re-applies `type=doc AND fields.system_kb=true` **at query
time**, against a directory where everything already matched by construction. It
is a build-time filter being re-run as if it were a membership rule, and it is
most of why this looked like more mechanism than it is ([[DOC-39]] §3.3).

At runtime the distribution *is* the corpus: a directory of markdown served
through the ticket interface by a read-only store. So `corpus: {}`.

Leaving the predicate in place has a real cost beyond redundancy — a file placed
in the corpus directory without the expected frontmatter is silently invisible.

## 3. `readDocTickets` must list exhaustively

```js
const raw = execFileSync('xgd', ['ticket','list','--type','doc','--view','--json'], …)
return (JSON.parse(raw).items) ?? []      // takes page one, ignores next_cursor
```

`xgd ticket list` pages at 50. There are 38 doc tickets. At 50 the export begins
dropping documents with no error and no warning — the JSON envelope carries
`next_cursor`, and this consumer never looks at it.

xgd REQ-825 has landed and added an exhaustive affordance; use it rather than
hand-rolling a cursor loop.

## Why the count is close enough to matter

38 of 50. Two more documents than we have and the corpus starts shrinking
silently — and this line of work adds documents.

## Acceptance

- The export selects exactly the doc tickets carrying `doc_kind: system_kb`, and
  the four named documents carry it.
- The shipped KB declares an empty corpus; a markdown file placed in the corpus
  directory is indexed regardless of its frontmatter.
- `readDocTickets` returns every matching ticket, asserted against a fixture
  larger than one page.
- `1c kb status` reports a document count that matches the number of tickets
  carrying the marker — so a truncated export is visible rather than inferred.

## Depends on

xgd **REQ-827** (the `doc_kind` enum value) for part 1. Parts 2 and 3 are
independent of it and of each other, but shipping them apart leaves the export
wrong in a different way each time.

---

# What landed

Both blockers had already shipped in the installed `xgd` (0.15.419) when this was
implemented: `system_kb` is in the `doc_kind` enum, and `ticket list --no-limit`
exists. Nothing was deferred.

## 1. Membership is the kind

`tools/generate/src/cli/kb.ts` — `INCLUDE_FIELD`/`optedIn()` are **replaced**, not
extended, by `DOC_KIND_FIELD` + `MEMBER_KIND` and `inSystemKb()`. The retired
boolean is no longer honoured at all: a document still carrying `system_kb: true`
from before the change is not a member, because honouring it would put a document
in front of a client-facing assistant on a marker nobody maintains any more.

`fields.doc_kind` was chosen over a field of our own for the three reasons in
[[DOC-39]] §3.3 — it is single-valued (so §3.1's exclusivity is enforced by the
shape rather than by discipline), it already means exactly this, and it stays
clear of `fields.kind`, which the knowledge component owns for awareness reports.

The four named documents now carry it (DOC-33, DOC-35, DOC-31, DOC-17); `1c kb
export` reports 4 documents and names all 34 non-members individually.

## 2. The corpus is unrestricted

`kb/knowledge_bases.json` and the `ensureConfig` scaffold both declare
`corpus: {}`. Verified behaviourally, not just structurally: a bare markdown file
with no frontmatter at all, dropped into the corpus directory, is now resolved by
`resolveCorpus` — the case the old predicate dropped silently.

Both are asserted, because `ensureConfig` never overwrites an existing
declaration, so the shipped file and the scaffold can drift apart with no error.

## 3. The listing is exhaustive, and truncation is refused

`readDocTickets` passes `--no-limit` **and checks the envelope it gets back**.
`--no-limit` is upstream's promise; the check is the assertion that it was kept.
If a truncated page arrives anyway — an older `xgd` on `PATH`, a flag that stops
meaning what it means — that is a loud failure naming the flag, because a quietly
shorter corpus is the exact thing this ticket exists to prevent. `maxBuffer` went
64MB → 256MB, since the call now returns the whole store rather than a page.

## 4. A short corpus is visible, not inferred

`KbStatus` gains `tickets: number | null` — how many doc tickets carry the marker
— and `1c kb status` prints it on the corpus line:

```
corpus: 4 document(s) (of 4 ticket(s) carrying doc_kind: system_kb)
corpus: 2 document(s) ⚠ 3 ticket(s) carry doc_kind: system_kb — the corpus is stale; run `1c kb export`
corpus: 4 document(s) (ticket store unreadable — cannot check)
```

`null` rather than `0` when the store cannot be read: zero is a real and alarming
answer, and manufacturing it from an unrelated failure would send an operator to
rebuild a corpus that was never broken. This is the one place `readDocTickets`'
failure is swallowed — export and build both still want it.

## Design decisions made during implementation

- **`kb status` shells out to the ticket store.** The acceptance criterion asks
  for a count that *matches the tickets carrying the marker* — which a
  files-on-disk count cannot show on its own, since 37 documents looks exactly as
  healthy as 38 unless something says what the number should be. So status asks
  both sides and prints them together. Cost: `status` is no longer pure-filesystem.
- **The envelope check was added beyond the stated scope.** Passing `--no-limit`
  alone would leave the same class of failure reachable from a stale `xgd`, and
  the failure is silent by nature.
- **No back-compat for the boolean.** Per the simplicity mandate: replaced, not
  extended, so there is one membership rule rather than two.

## Test plan

`tests/test_UAT_FC_REQ-164_corpus_export.test.ts` — 12 UATs, in four groups
matching the acceptance criteria. Only the ticket store is stood in for (an `xgd`
shim on `PATH` that is handed the real argv, so whether the export actually asks
for every page is observable); the export's own JSON parsing, envelope check,
membership filter, rendering and sweep run for real, as do the real `DocDirStore`
and the real corpus resolution.

- membership: a mixed store of 7 tickets across 5 field shapes, including the
  retired boolean; the CLI skip line names the field and the value
- unrestricted: the scaffolded declaration, the shipped declaration, and the
  behavioural proof over three files (full frontmatter / no `fields` block / no
  frontmatter at all)
- exhaustive: a 60-ticket fixture — larger than one page on purpose, since a
  smaller one passes vacuously, which is how the bug survived; plus a store that
  truncates regardless (refused) and one that fits in a page (accepted)
- status: agreement, discrepancy, and an unreadable store

The two ACs that assert what the *command* prints move the repository's real
corpus aside and restore it, since `1c kb export` takes no root argument.

**Superseded tests.** `tests/reconciliation-system-knowledge-base.test.ts` and
`tests/test_UAT_FC_REQ-123_system_kb.test.ts` pinned the boolean-flag rule and are
updated to the kind — implicit supersession, this intent being the later one.
Both now assert that the retired boolean is *not* membership.

**Also repaired**: two UATs left red by the upstream `prompt` → `description`
rename (020ec40610), which had been failing since. Out of scope strictly, but a
red suite is not evidence, and these are the suites this change is evidenced by.

## Verification

- KB scope: 6 suites, 55 tests, all passing
  (`test_UAT_FC_REQ-164_corpus_export`, `reconciliation-system-knowledge-base`,
  `test_UAT_FC_REQ-123_system_kb`, `test_UAT_FC_REQ-123_session_knowledge`,
  `reconciliation-assistant-conversation-knowledge`, `naming`)
- Full sweep: 2059 tests, 15 failing across 7 suites — **all pre-existing**.
  9 reproduce identically on the untouched baseline; the other 6 are the known
  full-run `dist-assets` interference and pass in isolation. None touch the KB.
- `npx tsc --noEmit -p tools/generate/tsconfig.json` clean
- End to end against the real store: `1c kb export` → 4 documents, 34 named
  skips; `1c kb status` → `corpus: 4 document(s) (of 4 ticket(s) carrying
  doc_kind: system_kb)`

## Commits

- `858d63202f` — the three fixes, the status count, and the UATs (version 0.2.21)
- `c056002a52` — version re-bump to 0.2.22; 0.2.21 was claimed at the working tip
  by a concurrent session's ticket auto-commit before `move-to-free-coded` ran
