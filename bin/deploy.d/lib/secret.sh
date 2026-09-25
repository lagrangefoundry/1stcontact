# shellcheck shell=bash
#
# `bin/deploy.d/lib/secret.sh` — the mechanism every secret hook shares
# ([[REQ-264]]).
#
# WHY THIS EXISTS. Four hooks had four byte-identical copies of `probe_store`,
# and [[REQ-264]] was about to give each of them a second copied block for the
# capability probe. The DECISION TABLE stays in the hook, because it is that
# credential's own claim about what its absence costs — `20-resend-api-key`
# warns where `40-cloudflare-dns-token` fails and the asymmetry is the point.
# What moves here is only the machinery both of them run.
#
# IT RESOLVES ITSELF, not `$DEPLOY_REPO_ROOT`. A hook finds this file relative to
# its own path, so a hook driven from anywhere — `bin/deploy`, a UAT harness, an
# operator's shell — loads the same library without a variable having to be right.
#
# Nothing here ever prints, logs or passes a secret VALUE. `secret_in_store`
# reads names; `capability_probe` hands the value to `node` through the
# environment it already inherits, which is the one channel that is not visible
# in `ps`.

_SECRET_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Is this name already in the Worker's secret store?  present|absent|unreadable
#
# ASYMMETRY IS DELIBERATE. Only a positive read — the store answered, and the
# name was in the answer — counts as present. A `secret list` that fails for any
# reason (no such Worker on a first deploy, no network, a token without Workers
# Scripts read) is `unreadable` and never `present`, because the failure being
# guarded against is a confident skip based on an answer nobody actually got.
#
# Reading names changes nothing, so this runs unchanged on a rehearsal.
secret_in_store() {
  local name="$1" json
  if ! json="$(cd "$DEPLOY_APP_DIR" && npx wrangler secret list --env "$DEPLOY_ENV" 2>/dev/null)"; then
    echo unreadable
  elif printf '%s' "$json" | grep -q "\"name\"[[:space:]]*:[[:space:]]*\"$name\""; then
    echo present
  else
    echo absent
  fi
}

# Probe what this credential can actually do.  0 capable · 2 insufficient
# · 3 invalid · anything else unproven.
#
# IT RUNS ON A REHEARSAL TOO, and that is not an oversight: every request the
# probe makes is a read, so `--dry-run` reaches the same verdict by the same
# route — which is what makes `bin/deploy --dry-run` a credential check an
# operator can run before they are ready to ship.
capability_probe() {
  node "$_SECRET_LIB_DIR/probe.mjs" probe "$1"
}

# The LOCAL target has no `wrangler secret` store, and that is a fact about the
# environment rather than a gap in it ([[REQ-318]]).
#
# A local Worker's secrets come from the `--env-file` layering — `.dev.vars` plus
# `$ONECONTACT_SECRETS` — which is what `dev-env.ts` composes and what
# `wrangler dev` reads. So at this target the three things a secret hook usually
# does are all wrong: `wrangler secret list --env dev` names a Worker that does
# not exist in any account and answers `unreadable`, which the decision tables
# correctly read as a reason to fail; and `wrangler secret put` would upload a
# credential for an environment that is never uploaded.
#
# WHAT IS STILL DONE IS THE PART THAT MATTERS. If the operator's environment
# carries the value, it is PROBED exactly as it would be at the cloud target, so
# the capability report says what this local deployment can really do rather than
# going quiet. Only if there is nothing to probe is a `local` row recorded — which
# reads as unverified and never as a pass, the same way `stored` does.
#
# Returns 0 when the hook should stop here, 1 when it should carry on.
secret_local_target() {
  local name="$1"
  [[ "${DEPLOY_TARGET:-cloud}" == "local" ]] || return 1
  if [[ -n "${!name:-}" ]]; then
    capability_probe "$name" || true
  else
    capability_record "$name" local
    echo "    $name: not in this environment — the local Worker reads it from" \
      "apps/control-app/.dev.vars or \$ONECONTACT_SECRETS"
  fi
  return 0
}

# Record an outcome nobody probed — `stored`, `absent` or `unreadable`.
#
# THE REPORT HAS A ROW FOR EVERY CREDENTIAL OR IT IS NOT A REPORT. A hook that
# stayed silent because it had nothing to probe would leave the operator reading
# an answer with a hole in it and no way to tell the hole from a pass.
capability_record() {
  node "$_SECRET_LIB_DIR/probe.mjs" record "$1" "$2" || true
}
