---
uid: report-08fdd1c9
id: REPORT-11201
type: report
title: 'Fix reconciliation review: bundle-7988e925'
created_by: xgd
created_at: '2026-11-07T23:28:21.549674+00:00'
updated_at: '2026-11-07T23:28:21.549674+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_reconciliation_review
  subject_uid: bundle-7988e925
  needs_more_work: false
  progress_made: true
---

## Stories created
None

## Stories modified
None. AC-2342 (acceptance_criterion-faa27b9d, story-0cd18650): the Criterion now also states the refused-acceptance behaviour, and the Verification now describes the executed DOM check as the evidence. The served-script regex stays only as a structural extra.

## Stories deleted
None

## ACs superseded
None

## FC orphans renamed/deleted
None. No fc_orphan_check failure was reported for this call.

## Code changes
- tests/reconciliation-terms-accept-navigation.test.ts (new, node project, jsdom). Three UATs named `test_UAT_AC2342_*`. Each one gets the interstitial from the real `guardTerms` for an unaccepted navigation, at /terms and at builder URLs. It loads the page into a DOM at the URL it was served at and runs the page's own inline script, with only fetch and location doubled. Then it clicks #accept and asserts:
  - one JSON POST to TERMS_ACCEPT_PATH carrying {version}, with the button disabled while it is in flight;
  - at /terms, assign('/') is called and reload() is not;
  - at builder URLs, reload() is called and assign() is not;
  - on a non-ok response, nothing navigates, the button is re-enabled and #error is revealed.
- No production code was changed.

## Confidence
High that the AC-2342 gap is closed. The tests were not run in this call, as the instructions say; the workflow suite runs next.
