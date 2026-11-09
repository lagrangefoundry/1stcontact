---
uid: comment-8aeaac71
id: COMMENT-8054
type: comment
title: Claude response for fix_reconciliation_review report
created_by: xgd
created_at: '2026-11-09T01:28:26.383296+00:00'
updated_at: '2026-11-09T01:28:26.383296+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-eb8db624
  kind: note
---

I've worked through all nine gaps in the BUNDLE-42 review, but the next review may still not pass. Four findings need production-code changes I couldn't make while code is frozen, and I haven't run any of the new tests (the instructions said not to). The completion report is REPORT-11645, filed with `progress_made=true` and `needs_more_work=true`.

**New tests (test files only):**
- **GAP 1, AC-912:** the published-site server now gets checked for 405 on every non-read method across page, root, `/api/lead` and `/site/<key>/api/lead`. It also covers POST to near-miss paths like `/api/leads`, POST to the real lead paths not getting 405, and the case with no apex site configured.
- **GAP 3, AC-2490:** a new test compares a stored JPEG against a captured reference in both directions, plus a Library image and a PNG against itself. I set AC-2490 from pending to active.
- **GAP 5, AC-2513:** the test now builds the real `LeadIntake` entrypoint and sends a real form POST through it, checking the contact row in the database. It uses the entrypoint's own mailer, which only logs because the test env has no email API key.
- **GAP 6:**
  - The failed-write case now uses the real lead capture against a database that rejects every query, instead of a throwing stub.
  - New cases put a CRLF, an LF, a space and a tab inside the email field. Each gets the normal acknowledgement, no mail and no new contact.
- **GAPS 7–9:**
  - Filling a field by `aria-label`, `aria-labelledby` and `placeholder`.
  - Compare with the edit picture on the second side.
  - Panel naming where a heading follows other text, and where the panel has no text at all.
  - The system-KB embedding failure, with the "reload the worker" advice checked.

**Story and AC updates:**
- **STORY-177 (lead capture):** the false "bounded read" claim is corrected. Three places where the code does less than REQ-223 asks are now written down as divergences, each with its code issue flagged: large undeclared bodies, multipart forms, and bounce/complaint checks that only look within one tenant. The rate-cap tension is recorded. AC-2509 through AC-2513 are updated to match.
- **STORY-157:** the drawing-caption decision is replaced by a stated divergence, and the out-of-date text the review listed is fixed.
- **Minor items:**
  - AC-2435 now names the builder as also setting the overlay marker; I confirmed it does.
  - STORY-85 no longer has two decisions headings.
  - A test misnamed `all_five_kinds` is renamed.
  - The AC-2471 scan now also catches `const { AI } = env`.

**Production changes left for the planner:**
1. `apps/public-site/src/lead.ts` reads an undeclared large body in full before refusing it; it should stop reading past 8 KiB.
2. `tools/generate/src/cli/picture.ts` (and the surface JSON): the drawing caption should say letter widths and line breaks are not evidence. AC-2486 now asks for this, but its test still checks only the current caption, so it won't fail before the change lands.
3. `apps/public-site/src/lead.ts`: multipart forms are accepted but read as urlencoded, so every field (including the Turnstile token) is lost. They should be parsed properly or refused with 415.
4. Optional: a platform-wide list of bounced/complained addresses. Today only the submitting tenant's contact is checked.

**Risks and loose ends:**
- **Most likely to fail:** the AC-2513 test builds the `LeadIntake` entrypoint directly inside the workers test pool, which no other test in the repo does. If the runtime refuses that, it will need a service binding instead.
- **AC-2497 not done:** the test harness can't perform a real page reload, so it still re-delivers the page instead of going through the real save path.
- **FC orphan:** `tests/test_UAT_FC_REQ-223_internal_seam.test.ts` still exists and will likely trip the orphan check later. There was no orphan report for this run, so I left it.
- **Uncommitted tests:** the ticket changes were committed through the ticket tool, but the test edits are not committed.