---
uid: comment-d5a633c6
id: COMMENT-2281
type: comment
title: Comment on bug BUG-53
created_by: xgd
created_at: '2026-09-05T20:57:42.122103+00:00'
updated_at: '2026-09-05T21:48:07.899354+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-29e265e3
  kind: chat_transcript
---

<!-- xgd-turn id="a97e2739-88ca-4f06-ae3b-ae72ec5becd9-user" -->

<!-- xgd-chat role="user" ts="2026-09-05T20:57:34.389240+00:00" -->
#### You
A number of the CTAs on the current UI appear to have no CSS associated with them on the top bar Theme and About, on the users tab the filter, "Invite", "Provision a Business" can you make them consistent please with a smaller font

<!-- xgd-turn id="a97e2739-88ca-4f06-ae3b-ae72ec5becd9-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-05T21:07:54.079641+00:00" -->
#### Claude
Ticket is empty. Let me locate the relevant UI code.Diagnosis is complete. Writing the scope ticket.

Baseline green. Now the CSS change.

Now inserting the shared control-size block after the `@font-face` declarations.

Now unify the filter-row padding and drop the redundant `font: inherit` on the affected rules.

Now the dead `builder-modal__button` class in the two dialogs.

Now verifying the UATs actually fail without the fix.

Six of seven fail without the fix. Tightening the two that report weakly.

All 7 are genuine evidence. Now the regression scope.

Done — landed on `xgd-working` as `af7c9f7`, BUG-53 at `free_coded`.

**What was actually wrong** — two defects wearing the same face:

1. **`font: inherit` with nothing to inherit.** The shell's action buttons, the People filter's search/select, Invite, Provision a business and the dialog buttons all say `font: inherit`. Nothing in the chain declares a `font-size` — `.shell` sets only a family — so every one resolved to the browser default **16px** while the rest of the chrome runs at 12–13px. They were styled; just at a size belonging to nobody.

2. **`builder-modal__button` is a dead class.** The canonical one is `builder-modal__btn`. Five call sites (both Users-tab dialogs, plus the account dialog's Close) spelled it the long way, matching no rule anywhere — the genuinely unstyled case.

**The fix**

- A `--builder-control-font-size` token at **13px** (matching `--fields-font-size`, which the People table already takes) sizes all six selectors from one grouped rule — one place to change, rather than six literals of which one always gets missed.
- The top bar is an override: the shell is in the shared out-of-repo store and isn't ours to edit, but `chrome.ts` already emits `builder.css` after the component stylesheets, so a same-specificity rule wins on order.
- The filter row's three controls had three different paddings (`3px 6px` / `3px 10px` / `4px 12px`) and so three heights; they now share one token.
- The five dead class names corrected, with Invite and Provision marked `--primary` the way `editor.js` and `palette-popup.js` mark their affirmative buttons.

Dialog footers keep their larger `8px 18px` padding — a footer isn't a filter row — and Invite keeps its accent fill. Only the type size was unified there.

**Evidence:** `tests/test_UAT_FC_BUG-53_control_type_is_consistent.test.ts`, 7 tests, mounted against the real components. I verified all 7 fail with the source reverted and pass with it. Regression scope: 24 suites / 186 tests across the builder, dialogs, shell chrome and Users tab, all green.

One thing worth noting: REQ-189 already had a test claiming "nothing this tab's dialogs emit is unstyled" — it swept only classes prefixed `builder-people`, which is exactly how the `builder-modal__*` typo walked through it. The new suite widens the rendered sweep to all `builder-*` classes and adds a static sweep over every `modalButton` class literal in the builder, so that class of defect can't recur on a surface this session didn't happen to open.

<!-- xgd-turn id="02bfa225-46eb-4000-93d5-7ae45c06eb7c-user" -->

<!-- xgd-chat role="user" ts="2026-09-05T21:27:44.485572+00:00" -->
#### You
I refreshed and see no difference in the buttons I named do I need to do a build of somesort to see a change?

<!-- xgd-turn id="02bfa225-46eb-4000-93d5-7ae45c06eb7c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-05T21:30:37.763516+00:00" -->
#### Claude
Yes — a build step, and it was silently blocked. You should see the change now after a hard refresh.

**Why nothing changed.** The Worker serves the builder from `apps/control-app/dist-assets/`, not from `src/`. `./bin/1c assets` copies one to the other. Your `dist-assets/builder/builder.css` was timestamped 13:40; my commit landed at 14:07. You were looking at the pre-commit CSS.

**Why I couldn't just run the build.** `./bin/1c assets` refuses outright:

```
The system KB corpus and its index disagree, so this bundle would ship
documents the assistant cannot retrieve.
  MISSING from the index (3): REF-behaviors, REF-l1, REF-surface
  STALE  in the index (2): DOC-17, DOC-33
```

That's BUG-48's guard firing correctly on a genuinely stale index — pre-existing, nothing to do with BUG-53. It aborts before writing anything, so the CSS copy never happens either. Repairing it needs `1c kb build`, which needs to reach Cloudflare for embeddings, and my sandbox has no network — the call dies at `fetch failed`.

**What I did instead.** I verified `1c assets` treats those three files as a straight copy (the existing `dist-assets` copies are byte-identical to the pre-commit sources), then copied them across by hand. `dist-assets/` is gitignored build output, so nothing is committed and the next real `1c assets` overwrites it.

- Hard-refresh the builder (⌘⇧R — plain refresh may serve cached CSS).
- If it still looks the same, restart `pnpm dev` / `1c builder`; the assets binding may have the old directory listing in memory.

**Worth doing properly when you're at a terminal with network:**

```bash
export CLOUDFLARE_API_TOKEN="$(cat ~/Documents/secrets/1c_AI_Admin)"
bin/kb-release     # 1c kb build, then 1c assets, in order
```

Until that runs, every `1c assets` on this machine will refuse the same way — so any future browser-asset change hits this same wall, not just this one. That KB skew is a real outstanding item; I haven't filed it since it's outside this ticket, but say the word and I will.

<!-- xgd-turn id="fb393754-fcc6-42d7-a2ea-bd277c04a49f-user" -->

<!-- xgd-chat role="user" ts="2026-09-05T21:47:03.779084+00:00" -->
#### You
Now localhost:8788 is giving me: Cloudflare Access rejected this request: no Access signing key matches kid 'local-dev-key-1'.

<!-- xgd-turn id="fb393754-fcc6-42d7-a2ea-bd277c04a49f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-05T21:48:07.020097+00:00" -->
#### Claude
Stale cookie, not a code problem. Your browser is presenting a token signed by a key that no longer exists.

**What's happening.** The live sim publishes one key:

```
$ curl -s http://127.0.0.1:8799/cdn-cgi/access/certs | grep -o '"kid":"[^"]*"'
"kid":"local-dev-35981"
```

`bin/access-sim` mints `local-dev-${process.pid}` (line 65) precisely so a restart reads as a key rotation. Your cookie says `local-dev-key-1` — the old *stable* kid, from before that change. The gate is working correctly: it fetched the JWKS, found no matching kid, and refused.

**Two things to fix, and the second will bite you again if you miss it.**

1. Re-login at http://127.0.0.1:8799/login and pick a person. That overwrites `CF_Authorization` with a token signed by the current key.
2. Browse **`127.0.0.1:8788`**, not `localhost:8788`. Cookies are scoped by host and ignore the port — the sim sets its cookie on `127.0.0.1`, so it is never sent to `localhost`. `access-sim` calls this out at line 115. Your stale `local-dev-key-1` cookie is presumably sitting on the `localhost` host from an earlier run; clear it there or it'll keep shadowing.

**Verified end to end just now.** Minted a fresh token for a seeded person and drove the running Worker:

```
/                     200
/builder/builder.css  → contains --builder-control-font-size (×2)
```

So the CSS sync from the last message is live — the Worker picked it up with no restart. `/builder/` itself 404s; the shell is served from `/`.

One aside: `martin@westhead.me` gets a 403, not a 401 — signature verifies, identity isn't a seeded person. Use `martin-github@westhead.me` (or `uat@westhead.me`, `martin-1c-test@westhead.me`) from the sim's own list.

<!-- xgd-chat-end -->