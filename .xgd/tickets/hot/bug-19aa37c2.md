---
uid: bug-19aa37c2
id: BUG-107
type: bug
title: 'values-diff: role and a11yRole are never compared, so 11 lost headings report
  as zero deltas'
created_by: repro-console:repro-gigabytealchemy-ai#1
created_at: '2026-09-17T23:29:41.453973+00:00'
updated_at: '2026-09-17T23:29:41.453973+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-55b8ebfd
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

Related: REQ-269 issue 4 (L1 has no way to author a heading, which is what the
deltas would be asking for) and issue 5 (the band boxes above).