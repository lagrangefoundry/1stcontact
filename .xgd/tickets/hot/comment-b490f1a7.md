---
uid: comment-b490f1a7
id: COMMENT-1031
type: comment
title: Claude response for overlap_resolution report
created_by: xgd
created_at: '2026-08-16T00:35:41.006243+00:00'
updated_at: '2026-08-16T00:35:41.006243+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-f7491321
  kind: note
---

Cluster 6 resolved. Both stories **confirmed in place** — no reassignment, no merge, no ticket writes.

**The finding:** the single-site guarantee lives wholly in CAP-90, and CAP-92 asserts nothing about site identity. I verified that by exhaustion rather than inference — reading all twelve CAP-92 ACs:

- AC-1073 closes/enumerates the write set → *which operations exist*
- AC-1074 / AC-1075 gate grant and read-write effect → *which operations a consumer can reach*
- AC-1079 records surface, operation, effect, arguments, decision, outcome → site identity is not a checked scope
- AC-1081 governs addressing *within a page* → intra-page, not inter-site

CAP-92 constrains *what may be called*; never *what it is called against*. CAP-90 carries the guarantee via AC-1053 (a turn names a conversation, not a site) and AC-1056 (two sites, two non-crossing conversations).

**The straddling AC:** AC-1058 ("no operation that names a site") was the likely survey trigger. It stays in CAP-90 — its distinctive claim is about the *primed toolset assembled for one open conversation*, which CAP-90's scope names verbatim, and its verification is only reachable inside a running turn. Its "exactly those its grant allows" clause consumes CAP-92's guarantee rather than duplicating it; the distinct CAP-92 proposition (declared-yet-withheld, absent from the manual, audited refusal) is AC-1074. No shared evidence.

**Why moving either would be a regression:** STORY-103's Technical Context records that REQ-127 explicitly withdrew making the binding a *declared scope predicate* — which would have located it in CAP-92 — because a predicate hands the model a site parameter it must get right on every call, re-opening an error class that does not currently exist. The boundary is a reasoned intent decision; migrating AC-1058 to CAP-92 would reverse it.

Report created and verified: **REPORT-2030** (`report-f7491321`), `result=pass`, `report_kind=overlap_resolution`, `subject_uid=report-7ef6a9ea`, `cluster_id="6"` — the iterator's gating field confirmed present as the string `"6"`.

One correction for the prompt template, since it will misfire for the next cluster: the `xgd report create --stdin ... <<'EOF'` form in Step 4 fails (`--stdin payload is not valid JSON`) — `--stdin` wants a complete JSON spec, not a body heredoc. Also `report_kind` and `subject_uid` are rejected inside `--fields`; they're owned by `--kind` and `--subject`. The working form is `--subject report-7ef6a9ea --kind overlap_resolution --fields '{"cluster_id": "6"}' --result pass --body-file -`. The template additionally carries literal `{{`/`}}` double braces in its `--fields` JSON, which would be invalid JSON if pasted verbatim.
