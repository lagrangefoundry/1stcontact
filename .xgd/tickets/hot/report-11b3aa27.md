---
uid: report-11b3aa27
id: REPORT-5322
type: report
title: 'Resolve: request-13a5e206 (REQ-162) — 3 hunks, all ours'
created_by: xgd
created_at: '2026-09-28T07:43:54.427215+00:00'
updated_at: '2026-09-28T07:43:54.427215+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Conflict resolution: `.xgd/tickets/hot/request-13a5e206.md` (REQ-162)

Cherry-pick `00a976b04e` — `xgd(ticket): update request request-13a5e206`,
authored 2026-08-31 13:42 -0700, subject line *"content edit: add the blob
store — separate bucket, not a prefix in the publicly-bound sites bucket"*.

Single conflicted path, three hunks. **All three resolved to ours (HEAD).**
Resolution is byte-identical to HEAD, so the pick is empty.

## Why ours, in every hunk

The incoming commit is the **2026-08-31 draft** state of REQ-162. HEAD carries
that same ticket after it was free-coded and reconciled — `status:
free_and_reconciled`, `completed_at: 2026-09-02T01:34:00Z`, `result: pass`,
`merged_at_commit: 4b43dd9a5c`, with a 105-line *"What landed (free-coded,
2026-08-31)"* section the incoming side has never seen.

Critically, **the incoming edit is already on our side.** The ours blob
(`e909dcbb97`) already contains every line the pick adds:

| Incoming addition | On HEAD? |
| --- | --- |
| `**3. The blob store, in its own bucket.**` + REQ-104 paragraph | yes, verbatim |
| `**It must not share `1stcontact-sites`.**` paragraph | yes, verbatim |
| BUG-31 / [[DOC-12]] §7 disclosure-vs-overwrite paragraph | yes, verbatim |
| `t/<tenant>/blob/<sha256>` keys paragraph | yes, as a superset |
| TypePack renumber `3.` → `4.` | yes |
| AC "A blob bucket distinct from `1stcontact-sites`…" | yes, verbatim |
| AC "Attachment ops work through the wired store…" | yes, deliberately revised |

Nothing is dropped by taking ours. Three hunks in detail:

### 1. Frontmatter (lines 8–18)

Ours `status: free_and_reconciled` / `completed_at` set / `last_field_updated:
result` vs incoming `status: draft` / `completed_at: null`. Taking incoming
would regress a reconciled ticket back to draft and null out its completion.
Ours.

### 2. The keys paragraph (lines 632–662)

Incoming is a proper prefix of ours. Ours opens with **"The bucket is
`1stcontact-material`."** — naming the bucket the incoming side only describes —
repeats the incoming sentences unchanged, then extends "declared in both
wrangler blocks" with "*and added to `vitest.workers.config.mts` so the UAT runs
against a real R2*", and adds two further paragraphs: the
`wrangler r2 bucket create 1stcontact-material` operator note (miniflare conjures
the bucket, Cloudflare does not), and the enforcement-at-the-wiring-layer
paragraph. Strict superset. Ours.

### 3. The construction acceptance bullet (lines 710–717)

The only hunk where the two sides genuinely disagree, and it is a **considered
correction, not drift**:

- incoming — "a store constructed without a `BlobStore` fails at construction
  rather than at first use"
- ours — "`ticketStoreFor(env)` throws when the blob binding is absent. (The
  *component's* call-time refusal is correct and stays as upstream wrote it.)"

Implementation found the incoming claim false about the component. Ours' own
body records the finding under *"The acceptance line about construction,
resolved at the wiring layer"*: the upstream component refuses
`attach`/`attachments` at **call** time and is otherwise conforming — correct for
a general component that cannot know whether its host has bytes to store — so
1stcontact raises `BlobsNotConfiguredError` at construction in
`ticketStoreFor`, mirroring the existing `TENANT_ID` shape, and leaves upstream
policy alone. Restoring the incoming wording would reinstate an AC that
contradicts shipped, mutation-tested behaviour (wiring the blob store to `SITES`
fails the disclosure UAT; dropping the `ALTER` fails 13 of 15 workerd UATs).
Ours.

## Outcome

`git checkout --ours` + `git add --sparse`; no conflict markers remain and
`git status --short` is clean, confirming the tree matches HEAD. The pick is
empty — its content landed post-watermark and was refined on top. The sequencer
was **not** advanced; `CHERRY_PICK_HEAD` is still `00a976b04e` for the
orchestrator to dispose of.
