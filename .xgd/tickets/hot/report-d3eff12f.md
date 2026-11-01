---
uid: report-d3eff12f
id: REPORT-7562
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-01T10:50:14.110659+00:00'
updated_at: '2026-11-01T10:50:14.110659+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-94dbe947
  plan_item_index: '7'
---

Plan item 7 is applied to STORY-99. I updated the story, restated three existing acceptance criteria and added six new ones. No runtime code was changed.

```
Upgrade mutations applied for plan item 7 of 10

Target Stories: story-e674c60a
Primary Story UID: story-e674c60a
Stories Modified: 1
ACs Modified: 3
ACs Added: 6
ACs Removed: 0

tickets_modified:
  stories:
    - "story-e674c60a"
  acceptance_criteria:
    modified: ["acceptance_criterion-92c52943", "acceptance_criterion-60683857", "acceptance_criterion-2bf97625"]
    added: ["acceptance_criterion-6254cf8d", "acceptance_criterion-76d82fd2", "acceptance_criterion-cbeaf2ba", "acceptance_criterion-b9ce70ec", "acceptance_criterion-736da502", "acceptance_criterion-d6ceee21"]
    removed: []

Progress: 7 of 10 plan items complete
```

**Story (STORY-99)**
- **Business switcher:** a new in-scope section puts the switcher at the left of the shell header and the account behind an avatar on the right. It covers how switching business moves everything at once, the state where no business is selectable, and the rule that no on-screen text says "tenant".
- **Toolbar section:** it no longer mentions a site selector.
- **Persistence:** the selected business is now saved along with the other remembered state.
- **Out of scope:** admission, entitlement, the customer portal and the operator-only add-a-business route.
- **Technical notes:** I recorded the gaps the code fills where the intent says nothing, as reconciliation decisions dated 2026-11-01:
  - With zero businesses, the switcher renders nothing.
  - The current site's slug is kept across a business switch if the new business has a site with that slug.
  - A failed site list leaves the pane as it was.
  - The avatar shows the initial of the person's name, or of their email if no name is set.
  - In the nothing-selectable state, the saved selection is cleared to empty.

**Restated (not retired)**
- **AC-967:** was "the site selector lists the store's sites". It now says the displayed site is one the store holds for the selected business, with the slug-keeping and failed-listing behaviour.
- **AC-970:** the toolbar still re-derives on any site change. Its site-dependent example is now the "open in a new tab" link, a business switch counts as a site change, and no mode's toolbar offers a site selector.
- **AC-974:** the selected business is remembered, and a remembered business the account can no longer use falls back silently to one it can, with the saved value rewritten.

**Added**
- **AC-2143:** the header holds the switcher and the avatar; there is no account tab and no toolbar site selector. With one business the switcher shows just the name; lapsed businesses are listed but can't be chosen.
- **AC-2144:** `GET /api/businesses` returns the account and its businesses, with lapsed ones included and marked. It says nothing about other accounts' businesses, has a single-business fallback when there is no identity, and is never cached.
- **AC-2145:** one switch moves every request's URL prefix, the displayed site and its frame, the assistant session and the Library.
- **AC-2146:** with nothing selectable, the switcher is disabled and the tabs and panels are inert, but the header stays usable. An alert banner names the state and no site list is requested.
- **AC-2147:** the account screen states each lapse reason in words; the switcher keeps only the short suffix.
- **AC-2148:** no "tenant" text in the builder or public site, except SQL and deployment names like `TENANT_ID`; the schema keeps `tenant_id`.

**Contradictions:** I found none between the code and the REQ-179/REQ-180 intent, so nothing is flagged for code fixes.

**Sync:** each ticket write tried to reach github.com over SSH and the sandbox blocked it. The changes are saved in the local ticket store but have not been pushed.
