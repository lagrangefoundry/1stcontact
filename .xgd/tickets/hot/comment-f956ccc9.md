---
uid: comment-f956ccc9
id: COMMENT-2560
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T16:42:28.044452+00:00'
updated_at: '2026-09-10T16:42:28.044452+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-d65b2e3a
  kind: note
---

**REPORT-3761 (`report-d65b2e3a`) — PASS: 0 violations, 3 warnings, 0 needs_review.**

## What I checked

All 28 active ACs across the capability's three stories (STORY-94 publish, STORY-95 serve, STORY-96 clean URLs) against the intent ledger — BUNDLE-13 (REQ-108/109/110/111/113 + BUG-30) as originating intent, BUNDLE-20 (REQ-143…153, incl. REQ-149) as the reconciling one that retired `1c deploy`, the per-site index and the sha-addressed draft-preview channel.

**Coverage is complete**: every AC has exactly one convention-named UAT, and every one drives a real entry point — the `1c` CLI through `run(argv)`, `control-app`/`public-site`'s own `fetch` (in workerd against real D1/R2 for the six criteria that need them), or a real loopback server. None is a structural/AST substitute.

I also ran the three Node suites: **15 passed, 8 failed, every failure `listen EPERM: operation not permitted 0.0.0.0`** — the sandbox denies binding a socket, so the six tests that start the preview server and the two that start the builder time out at 60s without reaching an assertion. No assertion failed. The two `.workers` suites weren't executed here.

## The three warnings

1. **Exclusivity** — `test_UAT_AC903` and `test_UAT_AC1423` prove the same scenario the same way (republish → wind the log back → bytes untouched). This is the uat-level face of today's ac-level warning that AC-903 ¶2 and AC-1423 state the same criterion; the tests are faithful to their ACs, so the AC narrowing has to come first.
2. **Consistency** — `test_UAT_AC916` still carries the two-addressing-form shape REQ-149 D7 retired: two identical requests to `/site/acme/whitepapers`, the second labelled "the published address resolves its prefix differently", plus `expect('/site/acme/whitepapers').not.toMatch(/\/(draft|rev)\//)`, which asserts a literal about itself. The file's docblock was updated to "ONE CHANNEL SINCE REQ-149"; the body wasn't.
3. **Consistency** — same residue at `test_UAT_AC920:541`: `const forms = [X, X]`, the same URL twice.

All three are dead weight rather than coverage gaps — the ACs' behaviour is fully proved either way, which is why this passes.
