---
uid: report-350f9aea
id: REPORT-1860
type: report
title: 'Reconciliation Plan: REQ-135 phase A — a text run''s typography, editable
  from its segment'
created_by: xgd
created_at: '2026-08-12T18:00:46.603366+00:00'
updated_at: '2026-08-12T18:00:46.603366+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_plan
  subject_uid: request-a8ccd0dd
  anchor_uid: request-a8ccd0dd
  items:
  - index: 1
    component: Structured copy editing — the write path (derivation + axis write)
    item_type: upgrade
    story_points: 3
    dependencies: []
    description: The one validated, atomic write path now answers a text region with
      its words AND the run's typography — size, weight, italic, capitalisation —
      and writes those into the node's axes. The field vocabulary widens from {string,
      enum} to {string, enum, integer, boolean}; the write side gains a per-descriptor
      type check, an inclusive range check that binds a change but never the status
      quo, a refusal for locked fields, and the proportional rewrite of the responsive
      fontSizePx track. Weight and italic are closed against the document's declared
      faces (l1Document.resources.fonts), supplied to the derivation by the CLI exactly
      as the asset listing is.
    justification: 'STORY-100 already owns field derivation, the change map, per-field
      refusal and atomicity for this surface — this is the same function (copyFieldsOf)
      and the same write (applyCopyFields) gaining one more answer, with no new command,
      route or write path. It is therefore an extension of an existing capability
      bucket, not a new one. But the story as written is actively WRONG about this
      behaviour in three places: AC-980 says a copy region exposes ''one plain-text
      field''; AC-991 says every control is ''either plain text or a pick from a list'';
      AC-988 says a non-text value is refused. Its declared non-goals also list ''Text
      properties (size, colour, weight, family)''. Six FC UATs in tests/test_UAT_FC_REQ-135_text_properties.test.ts
      document the new behaviour and have no AC.'
    story_uid: null
    target_story_ids:
    - story-37a3921b
    intent_delta_summary: STORY-100 stops claiming a copy region exposes only its
      words. It exposes its words FIRST, and the run's typography beside them. The
      field vocabulary grows by two more shapes — a bounded integer and a boolean
      — both strictly narrower than a free string, so the raw-code guarantee is unweakened.
      The write side stops assuming every value is a string, learns that an axis can
      be responsive (so a size edit rewrites a whole track), and gains a bound that
      binds a change and never the status quo. Colour (a run's `color`) and family
      remain out of scope — phase B, blocked on REQ-133's palette control — as does
      per-run restyling inside a passage.
    acceptance_criteria_changes:
      add:
      - Asking a copy region what it exposes returns its words first and the run's
        typography beside them — size where the run declares one, weight where the
        site offers more than one, italic, and capitalisation — each a closed or bounded
        control derived from the node and the document's declared faces, including
        for a run inside a behavior module's presentation slot, whose faces come from
        the page's own document because that is where the faces are served from.
      - 'Resizing a run scales every keyframe of its responsive size ladder by the
        same ratio: the edit moves the whole rule the fold measured rather than writing
        the representative value alone (which the track would then outvote at every
        width it covers) or flattening the track (which would delete the narrow-viewport
        keyframe).'
      - The weights offered for a run are the faces the site actually declares for
        that run's family — matched on the first family of its CSS stack, not the
        stack whole — in union with the weight the run already carries, so a run set
        in an undeclared weight is never re-weighted merely by opening its form and
        saving something else.
      - Italic is offered read-only only on positive evidence of absence — the family
        declares faces and none of them is italic — while a family declaring no faces
        at all keeps a live control; a value posted for a read-only field is refused
        rather than applied.
      - 'The size bound binds a change and never the status quo: a value equal to
        what the region reported is accepted whatever it is, so a run captured outside
        the range survives being opened and re-saved, while a new value outside the
        range is refused at the field naming the bound rather than silently clamped.'
      - A typography edit writes into the parameters the run already carries and disturbs
        no other axis; setting a field back to its initial value removes the parameter
        rather than writing the default in; and a change map that changes nothing
        is reported as changing nothing rather than producing a diff.
      modify:
      - 'AC-980 — ''Asking a copy region what it exposes returns one plain-text field
        carrying the words currently in the draft'': the words are still there and
        still first, but they are no longer the only field. Narrow the claim to what
        it is about — the copy field leads the list and carries the draft''s words
        — and let the new derivation criterion own the rest.'
      - 'AC-991 — ''No edit through this surface can produce raw HTML or CSS: every
        control is either plain text or a pick from a list the surface itself supplied'':
        the vocabulary now also holds a bounded whole number and a boolean. The claim
        strengthens rather than weakens — both are narrower than a free string — but
        the enumeration in the criterion is stale and must name all four shapes.'
      - 'AC-988 — ''A change map naming a field the region does not have, a value
        that is not text, or a choice the region never offered, is refused rather
        than ignored'': ''not text'' is no longer the test. Each value is checked
        against its own descriptor''s declared type, so a boolean posted for a number
        and a number posted for a string are both refused at the field.'
      remove: []
  - index: 2
    component: In-page copy editing — the dialog's two forms
    item_type: upgrade
    story_points: 2
    dependencies:
    - 1
    description: 'The click-to-edit dialog now builds two forms from one field list,
      split by descriptor type: the words stay in the dressed box that mirrors the
      page''s own presentation, and the run''s parameters mount in a labelled sheet
      beneath it. Both stage into one save and one dirty state. The auto-open affordance
      is recounted over the box''s fields so clicking words still puts the cursor
      in the words now that a run also exposes four parameters, and the sheet is height-bounded
      so Save stays reachable however many parameters a later phase adds.'
    justification: STORY-101 owns the gesture, the dialog and how a descriptor becomes
      a control — including the existing by-descriptor-never-by-region-kind split
      that routes an image field to a grid. This is the same split gaining a second
      branch, so no new capability bucket is introduced and no parallel dialog exists.
      Two of its criteria are now false as written (AC-1044 counts the whole schema;
      AC-1039 asserts no label column anywhere in the modal), and one FC UAT — words_sit_in_the_box_and_parameters_sit_beneath_it
      — has no AC.
    story_uid: null
    target_story_ids:
    - story-3bf94bd4
    intent_delta_summary: The dialog stops being one form. It is the dressed box for
      the words plus a quiet parameter sheet for everything else, split on the descriptor's
      type rather than on the field's name or the region's kind — so the day a segment
      exposes a second string or a second parameter, neither branch needs an edit.
      Two existing criteria that were true when a copy region had exactly one field
      are rescoped to the box rather than relaxed. Text colour and panel background
      stay out of scope (phase B).
    acceptance_criteria_changes:
      add:
      - A run's words open in the dressed editing box while its typography opens in
        a separate sheet beneath it — the split decided by the kind of control the
        field declares, never by the region's kind or the field's name — and the two
        forms stage into one save and one unsaved-changes state, with the sheet bounded
        so the confirm control stays reachable however many parameters the region
        exposes.
      modify:
      - 'AC-1044 — ''A form with exactly one field opens in its control, ready to
        type; a form with more opens none'': the count is now taken over the box''s
        fields alone. The affordance being preserved is that clicking words puts the
        cursor in the words, and a run that also exposes four parameters is still
        one field of words — counting the whole list would have silently retired the
        affordance the day typography landed.'
      - 'AC-1039 — ''The fields form drops its heading and label column while keeping
        both accessible names'': the dropped label column is scoped to the box, where
        a label reading ''Text'' beside the words themselves was the redundancy the
        criterion was about. The parameter sheet is the opposite case and keeps its
        labels, because a bare number is meaningless unlabelled.'
      remove: []
---

# Reconciliation Plan — REQ-135 phase A

**Mode**: commits
**Anchor**: request-a8ccd0dd (REQ-135, an intent ticket — used directly as the subject)
**Commit**: `35f0cb9015216e5b4b9aa3f8cd9bdceb623a9b92` (on this branch as `eba1c3385`), *feat(editor): a text run's typography is editable from its segment [FREE-CODED]*

## Intent (step 0)

REQ-135 §6 declares a V1 field set split into two phases. **Phase A — typography — is what landed**: size, weight, italic, capitalisation, with no palette dependency. **Phase B — colour** (a run's `color`, a panel's `surfaceFill`, the escalation row of §2) **is explicitly blocked on REQ-133** and is not in this commit. The ticket's §9 records exactly what shipped, and §9.1–§9.3 record three amendments made against measured data rather than reasoning. Those amendments are binding on the matrix:

- **§9.1** — `axes.fontFamily` is a full CSS stack, `resources.fonts[].family` is a bare name, so the face match is on the *first family of the stack*. A whole-string comparison would have withdrawn the weight control from the entire site, silently.
- **§9.1** — the weight a run already holds is usually *not* a declared face (10 of `xgd/home`'s 62 runs are weight 600, undeclared), so the option list is the union, and the union is the common case rather than a corner.
- **§9.2** — italic locks **only on positive evidence of absence** (the family declares faces and none is italic). §5's original "locked where no italic face is declared" would have disabled a working control on a family painted by the reader's own system font.

The implementation footprint matches the declared scope (step 3b, case 1) with one declared exception: **case 2**, §9.3's amendment of eleven assertions across nine earlier suites, which is explicit supersession of prior intent and is handled as `modify` entries below rather than as new claims.

## Behavior Inventory

```yaml
behavior_inventory:
  source: "free-coded commit 35f0cb90 (REQ-135 phase A)"
  entry_files:
    - "packages/site-schema/src/l1/edit.ts"
    - "tools/generate/src/cli/edit.ts"
    - "apps/control-app/src/builder/editor.js"
    - "apps/control-app/src/builder/builder.css"
  features:
    - name: "copyFieldsOf — a text segment's typography"
      description: >
        A text node now derives four parameters beside its copy field, which stays
        first in the list. Size appears only where the run declares one (a run that
        inherits has no base to scale and no honest number to show). Weight appears
        only where more than one option exists (a select holding its only value is a
        label that looks like a control). Italic and capitalisation always appear.
      behaviors:
        - "L1FieldDescriptor.type widens to 'string' | 'enum' | 'integer' | 'boolean'"
        - "L1FieldDescriptor gains min/max (advisory in the widget, enforced on the write side) and locked"
        - "L1SegmentFields.values widens from Record<string,string> to Record<string,L1FieldValue> (string|number|boolean)"
        - "L1SegmentFieldOptions gains `fonts` alongside `assets` — a property of the document, not the node"
        - "italic is a boolean projection of the two-valued fontStyle axis; textTransform is an enum because a checkbox over four values would destroy `capitalize`"
      entry_point: "copyFieldsOf / typographyFields"
    - name: "Face matching against the document's declared fonts"
      description: >
        Weight options and the italic lock are closed against resources.fonts,
        matched on the FIRST family of the run's CSS stack; the weight list is the
        union of declared weights and the run's current weight; italic is locked only
        when the family declares faces and none is italic.
      behaviors:
        - "primaryFamily() splits the stack, strips quotes, lowercases"
        - "weightChoices() = declared weights ∪ {current}; a face with no weight contributes nothing"
        - "lockedItalic = faces.length > 0 && no face has style === 'italic'"
      entry_point: "primaryFamily / facesFor / weightChoices / typographyFields"
    - name: "applyCopyFields — validation of a typed change map"
      description: >
        Per-descriptor type checking replaces the blanket string check; a range check
        that passes any value equal to what the derivation reported; an outright
        refusal for a locked field.
      behaviors:
        - "typeError(): boolean must be boolean, integer must be a whole number, enum must be a member, otherwise string"
        - "rangeError(): skipped entirely when value === the derived current value — the bound binds a change, never the status quo"
        - "a locked field is refused with a field-scoped message before any write"
        - "out-of-range values are refused, never clamped"
      entry_point: "applyCopyFields / typeError / rangeError"
    - name: "writeTypography — the axis write"
      description: >
        Writes into the node's EXISTING axes bag; scales the responsive fontSizePx
        track by the same ratio as the axis; deletes an axis rather than writing a
        CSS initial value; reports per-field whether anything actually changed.
      behaviors:
        - "scaleTrack(): every keyframe × (to/from), rounded to 2dp; the segments (interpolate/snap flags) are carried through untouched because a uniform scale moves no boundary"
        - "the track moves WITH the axis in one branch — never independently, never after"
        - "italic false on a run with no fontStyle → axis stays absent (a no-op edit must produce no diff)"
        - "textTransform 'none' → the axis is deleted"
        - "assignment into the existing bag, so the run's other ~40 axes survive byte-identical"
      entry_point: "writeTypography / scaleTrack"
    - name: "1c edit — supplying the document's faces"
      description: >
        segmentOptions() fetches per kind: the asset listing for picker kinds, the
        font table for text, nothing for the rest. The faces come from the PAGE's L1
        document even for a node inside a behavior module's slot, because @font-face
        is emitted once per rendered document.
      behaviors:
        - "editCopyGet and editCopySet both pass the resolved page through to segmentOptions"
        - "documentFonts() returns [] when the document declares no resources"
      entry_point: "segmentOptions / documentFonts"
    - name: "The dialog's two forms"
      description: >
        The words stay in the dressed box; the parameters mount as a second
        mountFields instance in a sheet beneath it. Split on descriptor type, not on
        field name or region kind.
      behaviors:
        - "boxFields = type === 'string'; propertyFields = everything else"
        - "stagedValues() and isDirty() merge both instances and the pickers"
        - "close() destroys both instances; both handles are declared before the Escape binding so neither is in the temporal dead zone"
        - "openLoneControl() is counted over boxFields, so clicking words still opens the words"
        - "the sheet is height-bounded (min(38vh,340px)) and takes its type size through the component's --fields-font-size token, so Save stays reachable and the sheet never out-specifies fields.css"
      entry_point: "defaultModal (apps/control-app/src/builder/editor.js)"
```

## Coverage Map

```yaml
coverage_map:
  - feature: "copyFieldsOf — a text segment's typography"
    status: partial
    existing_stories: ["story-37a3921b (STORY-100)"]
    existing_acs: ["AC-980", "AC-991"]
    gaps:
      - "AC-980 asserts a copy region returns ONE plain-text field — now false"
      - "AC-991 enumerates the control vocabulary as string-or-closed-list — now incomplete"
      - "no AC for which parameters a text run exposes or when each is withheld"
    notes:
      - "Story's declared non-goals list 'Text properties (size, colour, weight, family)'; size and weight must come out, colour and family must stay (phase B)."
      - "Technical Context claims 'the field vocabulary grew by exactly one shape' — stale."
  - feature: "Face matching against the document's declared fonts"
    status: uncovered
    existing_stories: ["story-37a3921b (STORY-100)"]
    existing_acs: []
    gaps:
      - "nothing in the matrix describes a closed list derived from the document rather than from the asset store"
      - "the stack-vs-bare-family match and the union-with-current rule are the two things that decide whether the control appears at all"
    notes:
      - "Directly analogous to AC-1025 (a region's current image is always among its options) — the same correctness rule, a different axis."
  - feature: "applyCopyFields — validation of a typed change map"
    status: partial
    existing_stories: ["story-37a3921b (STORY-100)"]
    existing_acs: ["AC-988", "AC-983", "AC-984", "AC-985"]
    gaps:
      - "AC-988 says 'a value that is not text' — the test is now per-descriptor"
      - "no AC for a bound that binds a change and not the status quo"
      - "no AC for refusing a locked field"
    notes:
      - "Atomicity, the refusal shape and the whole-definition validator (AC-983/984/985/986) are unchanged and need no edit — the new refusals travel the existing path."
  - feature: "writeTypography — the axis write"
    status: uncovered
    existing_stories: ["story-37a3921b (STORY-100)"]
    existing_acs: ["AC-1027", "AC-1046"]
    gaps:
      - "the responsive-track rescale has no analogue anywhere in the matrix — this is the first edit whose value is a rule rather than a scalar"
      - "absent-is-the-default (an un-set field deletes its axis) is unstated"
    notes:
      - "AC-1027/AC-1046 already assert 'every other parameter survives untouched' for images and backgrounds; the same claim for an axis write is close kin but not implied by them, since those write a scalar handle and this mutates the axes bag in place."
  - feature: "1c edit — supplying the document's faces"
    status: partial
    existing_stories: ["story-37a3921b (STORY-100)"]
    existing_acs: ["AC-989"]
    gaps:
      - "a run inside a module slot takes its faces from the PAGE's document — unstated"
    notes:
      - "Folded into the derivation criterion rather than given its own: it is a property of where the option list comes from, and AC-989 already owns slot-scoped resolution."
  - feature: "The dialog's two forms"
    status: partial
    existing_stories: ["story-3bf94bd4 (STORY-101)"]
    existing_acs: ["AC-1044", "AC-1039", "AC-1040", "AC-1043", "AC-997"]
    gaps:
      - "AC-1044 counts the whole schema — now false for a text run"
      - "AC-1039 asserts no label column in the modal — now scoped to the box"
      - "no AC for the box/sheet split or for it being decided by descriptor type"
    notes:
      - "AC-997 (one confirmed form is one change, however many fields) already covers the merged staging across two instances — no edit needed."
      - "AC-1040/AC-1042 (the box mirrors the copy's typography, size clamped) are about the box and are untouched."
  - feature: "Assertions narrowed in nine earlier suites (§9.3)"
    status: covered
    existing_stories: ["story-3bf94bd4", "story-37a3921b", "story-c-composition/REQ-129 suites"]
    existing_acs: ["AC-990", "AC-1024", "AC-1045", "AC-994"]
    gaps: []
    notes:
      - "Each amended assertion was narrowed to the claim its own AC is about — 'the copy field is first and holds the words' — rather than relaxed, so the owning criteria remain true as written and need no reconciliation. The two exceptions (AC-1044, AC-1039) are handled as modify entries on item 2."
```

## Plan Items

| # | Component | Type | Points | Deps | Target | Description |
|---|-----------|------|--------|------|--------|-------------|
| 1 | Structured copy editing — the write path | upgrade | 3 | – | story-37a3921b (STORY-100) | A text region answers with its typography beside its words, and the write path applies it: a typed change map, a bound that binds a change, a locked field refused, and a size edit that rescales the whole responsive ladder. **+6 ACs, 3 modified.** |
| 2 | In-page copy editing — the dialog's two forms | upgrade | 2 | 1 | story-3bf94bd4 (STORY-101) | The words in the dressed box, the parameters in a sheet beneath it, split by descriptor type; the auto-open affordance recounted over the box. **+1 AC, 2 modified.** |

No `feature` items. Every behaviour in this commit is an extension of a capability bucket that already exists — the same derivation function, the same write path, the same dialog — which is what the commit message means by *no new command, no new route, no new value vocabulary*.

## FC Test Evidence

The dispatcher reported `fc_tests: []`, which is a **false negative**: the harness globs `test_UAT_FC_<TICKET>_*.py` and this project's suites are TypeScript. `tests/test_UAT_FC_REQ-135_text_properties.test.ts` exists on disk and carries seven FC UATs. All seven are covered by the two items above and would otherwise have tripped `check_fc_orphans` at review:

| FC UAT | Item |
|---|---|
| `a_text_run_offers_its_type_beside_its_words` | 1 (add #1) |
| `resizing_a_run_scales_its_whole_responsive_ladder` | 1 (add #2) |
| `weight_offers_the_declared_faces_and_the_runs_own_value` | 1 (add #3) |
| `italic_is_locked_only_where_the_sites_font_has_no_italic_face` | 1 (add #4) |
| `the_size_range_binds_a_change_and_not_the_status_quo` | 1 (add #5) |
| `a_type_edit_disturbs_no_other_axis_and_a_no_op_writes_nothing` | 1 (add #6) |
| `words_sit_in_the_box_and_parameters_sit_beneath_it` | 2 (add #1) |

Eight further FC files remain on disk from earlier tickets (REQ-122 ×3, REQ-126, REQ-127 ×2, REQ-129, REQ-130). They are **not** this reconciliation's business and no item here claims them; flagged only because `check_fc_orphans` may not distinguish them from REQ-135's.

## Observations

- **Two stories, not one, and the seam is the existing one.** The commit touches both sides of a boundary the matrix already draws: what a region exposes and how a change is applied (STORY-100 / CAP-86) versus how a descriptor becomes a control the operator touches (STORY-101 / CAP-87). STORY-101's own Technical Context states it *owns none of* derivation, validation or atomicity. Splitting along that line keeps each criterion provable where it is observable — six of the seven FC UATs drive the real `1c` CLI, and the seventh inspects the real `defaultModal`.
- **Both items are upgrades, and the classification is not marginal.** No new command, route, endpoint or value vocabulary appears in the diff; `copyFieldsOf` gains one branch and `applyCopyFields` gains one. A feature item here would create a parallel story describing the same function twice.
- **Three existing criteria are false as written, not merely thin.** AC-980, AC-991 and AC-1044 each state something the code no longer does. Reconciliation must modify them rather than add beside them, or the matrix will assert both a claim and its negation. This is the main reason item 1 is 3 points rather than 2.
- **The responsive-track rescale is the criterion this ticket lives on.** It is the first edit through this surface whose value is a *rule* sampled at six widths rather than a scalar, and both cheap implementations are silently wrong: writing the axis alone leaves the track outvoting it at every width it covers, and flattening the track deletes the narrow-viewport keyframe. It is load-bearing on 14 of `xgd/home`'s 62 runs.
- **Three criteria exist only because real data contradicted the plan** (§9.1–§9.2): the first-family-of-the-stack match, the union-with-the-run's-own-weight, and the positive-evidence-of-absence lock. Each guards a *silent* failure — a control that vanishes site-wide, a heading that re-weights itself on an unrelated save, a working control disabled — so each needs its own criterion rather than being folded into "weight is a closed list".
- **The nine amended suites are supersession, not drift** (step 3b, case 2). REQ-135 §9.3 declares the amendment and the diff shows each assertion narrowed to its own AC's claim rather than deleted or relaxed. Two went further and are captured as modify entries on item 2; the other seven leave their owning criteria true as written, so no item absorbs them.
- **Nothing in the diff exceeds the declared intent** (step 3b, case 3 does not arise). Every changed file is named in REQ-135 §9, and phase B — text colour, panel `surfaceFill`, the escalation row — is absent from the commit exactly as the ticket says it should be. No item here describes colour.
- **Uncertainty worth recording.** The size field is withheld from a run that declares no size, and the weight field from a family offering fewer than two options. §9.1 reports the first guard never fires on measured data. Both are real code paths and both are named in the derivation criterion, but neither has FC evidence; the UAT generation step should decide whether they warrant assertions of their own or belong as clauses of the derivation UAT.
