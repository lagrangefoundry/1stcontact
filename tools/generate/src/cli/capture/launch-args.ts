/**
 * Extra Chromium launch arguments, for hosts that will not let it spawn
 * children ([[REQ-262]] D9).
 *
 * THE PROBLEM THIS SOLVES, MEASURED. An agent session — a loop-1 round, or the
 * free-coding session that implements its gap ticket — runs its commands inside
 * a macOS seatbelt sandbox. Chromium's browser process registers a Mach port
 * rendezvous server so it can hand ports to its renderer and GPU children, and
 * seatbelt denies that registration:
 *
 *     FATAL:base/apple/mach_port_rendezvous_mac.cc:159]
 *     Check failed: kr == KERN_SUCCESS.
 *     bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer.N:
 *     Permission denied (1100)
 *
 * The browser dies before the first frame, so `1c gate`, `1c diff`,
 * `1c values-diff`, `1c capture` and `1c shot` are all unavailable — which is
 * every command that would let an implementing agent SEE the defect it was
 * asked to fix. It could read the evidence a previous run left behind and not
 * reproduce it, which is the difference between working from evidence and
 * working from a report of evidence.
 *
 * IT IS NOT A MISSING BROWSER, and that distinction cost real time before it
 * was pinned down. The binary is present and runs: `chrome-headless-shell
 * --version` prints its version happily. Only the registration is denied, and
 * only once something needs a child process.
 *
 * `--single-process` REMOVES THE CHILDREN, so there are no ports to hand over
 * and nothing to register. Measured rather than assumed: with it, Chromium
 * screenshots a page, reports correct computed styles and returns correct
 * geometry from inside the same sandbox that killed it without.
 *
 * WHY IT IS OPT-IN AND NOT THE DEFAULT. `--single-process` is explicitly not a
 * supported configuration upstream, and it is slower and less isolated. The
 * console on an operator's laptop has no sandbox and no reason to pay for it;
 * only an agent-hosted run needs it. So the default is unchanged and a host
 * that needs the flag says so.
 */

/** Comma-separated extra args, e.g. `CHROMIUM_LAUNCH_ARGS=--single-process`. */
export const LAUNCH_ARGS_ENV = 'CHROMIUM_LAUNCH_ARGS'

/**
 * The launch options every browser launch in this package passes.
 *
 * Returns `{}` when nothing is configured, so an unconfigured host launches
 * exactly what it launched before this module existed — the change is invisible
 * unless it is asked for.
 */
export function browserLaunchOptions(env: NodeJS.ProcessEnv = process.env): { args?: string[] } {
  const configured = env[LAUNCH_ARGS_ENV]?.trim()
  if (!configured) return {}
  const args = configured
    .split(',')
    .map((arg) => arg.trim())
    .filter(Boolean)
  return args.length ? { args } : {}
}
