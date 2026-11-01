---
uid: report-a12ee6a1
id: REPORT-7197
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-01T01:51:57.955605+00:00'
updated_at: '2026-11-01T01:51:57.955605+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-fd009b93
  plan_item_index: '3'
---

Plan item 3 of 7 (REQ-166) is applied to STORY-159: one AC modified and five added. All five new ACs are linked under the story. The ticket tool also tried to push to `github.com` after each create, and the sandbox blocked it, so the tickets are saved locally but not synced.

**Code issues found (recorded in STORY-159's Known gaps for `fix_uat_coverage`):**
- **Gap 8: the deployed Worker never writes a reference ticket.** `shot.ts`'s `fidelityDeps` accepts an adoption dependency, but `router.ts:181` calls it without one, and nothing else in the app binds `adoptCapture`. So in production `capture_site` always answers `reference.adopted: false` ("this deployment keeps no corpus"). AC-2080 follows the intent and will fail until that wiring is added.
- **Gap 9: the client's declared domain is never passed to adoption.** Every production capture is therefore recorded as a third-party site, including the client's own old site. That contradicts REQ-166's rights table.
- **Gap 10: the "is this your site?" question on a domain mismatch is never asked.** It's recorded as a gap only, with no AC here, because the capture operation can't express a client-facing prompt; it needs its own follow-up.

**Decisions recorded under `## Reconciliation Decisions`:**
- Unchanged recapture writes neither a blob nor a record. REQ-166's own Corrections section explicitly replaces its earlier "new records, no new blobs" line.
- A recapture is matched to its ticket by bundle name, not URL.
- Members missing from a recapture are detached.
- A subdomain of the declared domain counts as the client's own (no bare suffix match).
- The adoption report's shape is fixed as `{adopted, uid, created, why}`.

No existing AC needed to be marked superseded.

```
Upgrade mutations applied for plan item 3 of 7

Target Stories: STORY-159
Primary Story UID: story-31204812
Stories Modified: 1
ACs Modified: 1
ACs Added: 5
ACs Removed: 0

tickets_modified:
  stories:
    - "story-31204812"
  acceptance_criteria:
    modified: ["acceptance_criterion-32f514e9"]
    added: ["acceptance_criterion-cf7a3ddf", "acceptance_criterion-c7aeb7af", "acceptance_criterion-6cb2efc7", "acceptance_criterion-1038b70f", "acceptance_criterion-0993ef63"]
    removed: []

Progress: 3 of 7 plan items complete
```

**Story change (STORY-159):** `story_kind` is now `upgrade`. The body now covers REQ-166 adoption:
- one `reference` ticket per bundle, with each member tagged in `meta.member`
- title taken from the page's `<title>`, falling back to the host
- the body always opens with a link to the captured site
- rights set from where the capture came from
- recapture updates the same ticket, keyed on bundle name
- the result always reports whether a reference ticket was written

The Library's presentation of a capture is now marked out of scope here; it belongs to STORY-144 (plan item 4).

**AC changes:**
- **AC-2044 (modified):** the `capture_site` result now includes `reference: {adopted, uid, created, why}` on every call.
- **AC-2080:** on the deployed host, a capture writes one `reference` ticket with one attachment record per bundle member, and each member can be read on its own.
- **AC-2081:** the title is the page's own `<title>` (host if blank); the body opens with a link to the site, always carries the measured palette, type and section count, and says so when the site wasn't described.
- **AC-2082:** the client's own domain (or a subdomain) is recorded republishable and not exportable; any other domain is the reverse.
- **AC-2083:** recapture updates the same ticket and rewrites its title and body. Unchanged members write nothing; changed members get a new record and the old one is detached; vanished members are detached.
- **AC-2084:** with no ticket store (the `1c` CLI), capture works as before and says no reference was written. A failed adoption is reported and the bundle is kept. A bundle with no `capture.json` is refused by name.
