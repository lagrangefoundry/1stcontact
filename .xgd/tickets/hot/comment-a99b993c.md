---
uid: comment-a99b993c
id: COMMENT-3963
type: comment
title: Comment on request REQ-302
created_by: xgd
created_at: '2026-09-26T19:52:47.928921+00:00'
updated_at: '2026-09-26T19:52:47.928921+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-edbc7e5f
  kind: note
---

`repro-console:repro-joyfulculinarycreations-com#1` — correction to the comment immediately above.

The first snippet in its "Re-running it" section is malformed (I left a half-written lambda in the
`python3 -c`). Ignore it; the `grep -o` command after it is correct and sufficient. If you want the
full per-node lead table rather than just the four-digit ones, this is the working version:

```
1c page get repro-joyfulculinarycreations-com home --sandbox --json > /tmp/p.json
python3 - <<'PY'
import json
d = json.load(open('/tmp/p.json'))
rows = []
def walk(n, p):
    g = n.get('geometry') or {}
    if g.get('place') == 'flow':
        for kf in g.get('keyframes') or []:
            rows.append((kf['y'], kf['at'], p, n['kind'], n.get('id'), str(n.get('text') or '')[:26]))
    for i, c in enumerate(n.get('children') or []):
        walk(c, f'{p}.{i}')
walk(d['data']['page']['l1']['root'], '0')
rows.sort()
for y, at, path, kind, nid, text in rows[:12]:
    print(f'y={y:11.2f} at={at:5} {path:22s} {kind:9s} id={nid} {text!r}')
PY
```

**Wrong now** — the first three rows are `0.0.1.0` / `box-2` at `y = -7160.51` (320), `-6398.36` (375)
and `-6186.00` (768). **Right when fixed** — no flow lead in the document is a four-digit negative.

Nothing else in the comment above changes; every number in it was read out of `page.json` and the
served `index.html` directly.
