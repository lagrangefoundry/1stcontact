---
uid: comment-618dda87
id: COMMENT-6230
type: comment
title: Comment on request REQ-625
created_by: xgd
created_at: '2026-11-01T17:10:08.258001+00:00'
updated_at: '2026-11-01T17:10:08.258001+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-64b87f8a
  kind: note
---

# req625-analyse.py — REQ-625 build-timing analysis (rerunnable)

Run: `python3 -I req625-analyse.py <dir>` where <dir> holds rs.json, tl.json, chats.json, tt/*.json, ct/*.json (each `wrangler d1 execute DB --remote --env production --json` output) and local.sqlite (a copy of the dev miniflare D1).

```python
"""REQ-625 — build timings from past runs.

Sources (read-only):
  remote D1 (dev + production share one database): request_spend, turn_log,
    tool_transcript + chat_transcript comments, chat tickets   -> $D/*.json
  local dev miniflare D1 (runs before 2026-10-28)              -> $D/local.sqlite

Durations:
  builder / critic pass  = last request's recorded_at - first request's sent_at,
                           grouped by the pass's own turn_id (delegated_by = consultant turn)
  consultant slow tool   = transcript ts (written when the result returns) minus the
                           end of the consultant request that issued it (latest
                           consultant recorded_at <= ts in the same site session);
                           only calls that were the sole slow call of their batch.
"""
import collections, difflib, glob, json, os, re, sqlite3, statistics, sys
from datetime import datetime

D = sys.argv[1]
OUT = {}


def t(s):
    return datetime.fromisoformat(s.replace('Z', '+00:00')).timestamp() if s else None


def remote(name):
    return json.load(open(f'{D}/{name}.json'))[0]['results']


# ---------------------------------------------------------------- requests
loc = sqlite3.connect(f'{D}/local.sqlite')
loc.row_factory = sqlite3.Row
rows = {}
for r in [dict(x) for x in loc.execute('select * from request_spend')] + remote('rs'):
    rows[(r['turn_id'], r['request_index'])] = r
reqs = list(rows.values())
turns = {}
for r in [dict(x) for x in loc.execute('select * from turn_log')] + remote('tl'):
    turns[r['turn_id']] = r

consultant_by_session = collections.defaultdict(list)  # session -> [(recorded_at, sent_at, turn)]
session_of_turn = {}
for r in reqs:
    if r['role'] == 'consultant':
        consultant_by_session[r['session_id']].append((t(r['recorded_at']), t(r['sent_at']), r['turn_id']))
        session_of_turn[r['turn_id']] = r['session_id']
for v in consultant_by_session.values():
    v.sort()

passes = collections.defaultdict(list)
for r in reqs:
    if r['role'] in ('builder', 'critic') and r['sent_at']:
        passes[r['turn_id']].append(r)
P = []
for tid, rs in passes.items():
    rs.sort(key=lambda r: r['request_index'])
    start, end = min(t(r['sent_at']) for r in rs), max(t(r['recorded_at']) for r in rs)
    model_ms = sum(t(r['recorded_at']) - t(r['sent_at']) for r in rs)
    P.append(dict(turn=tid, role=rs[0]['role'], model=rs[0]['model'], by=rs[0]['delegated_by'],
                  session=session_of_turn.get(rs[0]['delegated_by']), start=start, end=end,
                  dur=end - start, model_s=model_ms, n=len(rs), tokens_out=sum(r['output_tokens'] for r in rs)))

# ---------------------------------------------------------------- transcripts
TOOL = re.compile(r'<!-- xgd-tool name="([^"]*)" id="([^"]*)" turn="([^"]*)" ts="([^"]*)" -->(.*?)(?=\n## |\Z)', re.S)
FENCE = re.compile(r'\*\*(Input|Result)\*\*\s*\n`{3,}\w*\n(.*?)\n`{3,}', re.S)


def bodies(kind):
    out = []  # (subject, body)
    for x in loc.execute("select fields, body from tickets where type='comment' and json_extract(fields,'$.kind')=?", (kind,)):
        out.append((json.loads(x['fields']).get('subject_uid'), x['body']))
    for f in glob.glob(f'{D}/{"tt" if kind == "tool_transcript" else "ct"}/*.json'):
        r = json.load(open(f))[0]['results'][0]
        out.append((json.loads(r['fields']).get('subject_uid'), r['body']))
    return out


titles = {x['uid']: x['title'] for x in loc.execute("select uid,title from tickets where type='chat'")}
titles.update({x['uid']: x['title'] for x in remote('chats')})

calls = []  # dict(name, id, turn, ts, input, result, subject)
seen = set()
for subject, body in bodies('tool_transcript'):
    for m in TOOL.finditer(body):
        name, cid, turn, ts, rest = m.groups()
        if cid and cid in seen:
            continue
        seen.add(cid)
        parts = {k: v for k, v in FENCE.findall(rest)}
        try:
            inp = json.loads(parts.get('Input', 'null'))
        except Exception:
            inp = None
        calls.append(dict(name=name, id=cid, turn=turn, ts=t(ts), input=inp or {}, result=parts.get('Result', ''), subject=subject))
calls.sort(key=lambda c: c['ts'])

# subject (chat ticket) -> consultant session, from turn-id matches
sess_votes = collections.defaultdict(collections.Counter)
for c in calls:
    s = session_of_turn.get('turn_' + c['turn']) or session_of_turn.get(c['turn'])
    if s:
        sess_votes[c['subject']][s] += 1
# fallback: time proximity to a consultant request
def session_for(c):
    v = sess_votes.get(c['subject'])
    return v.most_common(1)[0][0] if v else None


def request_end_before(session, ts):
    best = None
    for rec, sent, turn in consultant_by_session.get(session, []):
        if rec is not None and rec <= ts + 0.001:
            best = rec
        elif rec is not None and rec > ts:
            break
    return best


# ---------------------------------------------------------------- stats
def stats(xs):
    xs = sorted(xs)
    if not xs:
        return dict(n=0)
    q = lambda p: xs[min(len(xs) - 1, int(round(p * (len(xs) - 1))))]
    return dict(n=len(xs), median=round(statistics.median(xs), 1), p80=round(q(0.8), 1), p10=round(q(0.1), 1), p90=round(q(0.9), 1), max=round(xs[-1], 1))


def m(x):
    return x / 60.0


# Delegates <-> builder passes
delegates = [c for c in calls if c['name'] == 'Delegate']
by_consultant_turn = collections.defaultdict(list)
for p in P:
    if p['by']:
        by_consultant_turn[p['by']].append(p)
for c in delegates:
    cand = by_consultant_turn.get('turn_' + c['turn'], []) + by_consultant_turn.get(c['turn'], [])
    cand = [p for p in cand if not p.get('delegate') and p['role'] == (c['input'].get('role') or 'builder') and abs(p['end'] - c['ts']) < 900]
    if not cand:
        # REQ-483: the hand-off may be recorded under the next request's turn — match by session and time
        s = session_for(c)
        cand = [p for p in P if p['session'] == s and not p.get('delegate') and -5 < c['ts'] - p['end'] < 900]
    if cand:
        p = min(cand, key=lambda p: abs(c['ts'] - p['end']))
        p['delegate'] = c
        c['pass'] = p

# predictors
def scope_pages(inp):
    s = inp.get('scope')
    if isinstance(s, str):
        s = [x for x in re.split(r'[,\s]+', s) if x]
    return len(s) if isinstance(s, list) else 0


rows_out = []
for p in P:
    c = p.get('delegate')
    if not c:
        continue
    inp = c['input']
    res = c['result']
    stopped = bool(re.search(r'"(stopped|exhausted|abandoned)":\s*true|ran out|Error:', res))
    rows_out.append(dict(role=p['role'], model=p['model'], dur=p['dur'], n=p['n'], pages=scope_pages(inp), scope=inp.get('scope'),
                         checks=len(inp.get('accept') or []), words=len(str(inp.get('goal', '')).split()), stopped=stopped,
                         wrote='"wrote": true' in res, subject=c['subject'], ts=c['ts'], goal=str(inp.get('goal', ''))))

OUT['passes_total'] = dict(builder=sum(p['role'] == 'builder' for p in P), critic=sum(p['role'] == 'critic' for p in P), matched=len(rows_out), delegates_in_transcripts=len(delegates))

# lost passes: the consultant turn did not complete and the pass never returned to a Delegate result
lost = [p for p in P if not p.get('delegate') and turns.get(p['by'], {}).get('outcome') in ('lost', 'stalled', 'restarted')]
OUT['lost_passes'] = dict(n=len(lost), minutes=round(sum(m(p['dur']) for p in lost), 1), dur=stats([m(p['dur']) for p in lost]))
unmatched_ok = [p for p in P if not p.get('delegate') and p not in lost]
OUT['unmatched_other'] = dict(n=len(unmatched_ok), note='turn completed or not in turn_log, but no Delegate result in a transcript (pre-transcript runs, or mismatched ids)', dur=stats([m(p['dur']) for p in unmatched_ok]))

# repeats: a returned Delegate whose goal nearly equals one in the same chat within 3h before it
repeats = set()
by_subject = collections.defaultdict(list)
for r in rows_out:
    by_subject[r['subject']].append(r)
for subj, rs in by_subject.items():
    rs.sort(key=lambda r: r['ts'])
    for i, r in enumerate(rs):
        for e in rs[max(0, i - 6):i]:
            if r['ts'] - e['ts'] < 3 * 3600 and difflib.SequenceMatcher(None, r['goal'][:600], e['goal'][:600]).quick_ratio() > 0.9 and difflib.SequenceMatcher(None, r['goal'][:600], e['goal'][:600]).ratio() > 0.85:
                repeats.add(id(r))
                break
for r in rows_out:
    r['repeat'] = id(r) in repeats
OUT['repeat_delegates'] = dict(n=len(repeats), minutes=round(sum(m(r['dur']) for r in rows_out if r['repeat']), 1))

clean = [r for r in rows_out if not r['repeat'] and not r['stopped']]
OUT['stopped_returned'] = dict(n=sum(r['stopped'] for r in rows_out), dur=stats([m(r['dur']) for r in rows_out if r['stopped']]))


def bucket(r):
    if r['role'] == 'critic':
        return 'critique'
    if r['pages'] == 0:
        return 'builder: no scope given'
    if r['pages'] == 1:
        return 'builder: one page'
    if r['pages'] <= 3:
        return 'builder: 2-3 pages'
    return 'builder: 4+ pages'


groups = collections.defaultdict(list)
for r in clean:
    groups[bucket(r)].append(r)
OUT['by_scope_minutes'] = {k: stats([m(r['dur']) for r in v]) for k, v in sorted(groups.items())}
OUT['by_model_builder'] = {k: stats([m(r['dur']) for r in clean if r['model'] == k and r['role'] == 'builder']) for k in sorted({r['model'] for r in clean})}

# predictors: per-feature correlation with duration (builder only)
def corr(xs, ys):
    if len(xs) < 3:
        return None
    mx, my = statistics.mean(xs), statistics.mean(ys)
    sx = sum((x - mx) ** 2 for x in xs) ** .5
    sy = sum((y - my) ** 2 for y in ys) ** .5
    return round(sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / (sx * sy), 2) if sx and sy else None


b = [r for r in clean if r['role'] == 'builder']
OUT['predictors_builder'] = {f: corr([r[f] for r in b], [m(r['dur']) for r in b]) for f in ('pages', 'checks', 'words', 'n')}
# minutes per check / per 100 words, by simple ratio
OUT['checks_buckets'] = {k: stats([m(r['dur']) for r in b if lo <= r['checks'] <= hi]) for k, (lo, hi) in {'0-3 checks': (0, 3), '4-6 checks': (4, 6), '7-10 checks': (7, 10), '11+ checks': (11, 999)}.items()}
OUT['words_buckets'] = {k: stats([m(r['dur']) for r in b if lo <= r['words'] < hi]) for k, (lo, hi) in {'<200 words': (0, 200), '200-499': (200, 500), '500-999': (500, 1000), '1000+': (1000, 10 ** 6)}.items()}

# ---------------------------------------------------------------- slow tools
SLOW = ('capture_site', 'screenshot', 'compare', 'CreateImage', 'EditImage', 'AnimateImage', 'import_from_site', 'draw_image', 'add_comp', 'critique')
tool_durs = collections.defaultdict(list)
batch = collections.defaultdict(list)
for c in calls:
    s = session_for(c)
    if not s:
        continue
    end = request_end_before(s, c['ts'])
    if end is None or c['ts'] - end > 1800:
        continue
    c['req_end'] = end
    batch[(s, end)].append(c)
for key, cs in batch.items():
    slow = [c for c in cs if c['name'] in SLOW]
    if len(slow) == 1:
        c = slow[0]
        failed = c['result'].lstrip().startswith('Error')
        tool_durs[c['name'] + (' (failed)' if failed else '')].append(c['ts'] - c['req_end'])
OUT['slow_tools_seconds'] = {k: stats(v) for k, v in sorted(tool_durs.items())}

# ---------------------------------------------------------------- per-site timelines
USER = re.compile(r'<!-- xgd-turn id="([0-9a-f]+)-user" -->\s*<!-- xgd-chat role="user" ts="([^"]*)" -->\s*#### You\n(.*?)(?=<!-- xgd-turn|\Z)', re.S)
ASSIST = re.compile(r'<!-- xgd-turn id="([0-9a-f]+)-assistant" -->\s*<!-- xgd-chat role="assistant" ts="([^"]*)" -->\s*#### Claude\n(.*?)(?=<!-- xgd-turn|\Z)', re.S)
chat = collections.defaultdict(lambda: dict(user=[], assistant=[]))
for subject, body in bodies('chat_transcript'):
    for tid, ts, text in USER.findall(body):
        chat[subject]['user'].append((t(ts), tid, text.strip()))
    for tid, ts, text in ASSIST.findall(body):
        chat[subject]['assistant'].append((t(ts), tid, text))

sites = []
for subject, ch in chat.items():
    ds = sorted([r for r in rows_out if r['subject'] == subject], key=lambda r: r['ts'])
    dels = sorted([c for c in delegates if c['subject'] == subject], key=lambda c: c['ts'])
    if len(dels) < 3:
        continue
    users = sorted(ch['user'])
    cue = {tid for ts, tid, text in users if text.startswith('[The host')}
    client_msgs = [u for u in users if not u[2].startswith('[The host')]
    handover = next((ts for ts, tid, text in sorted(ch['assistant']) if '](#show=draft' in text), None)
    first_msg = client_msgs[0][0] if client_msgs else None
    pre = [c for c in dels if handover and c['ts'] <= handover]
    post = [c for c in dels if not handover or c['ts'] > handover]
    pre_builder = sum(m(c['pass']['dur']) for c in pre if c.get('pass'))
    first_pre_start = min((c['pass']['start'] for c in pre if c.get('pass')), default=None)
    post_client = [c for c in post if c['turn'] not in cue]
    post_cue = [c for c in post if c['turn'] in cue]
    rep = sum(1 for r in ds if r['repeat'] and (not handover or r['ts'] > handover))
    sites.append(dict(site=titles.get(subject, subject)[:60], subject=subject,
                      first_msg=datetime.utcfromtimestamp(first_msg).strftime('%m-%d %H:%M') if first_msg else None,
                      handover_after_min=round(m(handover - first_msg), 0) if handover and first_msg else None,
                      first_build_to_handover_min=round(m(handover - first_pre_start), 0) if handover and first_pre_start else None,
                      draft_delegates=len(pre), draft_builder_min=round(pre_builder, 0),
                      refine_client_msgs=len([u for u in client_msgs if handover and u[0] > handover]),
                      refine_delegates=len(post), on_client_turns=len(post_client), on_host_cues=len(post_cue), repeats=rep,
                      refine_builder_min=round(sum(m(c['pass']['dur']) for c in post if c.get('pass')), 0)))
OUT['sites'] = sorted(sites, key=lambda s: s['first_msg'] or '')

# first draft end to end
fd = [s for s in sites if s['handover_after_min'] is not None]
OUT['first_draft_minutes'] = dict(from_first_message=stats([s['handover_after_min'] for s in fd]), from_first_build=stats([s['first_build_to_handover_min'] for s in fd if s['first_build_to_handover_min'] is not None]), delegates=stats([s['draft_delegates'] for s in fd]))

# kills from turn_log
OUT['turn_outcomes'] = collections.Counter(x['outcome'] for x in turns.values())

json.dump(OUT, open(f'{D}/out.json', 'w'), indent=1, default=str)
json.dump(rows_out, open(f'{D}/passes.json', 'w'), indent=0, default=str)
print(json.dumps(OUT, indent=1, default=str))

```
