# REQ-853: shared shell library for the commit-rewrite ledger's git hooks
# (post-commit, post-merge, post-rewrite). Sourced by each hook, never run
# directly.
#
# Ledger storage is git notes, not a bare file: writing a note touches only
# the target notes ref below, never HEAD/the index/the working tree, so
# it's safe to call mid-cherry-pick or mid-rebase (while git's sequencer
# state is present) without any risk of corrupting it, and it is a durable
# git object the instant it's written -- no follow-up commit required. See
# DOC-991 and REQ-853's ticket body ("Implementation decisions") for the
# full rationale.
#
# One notes ref per pre-existing single-writer domain, not one shared ref
# (REQ-853 iteration 2, distributed-deployment follow-up): a single ref
# written independently by two machines diverges the moment both write in
# the same window (git notes are not merged by a plain push/fetch), so the
# ledger is partitioned to match the same single-writer-per-branch
# invariant `dispatcher/branch_sync.py` already relies on for
# main/xgd-working/xgd-stable. See ledger_ref_for_branch below for the
# classification and REQ-853's ticket body for the full rationale.
#
# Keep XGD_LEDGER_NOTES_REF_PREFIX in sync with LEDGER_NOTES_REF_PREFIX in
# xgd_source/core/commit_ledger.py -- shell has no shared-import mechanism
# with Python, so both constants are independently authoritative; a test
# asserts they match.
XGD_LEDGER_NOTES_REF_PREFIX="refs/notes/xgd-ledger-"

# ledger_ref_for_branch branch
#
# Classifies the current branch into its single-writer domain and prints
# the notes ref that domain owns. Based purely on the branch name -- git's
# own native data, already computed by every caller -- not on which xgd
# code path is running, so it works the same whether xgd's own Python or a
# human/agent running git directly performed the rewrite.
#
# Matches this codebase's real worktree-naming conventions (confirmed by
# reading xgd_source/core/worktree/naming.py, resync/setup.py,
# regression/lifecycle.py, dispatcher/queue.py, resync/cherry_filter.py --
# not assumed): free-coding worktrees are `free-*`, reconcile worktrees are
# `reconcile-*` (the `reconcile-src-*` snapshot variant shares the prefix),
# resync worktrees are `resync-*`, regression worktrees are `regression-*`,
# and -- easy to get wrong -- `xgd develop`'s own worktree/branch naming is
# `branch-<ticket-id>`, not `develop-*`. Anything unrecognised (detached
# HEAD, a branch naming scheme introduced later) falls into `other` rather
# than silently picking an existing domain it doesn't belong to.
ledger_ref_for_branch() {
    b="$1"
    case "$b" in
        xgd-working) echo "${XGD_LEDGER_NOTES_REF_PREFIX}xgd-working" ;;
        main) echo "${XGD_LEDGER_NOTES_REF_PREFIX}main" ;;
        xgd-stable) echo "${XGD_LEDGER_NOTES_REF_PREFIX}xgd-stable" ;;
        free-*) echo "${XGD_LEDGER_NOTES_REF_PREFIX}freecoding" ;;
        reconcile-*) echo "${XGD_LEDGER_NOTES_REF_PREFIX}reconcile" ;;
        resync-*) echo "${XGD_LEDGER_NOTES_REF_PREFIX}resync" ;;
        regression-*) echo "${XGD_LEDGER_NOTES_REF_PREFIX}regression" ;;
        branch-*) echo "${XGD_LEDGER_NOTES_REF_PREFIX}develop" ;;
        *) echo "${XGD_LEDGER_NOTES_REF_PREFIX}other" ;;
    esac
}

# ledger_write_note old_sha new_sha branch
#
# Appends a rewrite-edge to old_sha's note (keyed by old_sha, content
# "new_sha date branch"), on the ref ledger_ref_for_branch selects for the
# current branch, so later a full chain is found by repeatedly looking up
# each new_sha as the next old_sha. Uses `git notes append` (not `add`) so
# an old_sha legitimately rewritten more than once (e.g. the same commit
# cherry-picked independently into two different worktrees) accumulates
# multiple lines instead of overwriting. Skips (no-op) if this exact
# old_sha->new_sha edge is already recorded, so a clean merge -- which
# fires both post-merge and post-commit's own merge check -- never records
# the same edge twice.
#
# A `git notes append` can fail on transient ref-lock contention (e.g. two
# reconcile bundles on the same machine both rewriting at once, racing on
# the same `reconcile` ref) -- retried up to 3 times before giving up. On
# exhaustion, the edge is NOT silently lost: ledger_log_failure appends a
# durable record so an operator can notice and recover it, since a dropped
# rewrite-edge is a real correctness gap for the ledger's whole purpose,
# not just a logging nicety.
#
# Never fails the calling hook: post-commit/post-merge/post-rewrite are all
# advisory hooks whose exit status git ignores.
ledger_write_note() {
    old_sha="$1"
    new_sha="$2"
    branch="$3"
    target_ref="$(ledger_ref_for_branch "$branch")"

    existing="$(git notes --ref="$target_ref" show "$old_sha" 2>/dev/null)"
    case "$existing" in
        *"$new_sha"*)
            return 0
            ;;
    esac

    date_str="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    msg="$new_sha $date_str $branch"

    attempt=1
    while [ "$attempt" -le 3 ]; do
        if git notes --ref="$target_ref" append -m "$msg" "$old_sha" >/dev/null 2>&1; then
            return 0
        fi
        sleep 1
        attempt=$((attempt + 1))
    done

    ledger_log_failure "$old_sha" "$new_sha" "$branch" "$target_ref" 3
}

# ledger_log_failure old_sha new_sha branch target_ref attempts
#
# Durable, local record of a rewrite-edge that could not be written after
# retrying -- lives under the shared .git dir (visible to every worktree on
# this machine), not inside the ledger's own notes refs, so a failure to
# write the ledger can never also fail to record itself.
ledger_log_failure() {
    old_sha="$1"
    new_sha="$2"
    branch="$3"
    target_ref="$4"
    attempts="$5"

    git_common_dir="$(git rev-parse --git-common-dir)"
    failure_log_dir="$git_common_dir/xgd"
    failure_log="$failure_log_dir/commit_ledger_failures.log"
    mkdir -p "$failure_log_dir" 2>/dev/null

    date_str="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    printf '%s %s %s %s %s attempts=%s\n' \
        "$date_str" "$old_sha" "$new_sha" "$branch" "$target_ref" "$attempts" \
        >> "$failure_log" 2>/dev/null

    echo "xgd commit-ledger: failed to record $old_sha -> $new_sha on $target_ref after $attempts attempt(s) -- see $failure_log" >&2
}
