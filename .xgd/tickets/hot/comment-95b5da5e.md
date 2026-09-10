---
uid: comment-95b5da5e
id: COMMENT-2584
type: comment
title: Comment on bug BUG-72
created_by: xgd
created_at: '2026-09-10T19:13:29.505237+00:00'
updated_at: '2026-09-10T19:23:53.408490+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-1426d50d
  kind: chat_transcript
---

<!-- xgd-turn id="46fcfcee-1ee3-447b-928e-82fc31b7f0aa-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T19:13:12.667595+00:00" -->
#### You
The Mark points feature is working BUT:
(1) It is VERY hard to catch the label it usually disappears before I can get the mouse to it - I think it is too far away from the point.
(2) The point is indicated by a red circle with a white X but the X is not centered on the circle so it looks weird.
(3) The "Pills" in the chat were intended to be like tags that were monolithic, what I see today is text [Point A] but it is possible for me to partially delete it or add content in the middle

<!-- xgd-turn id="46fcfcee-1ee3-447b-928e-82fc31b7f0aa-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T19:23:52.670792+00:00" -->
#### Claude
Now let me scope the ticket.

Now the code fix:

Good — on the branch worktree. Now the UAT:

Done — (1) and (2) are fixed and landed; (3) can't be fixed in this repo. `BUG-72` is at `free_coded`, version `0.2.151`, commits `331ffc2` + the auto version bump.

**(1) The label you couldn't catch.** The fade rule measured a single 64px radius from the *point*, but the label runs to the *right* of the point and its `×` is at the far end of it — so the label went out from under the cursor mid-approach, and a hidden label has `pointer-events: none`, leaving nothing to hover back onto. The reach is now asymmetric — 200px rightward where the label actually is, 56px everywhere else — and a pointer resting on the mark's own chrome never counts as having left it, so once you arrive the label stays for as long as you need.

**(2) The off-centre X.** It was the glyph `✕` centred by flexbox, which centres the *line box* rather than the ink — off by a font-dependent amount that differs per platform. It's now two white bars, each pulled back by exactly half its own size from the disc's centre, so it's centred by construction with no font consulted. The hit area also grows 18→22px, which is the hover that restores a faded label.

**(3) The pills.** Not fixable here. The composer is `@lagrangefoundry/webui-chat`'s (TipTap, plain-`textarea` fallback), and all we can reach through is `getInputMarkdown`/`setInputMarkdown` — a markdown string. There is no atom-node seam: `extensions: [StarterKit]` is hard-coded, and the package's own history notes the previous atomic `contenteditable=false` block was deliberately removed. Making `[Point A]` behave as DOC-52 §4.4 specifies (atomic, one backspace, cut/paste intact) needs an atom node plus a host registration seam in `components/webui` over in **lagrange-framework**. I haven't touched that repo. Want me to file a ticket there?

Three UATs in `tests/test_UAT_FC_BUG-72_marked_point_chrome.test.ts`, against the real `1c render --edit` output with real pointer events: two of them fail against the old code, the third (“a pointer that genuinely leaves still fades it”) passes both before and after, which is the point — REQ-210's behaviour is kept rather than traded away. Full REQ-210 suite still green (21 tests).

One practical note: the builder's browser source is served from `dist-assets/builder/**`, so you'll need `./bin/1c assets` before you see this in the running builder.

<!-- xgd-chat-end -->