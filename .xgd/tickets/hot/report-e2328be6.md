---
uid: report-e2328be6
id: REPORT-3419
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-04T00:07:44.711274+00:00'
updated_at: '2026-09-04T00:07:44.711274+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-119dd4af.md` — **UU**, intent/bookkeeping ticket
  (rule **2e**; `request-*`, user-authored content, not matrix state). Resolved to
  the **OURS/HEAD** side.

  Path is outside the sparse-checkout cone (DOC-986 §2/§4.1), so the conflict
  existed only in the index with no working-tree markers; resolved with
  `git checkout --ours` + `git add --sparse`.

  Conflict stages:
  - base `:1` = `3d15e21eaa` (blob from attempt 145's incoming commit `3013025820`)
  - ours `:2` = `353324f1de` (= HEAD `a3455307e5`, unchanged since attempt 144)
  - theirs `:3` = `2218e0bdf7`

  Unlike attempts 144 and 145, this incoming commit (`1d262a55d6`,
  `xgd(ticket): update request`, 2026-08-31 15:18:07 -0700, `last_field_updated:
  body`) is the **substantive body edit**: it appends the entire `# What landed`
  section (~145 lines), de-links the two `[[REQ-158]]` references to prose
  (`` `1c kb` ships the static one``, `The system index lives in the Worker
  bundle`), rewrites the floor paragraph to drop "title plus ~200 characters per
  document" and the "(~2–4KB, about a dozen documents)" parenthetical, drops the
  `(lagrange-framework REQ-104)` attachment qualifier, and removes the
  `## Acceptance` and `## Open questions` sections.

  **All of that content is already present in HEAD, byte-for-byte.** `git diff
  :2 :3` reduces to exactly two hunks: the frontmatter block, and the file's final
  line differing only by a terminal newline. The ~200-line body is otherwise
  identical. HEAD's `seed_local_overlay` commit (`1856968a43`, 2026-09-02 10:50
  -0700) had already carried this same body across from the working timeline —
  which is precisely what that operation does.

  Per-fact resolution under 2e:

  - **Body** — identical on both sides; no substantive conflict to adjudicate.
  - `updated_at` — both sides changed it; HEAD later by two days (2026-09-02
    vs 2026-08-31). → **HEAD**.
  - `status` — theirs `free_coded`, HEAD `bundled`. HEAD is later-positioned and
    `bundled` is the strictly downstream lifecycle state. → **HEAD**.
  - `bundled_in: bundle-203b1dc2` — HEAD-only field; the incoming side never had
    it, so nothing opposes it. → **kept**.
  - `last_field_updated` — theirs `body`, HEAD `status`. As in attempt 145, this
    field is functionally dependent on `updated_at` and on which field that update
    touched; the three express one fact. HEAD's Sep-2 update was the `status →
    bundled` transition, so `status` is the internally consistent value to pair
    with HEAD's `updated_at`. → **HEAD**.
  - **Terminal newline** — theirs ends with a newline, ours does not. Ours kept, as
    the form xgd's own ticket writer produced for the committed HEAD blob. This is
    a serialization artifact, not content.

  Taking theirs wholesale would have reverted `status: bundled → free_coded` and
  dropped `bundled_in: bundle-203b1dc2` — un-bundling the very bundle this
  reconcile run is executing — while gaining no body content HEAD does not
  already have.

  No content was invented; no `intent_uid`/`story_uid`/`capability_uid` field was
  touched.

## Incoming changes preserved

No code/implementation files were in conflict — the single conflicted file is a
bookkeeping ticket. This commit is nevertheless the first of the three attempts
(144, 145, 146) to carry real content, so the STEP 3 check was made against the
body specifically and is worth stating explicitly:

Every substantive change in the incoming diff is present in the resolved version:

- the `# What landed` section in full — `kb/knowledge_bases.json`,
  `apps/control-app/src/knowledge.ts`, "Decisions taken, and one supersession",
  "Known gap", "Test plan" — present, byte-identical;
- both `[[REQ-158]]` de-linkings — present;
- the floor-paragraph rewrite and the character-budget rewording — present;
- the `## Acceptance` / `## Open questions` removals — already applied in HEAD;
- the attachment bullet's dropped `(lagrange-framework REQ-104)` qualifier — present.

Verified mechanically: `git diff :2 :3` contains no body hunk at all, only the
frontmatter block and the terminal-newline difference. Nothing in the incoming body
is absent from HEAD.

The ticket's free-coding metadata — `fields.commits[0].working_sha:
115f0d39ec5f8787751f144cda8b5d3c6279fbf9`, `fields.version: 0.2.23` — is likewise
present, carried by HEAD.

Nothing was dropped under the BUG-1301 precedence exception; no hunk was discarded.

Because HEAD already subsumes this commit's entire effect, the staged tree nets to
**no diff vs HEAD** (`git status --porcelain --untracked-files=no` is empty). Per
STEP 4 this is the redundant-commit case (BUG-1109/BUG-1122), **not** a discard:
STEP 3's distinguishing check passes decisively here — the incoming commit's key
changes are present in HEAD via a different route (the `seed_local_overlay`
commit), not merely absent. `--skip` was not called; the cherry-pick sequencer
state (`CHERRY_PICK_HEAD` = `1d262a55d6`) is left intact for
`cherry_pick_finalize_resolution`.

Note for the outer run: three consecutive attempts (144, 145, 146) on this same
ticket have all resolved to HEAD and all netted to empty, because HEAD's
`seed_local_overlay` commit already replayed this ticket's whole working-timeline
state — frontmatter and body. That is the expected shape for the remaining
`xgd(ticket): update request request-119dd4af` commits in this bundle.
