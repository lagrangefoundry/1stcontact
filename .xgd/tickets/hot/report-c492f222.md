---
uid: report-c492f222
id: REPORT-1469
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-08-06T20:53:07.402863+00:00'
updated_at: '2026-08-06T20:53:07.402863+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-0385746c
  plan_item_index: '4'
---

Verified against the code and the intent. Both facts I checked empirically changed the wording: `themeTokensSchema` is not `.strict()`, so a leftover `theme.palette` is **stripped on parse, not rejected** (the layer treatments *are* strict and do reject) — AC-935 states it that way rather than the plan's blanket "no site definition declares one, no layer names a role". I also scoped the no-`--color-*` claim to stylesheets the renderer emits, because `storage/sites/gigabytealchemy/draft/assets/blog.*.css` is a mirrored third-party asset that carries its own `--color-*` and is site content, not capability surface.

```
Upgrade mutations applied for plan item 4 of 6

Target Stories: story-d0a8cfad
Primary Story UID: story-d0a8cfad
Stories Modified: 1
ACs Modified: 0
ACs Added: 4
ACs Removed: 0

tickets_modified:
  stories:
    - "story-d0a8cfad"   # STORY-83
  acceptance_criteria:
    modified: []
    added:
      - "acceptance_criterion-848c4e4b"   # AC-933 no colour custom property; exactly one colour system
      - "acceptance_criterion-6b89d5fb"   # AC-934 page background + inherited text colour are document fields
      - "acceptance_criterion-0867579f"   # AC-935 no closed colour-role vocabulary survives
      - "acceptance_criterion-557026d4"   # AC-936 non-colour token groups untouched
    removed: []

Progress: 4 of 6 plan items complete
```

**What changed and why**

- **STORY-83 body** gained a Description section — *"Page colour is the document's, and there is exactly one colour system"* — covering the document's `background`/`textColor` fields, the inherit-as-floor rule, and the deletion of the token colour group, the layer colour-role enum, the dark-mode override and the module-side role resolvers. In-scope now names the page-level document fields and the one-colour-system guarantee; out-of-scope explicitly cedes the colour *value model* to STORY-80 and the `1c colors` tooling to item 5, so items 3/4/5 don't overlap.
- **Technical Context** records seven things: why the guarantee is a negative asserted here rather than the ticket's one-off grep; that the deleted palette had **no surviving AC** (so nothing was removed — the plan's finding, re-verified by reading all 30 existing criteria); that the dark-mode override was confirmed callerless before deletion; what the module-side cut actually narrowed (a module colour is now hex-literal-only, non-literals dropped fail-closed, callout bar → `currentColor`); and two footprint facts — revision snapshots legitimately still carry `theme.palette` (immutable history), and the mirrored-asset caveat above.
- Also noted: `1stcontact` and `harbor-cafe` end up with **no** palette at all, which is the optional-palette model working rather than an incomplete retrofit.

**Verification performed:** read the three commits' diffs across `tokens/`, `site-schema/schema.ts`, `l1/schema.ts`, `l1/render.ts`, `modules/{dials,text-style,markdown,validate}`, and `tools/generate/render.ts`; confirmed all four draft `site.json` files carry no `theme.palette` (two carry a new `site.palette`, two carry none); confirmed a text leaf declaring no colour emits no `color` declaration (render.ts:1774); ran a throwaway strictness probe against the real schemas and deleted it. Working tree is clean — no runtime code touched.
