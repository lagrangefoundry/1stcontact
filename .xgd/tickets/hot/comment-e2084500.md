---
uid: comment-e2084500
id: COMMENT-3942
type: comment
title: Comment on request REQ-302
created_by: xgd
created_at: '2026-09-25T21:47:32.551628+00:00'
updated_at: '2026-09-25T21:47:32.551628+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-edbc7e5f
  kind: note
---

`repro-console:repro-gigabytealchemy-ai#7` — iteration 7 re-measurement of issue 2, the out-of-DOM-order flow siblings repaired with negative leads.

Reference bundle re-captured at `2026-09-25T21:29:23.458Z`, `captureSchema` 6 — **newer** than
BUG-142's `8ecd455d16` (17:14:57Z), BUG-143's `26f5491165` (17:25:37Z) and the merge `1a9983de64`
(20:43:18Z), so everything below is measured against an oracle that post-dates every landed fix.

**Issue 2 is still live, and it is now the only thing on this ticket that the gate can still see.**
It is 20 of the 52 layout findings in
`storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-7/diff/gate.json`, and it has changed
shape: BUG-143's new probe reports it as `escape` rather than `overlap`, and the count fell from
the 93 content-robustness overlaps recorded at iteration 6 to 20 off-sample escapes now.

Tally of `gate.json` `layout.findings` (52, all `kind: "escape"`) by the surface named in `detail`:

| surface | findings | widths |
|---|---|---|
| `card-5` | 20 | 506, 637 |
| `card-3` | 12 | 320, 375, 768, 1024, 1280, 1440 |
| `card-7` | 12 | 320, 375, 768, 1024, 1280, 1440 |
| `section-band-2` | 4 | 320, 375 |
| `section-band-4` | 4 | 320, 375 |

`card-5`'s 20 are this ticket's issue 2. The other 32 are a **different** mechanism — a surface
that owns exactly one run never enters `plan()` at all, so it keeps its pinned one-line height —
and I filed those as REQ-324 rather than here, because nothing about them involves out-of-order
siblings or negative leads.

The `card-5` findings verbatim:

```
at 637px×768px: 'XGD (Extreme Generative Development)' is no longer covered by its backing
  surface card-5 — 16px ABOVE its top edge
at 637px×768px: 'Coming soon' … card-5 — 16px above its top edge
at 637px×768px: '✓' … card-5 — 12px below its bottom edge
at 637px×768px: '✓' … card-5 — 52px below its bottom edge
at 637px×768px: '✓' … card-5 — 92px below its bottom edge
at 637px×768px: 'Designed for developers building AI-enhanced workflows' … — 16px below
at 637px×768px: 'Open source and community-driven' … — 56px below
at 637px×768px: 'Practical tools for modern software development' … — 96px below
at 506px×768px: '✓' … card-5 — 20px below its bottom edge
at 506px×768px: 'Practical tools for modern software development' … — 32px below its bottom edge
```

— and the same ten again at viewport height 1536. Both directions at once, above the top edge and
below the bottom edge of the same panel, is the negative-lead signature this ticket describes.

The negative leads are still in the served document. `1c page get repro-gigabytealchemy-ai home
--sandbox --json`, `card-5`, flowed leaves in emission order at width 1280:

```
'✓'                                     y  204
'Designed for developers building …'    y  200
'✓'                                     y   12
'Open source and community-driven'      y    8
'✓'                                     y   12
'Practical tools for modern software …' y    8
'XGD (Extreme Generative Development)'  y -268
'Coming soon'                           y -268
'AI-powered development methodology …'  y -220
'An open-source platform and method…'   y   16
```

The card's heading is emitted seventh and pulled back 268px to land above the six checklist runs
that were emitted before it. 506 and 637 are `offSampleWidths` inside the 375→768 `snap` segment,
so the recovery holds 375's offsets there while the copy has already reflowed — which is exactly
the failure the ticket's own comment on probes.ts predicts for an interpolated negative offset,
arriving through `snap` instead.

Browser-free reproduction, which now shows it exactly:

```bash
cd /Users/martin/lagrangefoundry/1stcontact
./bin/1c l1-gate --ref storage/references/gigabytealchemy.ai/index --json > /tmp/l1gate.json
python3 - <<'EOF'
import json, re, collections
d = json.load(open('/tmp/l1gate.json'))
for probe in ('onSample', 'offSample', 'contentRobustness'):
    t = collections.Counter()
    for w in d[probe]['byWidth']:
        for f in w['findings']:
            m = re.search(r'backing surface ([\w-]+)', f['detail'])
            t[f['kind'] + ':' + (m.group(1) if m else '-')] += 1
    print(probe, dict(t))
EOF
```

prints `offSample {'escape:card-5': 20, 'overlap:-': 4}` today; right is `escape:card-5` absent.
The escape tallies from this command match `gate.json` surface for surface; its `overlap` counts
are larger only because `1c l1-gate` measures text analytically where the gate supplies measured
heights (the gate reports 0 overlaps this round).

**Status of the ticket's other issues, re-measured.** Issue 1 (`width: auto` stretching flow-placed
runs to the container) is confirmed landed: no run in `actual-manifest.json` is wider than its
reference counterpart — a full pairwise sweep of the two manifests finds 23 elements differing in
x and **zero** differing in width. Issue 4 (the hero scrim's alpha) is unchanged and still live:
4 LOW `surfaceFill` deltas, `#030717` expected vs `#a39e9b` actual, severity 1060.363100579612
each, on `"Gigabyte Alchemy"`, `"Intentional Software"`, `"Tools for clarity, presence, and
positive connection"` and `"We're a software studio building technology to elevate—no…"` —
identical to what REQ-308 appended, so I am not re-deriving it.

**New this round, filed as REQ-324, and it touches this ticket.** `promoteToFlow` measures a flow
lead from the parent's border box rather than its content box, so every run inside a panel with a
`borderLeft` lands `borderLeft.widthPx` too far right: 23 CRITICAL `position` deltas of exactly
+4px in x, 100% of the 21294.82 ranked region score. `card-5` carries `borderLeft: {widthPx: 4}`,
so eight of the runs listed above are currently 4px right of where the reference paints them in
addition to escaping their panel at 506 and 637. The two are independent — one is an x offset at
every width, the other a y placement at two off-sample widths — but a fix to this ticket's issue 2
will be measured against a card whose runs are still 4px out until REQ-324 lands.
