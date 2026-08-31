---
uid: report-014a833e
id: REPORT-2921
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-08-31T12:29:43.257775+00:00'
updated_at: '2026-08-31T12:29:43.257775+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-b3b7c399
  plan_item_index: '10'
---

The story body persisted with all three AC citations.

```
Story #10 created for reconciliation bundle-b3b7c399

Story UID: story-17ba490e (STORY-122)
Title: Site Locale Identity: A Site Says Where It Is, And Every Page Declares It
Type: feature
Acceptance Criteria: 10 created

Progress: 10 of 11 plan items complete
```

**Capability**: created `capability-bcbcdaf1` (CAP-104, `site_locale_identity`) — no existing capability covered a site's location, language, currency or timezone, matching the plan's justification that this is a genuinely new bucket rather than an extension of the framework-substrate or structured-edit stories.

**Acceptance criteria** (AC-1428…AC-1437): undeclared site renders the region-free `en`/`ltr` and every stored draft *and published revision* still validates · country alone derives locale/currency/timezone and reaches the rendered `lang` · each derived field overrides independently · both render paths agree on `lang`/`dir` · RTL renders `dir="rtl"` with direction from the script subtag when present · a bad country/locale/currency/timezone is a validation error at `/config/<field>` · a behavior module is handed the resolved identity and it reaches the markup · every derivation-table row is itself valid config and resolves back to itself · a locale-shaped slug is refused at the authoring surface with the reason and two alternatives, leaving no half-written page · near-miss slugs (`design`, `de-luxe`, `zh-Hans`, `zz`) still validate.

**Reconciliation decisions recorded** (three, all gaps where intent was silent rather than contradicted): the derivation table being validated as site config (an extra UAT in REQ-151's test plan, absent from its AC list); the slug reservation being asserted at the authoring entry point rather than only at the validator; and no-regression covering published revisions, stated over stored sites read at verification time rather than over two named ones.

**No intent/code contradiction found.** The one apparent tension — REQ-151's "what to change" defaulting `country` to `US` versus its AC-1 asking for `lang="en"` when nothing is declared — is resolved in the ticket's own implementation record (declared `US` is a fact → `en-US`; declaring nothing is the absence of one → region-free `en`), and the ACs follow that resolution rather than inventing one.
