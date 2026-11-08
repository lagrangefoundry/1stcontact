---
uid: report-786dc6a0
id: REPORT-11218
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-08T01:43:03.097441+00:00'
updated_at: '2026-11-08T01:43:03.097441+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-4164b433
  plan_item_index: '1'
---

Upgrade mutations applied for plan item 1 of 7

Target Stories: STORY-120, STORY-146
Primary Story UID: STORY-120
Stories Modified: 2
ACs Modified: 2
ACs Added: 3
ACs Removed: 0

tickets_modified:
  stories:
    - "STORY-120"
    - "STORY-146"
  acceptance_criteria:
    modified: ["AC-1755", "AC-1384"]
    added: ["AC-2358", "AC-2359", "AC-2360"]
    removed: []

**What was checked**
- **Intent:** BUG-59 part two in the bundle body asks for this behaviour. A service token is a person's automation: a comma-separated `name=address` deployment variable maps the token to that person, and an empty mapping means nobody. The mapping is never taken from the caller. A human's own email always wins, and a mapped name whose address belongs to no one is refused as `no_user`.
- **Code matches intent, with no contradictions:**
  - `actingEmail` (`apps/control-app/src/identity.ts:1006`) does the lookup.
  - It is called only on the Access-gate branch (`apps/control-app/src/index.ts:368`).
  - `wrangler.toml` declares the variable empty under `[vars]` and mapped under `[env.production.vars]`.
  - `ACCESS.md` documents the mapping and its rules.

**What changed**
- **AC-1755** (STORY-146): narrowed so that `no_email` applies only to an emailless identity with no mapping (unmapped, or the mapping is empty).
- **AC-1384** (STORY-120): the repository record must now also say which service-token names act as which person, and the rules for that.
- **AC-2358:** a mapped token is admitted as the person, under that person's membership, grants, terms and revocation. Name matching ignores case on both sides. A mapping does not create anyone: a name pointing at no one is refused as `no_user`.
- **AC-2359:** an unmapped token is refused as `no_email`, an empty mapping opens nothing, and a human's own email always wins.
- **AC-2360:** the mapping is declared in every environment as `name=address` pairs and is never read from the request.

**Story bodies**
- **STORY-120:** the description and scope now cover the mapping. Three Reconciliation Decisions were added:
  - BUG-59 now answers a question an earlier decision had left open on purpose: whether the operator's automation gets a standing entitlement.
  - Case and whitespace in the mapping are ignored. A malformed entry being skipped is deliberately not pinned by an AC.
  - Session-cookie admission never consults the mapping.
- **STORY-146:** gained a Reconciliation Decision explaining that AC-1755 was narrowed and that the mapping itself belongs to STORY-120.

No ACs were deprecated or superseded, and no runtime code or UATs were touched.

Progress: 1 of 7 plan items complete