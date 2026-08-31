---
uid: report-b523f22d
id: REPORT-2906
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-08-31T11:07:02.034513+00:00'
updated_at: '2026-08-31T11:07:02.034513+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-b3b7c399
  plan_item_index: '5'
---

All mutations landed and verified. Stage 4 checks pass: no new story ticket was created (the only stories under this bundle remain STORY-120/121 from plan items 1–2), no runtime code was touched, and every change is confined to `story-179b8c06` and its ACs.

**What I aligned to, and what I found:**

The intent (REQ-148, §2 "Status: settled") is explicit that the mechanism is *removal, not precompilation* — the components become plain `(props) => string` functions, which deletes the container factory, the injected resolver seam, the `needsAstro` branch, the node-only render wrapper and the CSS scanner. The code matches: `registry.ts` binds two plain functions, `worker.ts` exports `getModule` from the portable entry, and `render.ts` names it statically with no container anywhere.

Two judgment calls worth flagging:

- **AC-810** described a scanner that no longer exists (the two `<style>`-shaped footguns). Rather than archive it, I rewrote it around the guarantee that survives and is now stronger: chrome is a real `styles.css` read whole into a committed artifact, so component source cannot reach the stylesheet at all, plus the drift re-extraction pin. The plan's `remove` list was empty and stays empty.
- **The plan asked me to assert the conformance harness "runs its full set rather than skipping most of it for want of a browser."** The implementation record shows that 5-pass/15-skip → 20/20 improvement came from installing the matching Playwright build, not from this story's code. I wrote AC-704 around what the code delivers — the negative fixtures are plain behavior components mounted through the same injected-resolver path and still discriminate — and recorded the reason for not claiming the skip count in Technical Context.

I also added a third AC beyond the plan's two: **the module's own escaping boundary**. The intent is silent on it (it notes only "a couple of `set:html` fragments"), but the conversion moved a real obligation from the compiler to the module, the code implements it deliberately in `modules/html.ts` with no raw-passthrough helper, and `test_UAT_FC_REQ-148_the_module_escapes_every_value_it_interpolates` is binding evidence in a file this item claims. Per the reconciliation rule for intent-silent gaps, it is formalised now and recorded under `## Reconciliation Decisions` on the story with date and rationale.

```
Upgrade mutations applied for plan item 5 of 11

Target Stories: story-179b8c06
Primary Story UID: story-179b8c06
Stories Modified: 1
ACs Modified: 3
ACs Added: 3
ACs Removed: 0

tickets_modified:
  stories:
    - "story-179b8c06"          # STORY-85
  acceptance_criteria:
    modified:
      - "acceptance_criterion-8d11ea8d"   # AC-722 — component is a plain props-to-markup function; portable catalog; one mechanism, not per-module
      - "acceptance_criterion-bd040305"   # AC-810 — chrome is a real stylesheet, precompiled and drift-pinned
      - "acceptance_criterion-ccefcbab"   # AC-704 — negative fixtures are plain components and still discriminate
    added:
      - "acceptance_criterion-f18b88b5"   # AC-1412 — renders in the edge runtime, serving the component's own bytes
      - "acceptance_criterion-5a9d8baf"   # AC-1413 — edit channel switches the behaviour off in both hosts
      - "acceptance_criterion-e6460efb"   # AC-1414 — module escapes what it interpolates; refuses an unsafe endpoint
    removed: []

Progress: 5 of 11 plan items complete
```
