---
uid: report-1cab4450
id: REPORT-4621
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T04:26:24.241658+00:00'
updated_at: '2026-09-21T04:26:24.241658+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-13a5e206.md` (REQ-162) — **UU**, intent/bookkeeping
  ticket (`request-*`), rule 2e. Outside the sparse-checkout cone, so resolved
  via `git checkout --ours` + `git add --sparse` per DOC-986 §2/§4.1.

  Three conflict hunks, all resolved to **HEAD** per 2e's per-fact
  later-positioned-intent rule. This matches the auto-enrichment guidance
  ("take the more recent commit by timestamp"): HEAD is `updated_at`
  2026-09-02T01:34:36Z, incoming (`00a976b04e`) is 2026-08-31T20:42:52Z.

  1. **Frontmatter** — same facts changed on both sides (genuine conflict):
     HEAD `status: free_and_reconciled` / `completed_at: 2026-09-02` /
     `result: pass` vs incoming `status: draft` / `completed_at: null`.
     HEAD is the later intent.
  2. **Body, deliverable 3 (blob store)** — HEAD is a strict superset of the
     incoming paragraph: it carries the same "Keys stay `t/<tenant>/blob/<sha256>`"
     text plus the bucket name `1stcontact-material`, the
     `wrangler r2 bucket create` operator note, and the wiring-layer
     enforcement paragraph. Kept the superset.
  3. **Acceptance criterion on blob-store construction** — same fact stated
     differently. Incoming: "a store constructed without a `BlobStore` fails at
     construction rather than at first use." HEAD: "`ticketStoreFor(env)` throws
     when the blob binding is absent. (The *component's* call-time refusal is
     correct and stays as upstream wrote it.)" HEAD records the resolved design
     decision — enforce at this repo's wiring layer, leave upstream component
     policy alone — and is the later intent. Taking the incoming side here would
     have reverted a settled decision back into the acceptance criteria.

## Incoming changes preserved

Verified by diffing the incoming commit against its own base
(`git show :1:` vs `git show :3:`), which isolates exactly what
`00a976b04e` contributes: the deliverable-3 blob-store section (intro,
"must not share `1stcontact-sites`", BUG-31 / [[DOC-12]] §7 precedent,
the `t/<tenant>/blob/<sha256>` key-scheme paragraph) plus two acceptance
bullets (separate blob bucket declared in both wrangler blocks with a UAT
pinning both; attachment ops through the wired store).

Every one of those is present in the resolved file — verbatim for the first
three paragraphs, and in later refined form for the key-scheme paragraph and
both acceptance bullets. No incoming content was discarded; the BUG-1301
precedence exception was not needed and no hunk was dropped.

Because HEAD already contains the incoming commit's full contribution, the
net staged diff against HEAD is empty. Per this step's instructions, `--skip`
was NOT called — staging is clean, `CHERRY_PICK_HEAD` remains at
`00a976b04e9ee8f8d06470f6f20c327a4503458f`, and the finalize step will detect
the clean staged diff and resolve the empty pick itself.

No code/implementation files were in conflict; no UAT test functions were
touched or deleted on either side.
