---
uid: comment-4b469bae
id: COMMENT-5776
type: comment
title: Comment on request REQ-465
created_by: xgd
created_at: '2026-10-27T20:04:26.975848+00:00'
updated_at: '2026-10-27T20:04:26.975848+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-9f48b7ff
  kind: note
---

Contradictions re-check after BUG-301 (2026-10-27): all nine of DOC-70's contradictions are resolved. BUG-301 (46c40cc599) closed D-7 (the ReportBug clause is shown only where ReportBug is granted; the Development tickets overview's 'not on your own initiative' is replaced by INITIATIVE_NOTE), D-8 (rule 12 says to ask for checks in accept and look only at what came back unverified, unreported or failed, which agrees with the Delegation overview) and D-9 (due questions are held off while the draft is unreviewed; an over-cap plan entry is cut between lines). BUG-301 and REQ-473 UATs: 12 of 13 pass. The red one is test_UAT_FC_REQ-473_the_consultants_authored_size_is_inside_the_lowered_budget, at 206,800 against a budget of 205,000. That's prompt growth since REQ-473 (REQ-474 Library work, plus BUG-301's text), not a contradiction.