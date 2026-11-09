---
uid: report-eb8db624
id: REPORT-11645
type: report
title: 'Fix reconciliation review: bundle-7ba3af93'
created_by: xgd
created_at: '2026-11-09T01:28:09.746606+00:00'
updated_at: '2026-11-09T01:28:09.746606+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_reconciliation_review
  subject_uid: bundle-7ba3af93
  needs_more_work: true
  progress_made: true
---

## Stories created
None

## Stories modified
- **story-f2e5032c (STORY-177, REQ-223 lead capture)**
  - GAP 2: corrected the false "bounded read" decision and recorded an explicit DIVERGENCE: an undeclared (chunked) large body is read whole by `request.arrayBuffer()` before the 413. Code issue flagged.
  - GAP 6(b): new decision "Suppression is per tenant", a narrowing of REQ-223 §5, with its deliverability cost. Code issue flagged.
  - GAP 6(c): DIVERGENCE: `multipart/form-data` is accepted but parsed as urlencoded. Code issue flagged.
  - GAP 6(e): the per-site rate-cap tension (20 per 60 s keyed on site and IP; a cap is a DoS lever against the customer, so it is a generous backstop) is recorded in Technical Context.
  - ACs updated:
    - AC-2509: as-built narrowed criterion plus the divergence.
    - AC-2510: Verification now uses the real `captureLead` against a failing D1.
    - AC-2511: adds the CR/LF/whitespace-in-email rule (nothing written or sent, frozen acknowledgement).
    - AC-2512: per-tenant scope stated.
    - AC-2513: Verification drives the real `LeadIntake` entrypoint.
- **story-58b2cec4 (STORY-157)**
  - GAP 4: the drawing-caption decision is replaced by an explicit DIVERGENCE: rasterising in a bare document rather than the draft preview is the epic's wanted refinement, and the caption is weaker than EPIC-1's wording. Added an OPEN "Code issue flagged" for the caption.
  - Stale text fixed:
    - fields match by label, aria-label, aria-labelledby and placeholder only, no `name`/`id`;
    - a menu matches label before value;
    - the CLI's "holds no Library" refusal is documented;
    - the two earlier code-issue sections are marked RESOLVED, with their override reports.
  - AC-2486: now requires the letter-widths/line-breaks warning. It carries a divergence and code-issue note: the existing UAT pins only the shipped halves until the caption change lands.
  - AC-2487: the stale "code issue" note is replaced with a resolved note (override report-15fed5d0).
- **story-47fb84e6 (STORY-158)**
  - GAP 3: the evidence line now cites the real AC-2490 UAT, and the "compared at its own size" decision points at it.
  - AC-2490 is set from pending to **active**.
- **story-179b8c06 (STORY-85, minor):** the BUG-75 Technical Context and decision had been appended after Story Points. They are now folded into Technical Context and the single Reconciliation Decisions section, so there are no duplicate decisions headings.
- **story-e214a00d, AC-2435 (minor):** the marker is now one "a script or the builder sets" (REQ-215 acceptance 4). Verified: `page-state.ts` sets it when the builder applies carried state.

## Stories deleted
None

## ACs superseded
None (the review's Step 4c passed)

## FC orphans renamed/deleted
None. No fc_orphan_check report exists for this anchor. Note: `tests/test_UAT_FC_REQ-223_internal_seam.test.ts` still exists and will be flagged by the orphan gate. Its behaviour is AC-2513's.

## Code changes
Tests only; production code is untouched:
- `tests/reconciliation-published-site-serving.test.ts` (GAP 1, AC-912):
  - PUT, PATCH, DELETE and OPTIONS get 405 with `allow: GET, HEAD` on a page, the site root, `/`, `/api/lead` and `/site/<key>/api/lead`;
  - POST gets 405 on a page, the root, `/api/leads` and `/api/lead/x`;
  - POST to `/api/lead` (apex configured) and to `/site/<key>/api/lead` is not 405;
  - apex POST gets 405 with an empty or absent `APEX_SITE_KEY`.
- `tests/test_reconciliation_public_lead_capture.workers.test.ts`:
  - GAP 5, AC-2513: the real `new LeadIntake(createExecutionContext(), env)` is used as the `LEAD_INTAKE` binding through a real POST. Asserts the D1 contact row, the provenance event, and the asset sent via the entrypoint's own mailer.
  - GAP 6(a), AC-2510: the throwing stub is replaced by the real `captureLead` on an unavailable-D1 double.
  - GAP 6(d), AC-2511: CRLF+Bcc, LF+Cc, a space and a tab inside the email. Each gets the acknowledgement, with no mail and no new contact.
- `tests/reconciliation-assistant-sees-a-stored-picture.test.ts` (GAP 3): new `test_UAT_AC2490_…`. Through the real Toolbox it compares a stored JPEG against a reference both ways, checking the side labels and the common top-left 30×40 size, plus a Library side and a PNG against itself (zero difference).
- `tests/reconciliation-assistant-drives-the-draft.test.ts` (GAP 7):
  - AC-2479: positive fill cases for `aria-label`, `aria-labelledby` and `placeholder`;
  - AC-2482: `compare(a: draft, b: edit)` carries the caveat.
- `tests/test_reconciliation_builder_page_carry.test.ts` (GAP 8, AC-2499): a panel whose `<p>` precedes its `<h2>` is labelled by the heading, and an empty panel is labelled by its id.
- `tests/reconciliation-client-knowledge-embedder-transport.workers.test.ts` (GAP 9, AC-2472):
  - a failing binding driven through the real `systemKnowledge` gives `kb === SYSTEM_KB`;
  - the literal reload wording is asserted on both KBs.
- `tests/reconciliation-client-knowledge-embedder-transport.test.ts` (minor, AC-2471): the scan also catches `const { AI } = env` destructuring, with self-check assertions.
- `tests/reconciliation-assistant-looking-surface.test.ts` (minor): `all_five_kinds` is renamed to `the_five_page_kinds_…`. The test covers the five page kinds; `image` is covered in the stored-picture file.

## Production-code gaps for the planner (code frozen; not edited)
1. `apps/public-site/src/lead.ts:257-265` (AC-2509): read the body with a running byte cap that cancels past 8 KiB, and fix the wrong comment at :243-245.
2. `tools/generate/src/cli/picture.ts:329-332` and `fidelity-surface.json` (AC-2486): the caption should add that letter widths and line breaks in a drawing are not evidence. The AC-2486 UAT gains that assertion together with the change.
3. `apps/public-site/src/lead.ts:216/281`: parse `multipart/form-data` properly or refuse it with 415.
4. `apps/control-app/src/lead.ts:288-310` (optional, AC-2512): a platform-wide suppression list. It is currently recorded as a per-tenant divergence.

## Not done
- AC-2497 (minor): driving the real `onSaved` reload (`app.js:630`) is not possible in the harness. JSDOM's `location.reload` cannot be redefined and does nothing, and reaching `onSaved` would mean driving the editor's save flow against the API. The re-delivery stand-in remains.

## Confidence
Moderate. Every evidence gap (GAPS 1, 3, 5, 6a, 6d, 7, 8, 9) has a test. Every absorbed divergence (GAPS 2, 4, 6b, 6c) is now stated explicitly in the story and AC, with code issues flagged, and the stale text is fixed. Two risks remain:
- None of the new tests were run in this call (by instruction). The riskiest is the AC-2513 case constructing `LeadIntake` directly inside the vitest workers pool, which no other test does.
- AC-2486 now states intent ahead of the code, so the review may still want the caption override before it passes.
