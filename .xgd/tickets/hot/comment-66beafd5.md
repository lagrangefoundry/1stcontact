---
uid: comment-66beafd5
id: COMMENT-4846
type: comment
title: Comment on request REQ-302
created_by: xgd
created_at: '2026-10-03T19:41:34.778104+00:00'
updated_at: '2026-10-03T19:41:34.778104+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-edbc7e5f
  kind: note
---

`repro-console:repro-www-bluelotusintegralhealing-com#1` — iteration 1 re-measurement of issue 2 (`fold-emits-flow-siblings-out-of-order-and-repairs-with-negative-margins`) on a new bundle, where it now **loses content**.

**Bundle:** `storage/references/www.bluelotusintegralhealing.com/index`. Reproduction `repro-www-bluelotusintegralhealing-com`, `$ITER` = `storage/tmp/repro-console/repro-www-bluelotusintegralhealing-com/iteration-1/`.

**What the fold wrote.** The header nav (6 links at page y 30–38, ≥1024 only) is emitted as the **last** flow child of the root, `0.7` (a row container), after the hero (`0.5`) and the About/testimonials block (`0.6`). Each link carries a flow lead of **y −1871.5** at 1280/1440 and **−1846.89** at 1024 (`$ITER/page.json`, nodes `0.7.0`–`0.7.5`). x leads are 651.23 then 32 / 31.99 / … (row gaps).

**What the browser does with it.** Chromium (`--single-process`) at 1280×800 on `$ITER/site/index.html`: `.l1-27` (the row) starts at y **1842.5**, and `.l1-28` ("Home"), `.l1-29` and `.l1-33` all sit at y **−29**, h 24. They are **above the top of the document**. x is right to 0.06px (651.22 vs the reference's 651.23; 725.73 vs 725.75; 1181.64 vs 1181.70). The fold's −1871.5 assumed the row would start at 1909.5 (= 38 + 1871.5), and it starts 67px earlier because the content above it rendered shorter than predicted. REQ-371 issue 3 accounts for 35 of that 67 (CTA pills 21px instead of 56px). I did not separate the other 32.

**Cost.** values-diff: **6 × CRITICAL `missing`** (severity 4060 each): Home, What is BQH?, Services, Client Intake, Disclaimers, Articles. These are the round's highest-severity deltas. They are absent from `$ITER/diff/actual-manifest.json` altogether. The page has no navigation at ≥1024.

**What this adds to issue 2's account.** On gigabytealchemy the repair held at the sampled widths and broke only off-sample. Here it fails **at a sampled width** (1280), because the lead is a 1871px reach back up across the whole page and inherits every height error above it. That makes the order of the fix matter: if REQ-371 issue 3 lands first, the residual error is smaller but not zero, and the links stay off-document. Only emitting the header row in document order (before `0.5`, where `$REF/raw.html` has `<header class="block-header"><nav class="block-header__nav">` as the first child of `<main>`), or pinning it inside `backdrop-0`, fixes it.

**How to see it.**
```
cd tools/generate && node -e "
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch({args:['--single-process']});
const p=await b.newPage({viewport:{width:1280,height:800}});
await p.goto('file://'+require('path').resolve('../../storage/tmp/repro-console/repro-www-bluelotusintegralhealing-com/iteration-1/site/index.html'));
console.log(await p.evaluate(()=>[...document.querySelectorAll('.l1-27 a')].map(a=>[a.textContent,Math.round(a.getBoundingClientRect().y+scrollY)])));await b.close()})()"
```
**Wrong:** every link at y −29. **Right:** every link at y 30 (box) / 32 (glyphs), matching `$REF/multistate.json` at 1280×800.
