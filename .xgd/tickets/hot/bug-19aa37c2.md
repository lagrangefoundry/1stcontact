---
uid: bug-19aa37c2
id: BUG-107
type: bug
title: 'values-diff: role and a11yRole are never compared, so 11 lost headings report
  as zero deltas'
created_by: repro-console:repro-gigabytealchemy-ai#1
created_at: '2026-09-17T23:29:41.453973+00:00'
updated_at: '2026-09-20T18:41:22.844035+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-55b8ebfd
  commits:
  - working_sha: 5b7f6c5882d4a4445fbe1f9967a6d4fb774589cc
    reconcile_sha: null
    main_sha: null
  - working_sha: 3fac6aaa80f3a37f6159d215714e8b326c9ce2db
    reconcile_sha: null
    main_sha: null
  version: 0.2.249
  story_points: 3
---

`values-diff` compares a fixed parameter table per object kind, and no kind's
table includes `role` or `a11yRole`. A reproduction can therefore lose every
heading and every link on the page and the report still says `deltas: []`.

Found while diagnosing loop-1 iteration 1 of `repro-gigabytealchemy-ai`
(the gap ticket is REQ-269; this bug is why its issue 4 is invisible to the
instrument).

## Evidence

The two manifests of that round disagree on `a11yRole` for **13** paired
elements:

```
storage/.../iteration-1/diff/expected-manifest.json   generic 40 | heading 11 | textbox 4 | button 2 | link 2
storage/.../iteration-1/diff/actual-manifest.json     generic 60 | textbox 4  | button 2
```

The 11 headings — `A Different Approach`, `Our Mission`, `Presence`,
`Positivity`, `Connection`, `What We're Building`, `Sanctum Voice`,
`XGD (Extreme Generative Development)`, `What We're Exploring`, `The Alchemy`,
`Get in touch` — each go `role: heading|subheading -> body`,
`a11yRole: heading -> generic`. The two links (`LinkedIn`, `GitHub`) go
`role: link -> body`, `a11yRole: link -> generic`.

`values-diff.json` for the same pair reports `"deltas": []`, `matched: 59`,
`unmatched: 0`.

`a11yRole` is not an incidental field: it occurs 59 times in that bundle's
`capture.json` and 413 times in its `multistate.json`, and DOC-53 §1.1 names it
as one of the rendered facts capture deliberately does record ("a painted box, a
computed radius, the browser's own a11y role and name").

## Cause

`tools/generate/src/cli/capture/values-diff.ts:1816–1821`:

```ts
const KIND_PARAMS: Record<ObjectKind, string[]> = {
  text: ['fontFamily', 'fontSizePx', 'fontWeight', 'color', 'letterSpacingPx', 'lineHeightPx', 'renderedTextBox', 'box'],
  image: ['name', 'objectFit', 'aspect', 'box'],
  control: ['name', 'nameSource', 'placeholderColor', 'box'],
  divider: ['box'],
}
```

and `PARAM_PROPS` (`:1830`) has no role entry, so no `DeltaProperty` exists for
it and `diffManifests` never raises one.

## While there — painted boxes are reported as unpaired *controls*

`objectKindOf` (`values-diff.ts:1803–1808`) buckets any textless element that is
not `img` and not `separator` as a `control`. In this round the reproduction's
seven section band boxes land in `unpairedActual` as

```json
{ "label": "(generic)", "role": "generic", "kind": "control" }
```

x7 — they are painted boxes at `(0,0) 1280x800 #030717`, `(0,800) 1280x488
#e8dfd3`, `(0,1288) 1280x594 #d9ccba`, `(0,1882) 1280x1257 #e8dfd3`,
`(0,3139) 1280x549 #d9ccba`, `(0,4260) 1280x116 #0f172b` and the hero backdrop.
A reader is told the reproduction has seven unpaired form controls.

## Proposed fix

- Diff `a11yRole` as a first-class property. A role change is a semantic
  regression even when no pixel moves, and it is the only signal that a
  reproduction has lost the page's document outline.
- Add a `box`/`surface` bucket to `objectKindOf` so a painted textless box is
  not presented as a control.

## What was built

**1. `a11yRole` is a first-class diffed property.** A new `semantics` delta kind
holds it, tiered **HIGH** and leading the HIGH band. HIGH rather than CRITICAL
because CRITICAL is reserved for a diff that cannot be trusted (`viewport`),
content that is absent (`presence`, `text`), or structure that visibly
re-composed (`arrangement`, `containment`) — a role regression is none of those.
It ranks above every tonal and treatment axis because it is structural, and it
is **Type A**: a role is authored (emit a heading element), so the repair is to
copy the reference's value into place, not to measure a residual.

Compared on the text pass only. A text-free field *joins* on `a11yRole` (it is
the pairing queue's key), so comparing it there could only ever report equality.
Guarded on both sides carrying the field, so a manifest captured before the role
existed stays inert rather than reporting every one of its runs as a regression.

**2. `headingLevel` is compared alongside it.** A technical consequence of (1)
rather than a separate ask: `a11yRole` reports the single word `heading` for all
six tags, so an `h2` reproduced as an `h4` agrees on the role word while building
the wrong outline — exactly the class of loss this ticket is about, and the next
one to go silent once (1) lands. Same `semantics` kind; the `property` still
distinguishes "wrong role" from "right role, wrong depth". Compared only when
both sides recorded a level (absent on every non-heading and on pre-REQ-269
bundles).

**3. The role is a row on the object card**, leading the `text` parameter table
ahead of the typography that merely dresses the run. The card is the primary
human read, so a lost heading has to be visible there and not only in the flat
list.

**4. `box` is a new `ObjectKind`,** and `objectKindOf` now decides `control` from
a positive set of interactive a11y roles (textbox, button, checkbox, link, …)
rather than by falling through to it. The old default was the inverse — anything
textless that was not an image or a separator was a control — which is why seven
painted bands were reported as seven unpaired form controls. An unrecognised
explicit `role=` on a painted div now reads as a box, which is the safe
direction.

**5. A `box` card reports its painted fill and background image** (`surfaceFill`,
`backgroundImage`, `box`) — a band has no name and no typography; its fill is its
whole visible substance. That required extending the `surfaceFill` comparison to
the textless pass, where it had never run: the fill was only ever compared where
a *text run* sat on top of it, so a textless band painted the wrong colour
reported its geometry, matched, and said nothing. Without this the new row would
have rendered a value it never checked — the same defect this ticket is about, in
a new place.

**6. A stale assertion in `tests/req51-object-grouped-report.test.ts` is
corrected.** `placeholderColor` joined the control parameter table with REQ-265
and that test stayed pinned to the pre-REQ-265 list, so it had been red on a
clean tree since. Fixed here because this change edits the same table and would
otherwise leave a red test that reads as its own.

## How to see it, and how to know it is fixed

```
ITER=/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-1

python3 -c "import json;from collections import Counter
for f in ['expected-manifest.json','actual-manifest.json']:
    d=json.load(open('$ITER/diff/'+f))['elements']
    print(f, Counter(x.get('a11yRole') for x in d))
v=json.load(open('$ITER/diff/values-diff.json'))
print('deltas:', len(v['deltas']), '| unpairedActual:', v['unpairedActual'][:1])"
```

**Wrong result (now):** the reference counter has `heading: 11, link: 2`, the
reproduction's has neither, and `deltas: 0`; `unpairedActual[0]` is
`{'label': '(generic)', 'role': 'generic', 'kind': 'control'}`.

**Right result (fixed):** the same manifests produce 13 `a11yRole` deltas
naming each heading and link, and the unpaired band boxes are reported as boxes.

**Measured after the fix**, re-diffing those exact two manifests:

```
deltas 13 {"a11yRole":13}
unpaired kinds box,box,box,box,box,box,box
A Different Approach: heading->generic   … (11 headings)
LinkedIn: link->generic
GitHub:   link->generic
```

## Test plan

`tests/test_UAT_FC_BUG-107_semantic_role_diff.test.ts` — pure, browser-free,
manifests built in code:

- a lost heading and a lost link each raise one `a11yRole` delta, and the body
  run whose role agreed raises none (the axis adds no noise); each delta is
  `HIGH` / `semantics` / Type `A`
- the role is the first row on the text object card, flagged, and reaches
  `formatReport`; a run with the right role keeps `deltaCount: 0`
- the axis is inert when either side never captured the role
- `h2 -> h4` raises a `headingLevel` delta when the role word agrees; equal
  depths raise none
- an unpaired painted band reads as `box`, while a `textbox` still reads as
  `control`
- a `box` card carries `['surfaceFill', 'backgroundImage', 'box']`, flags a
  wrong fill and raises a `surfaceFill` delta; an equal fill raises none

Regression scope: the 22 suites that exercise `diffManifests` (req31/35/47/48/
51/53/56/58/59/62/63/265, bug15/20/22/27/102, REQ-269, the reconcile-values-diff
set) — all green, plus the REQ-265 assertion above repaired.

Related: REQ-269 issue 4 (L1 has no way to author a heading, which is what the
deltas would be asking for) and issue 5 (the band boxes above).