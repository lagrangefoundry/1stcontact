/**
 * Filing the gap ticket a round handed back (REQ-256 behavior 4).
 *
 * THE CONSOLE FILES IT, NOT THE ROUND. The round has no tool that can run a
 * command — see `AI_DISALLOWED_TOOLS` and the measurement recorded beside it —
 * so what it produces is the ticket's CONTENT and this is what turns that into
 * a ticket. Two consequences worth stating, because they are the point rather
 * than a side effect:
 *
 *  - **`status: draft` is written here**, so behavior 4's "never at any
 *    `ready_*` status" is structural. A `ready_*` status is a dispatcher
 *    trigger — it spawns an autonomous pipeline against the ticket within about
 *    thirty seconds — and there is now no status for a round to get wrong.
 *  - **One ticket per gap class** (behavior 6) is enforced by the console too:
 *    a round that names a class already in the registry appends to that class's
 *    ticket, and the append is an `xgd ticket update --append-body-file`
 *    against the uid the registry holds.
 */
import { writeFileSync } from 'node:fs'
import type { CommandRunner } from './run'
import type { GapTicketDraft } from './ai'

/** The status every gap ticket is created at, and the only one. */
export const GAP_TICKET_STATUS = 'draft'

/** What xgd calls the ticket it just wrote. */
export interface TicketRef {
  id: string
  uid: string
}

/**
 * Read the ticket xgd says it created.
 *
 * `--json` prints `{uid, id, type, title}`, but the CLI also prints its own log
 * lines around it, so the document is looked for INSIDE the output rather than
 * parsed from the whole of it. The prose form is the fallback, because a
 * version of xgd that printed only that would otherwise lose the ticket it had
 * just successfully created — the one failure here that cannot be retried
 * safely, since retrying files a second ticket.
 */
export function parseTicketRef(stdout: string): TicketRef | null {
  const uid = /"uid"\s*:\s*"([^"]+)"/.exec(stdout)?.[1]
  const id = /"id"\s*:\s*"([^"]+)"/.exec(stdout)?.[1]
  if (uid && id) return { id, uid }
  const prose = /Created\s+\w+:\s+(\S+)\s+\(([^)]+)\)/.exec(stdout)
  return prose ? { id: prose[1], uid: prose[2] } : null
}

export interface FileTicketOptions {
  cwd: string
  run: CommandRunner
  draft: GapTicketDraft
  /** Where the body is written before `--body-file` is pointed at it. */
  bodyFile: string
}

/**
 * Create the gap ticket, at `draft`, and report what xgd called it.
 *
 * The body goes through a FILE rather than `--body`. A gap ticket's body is
 * multi-line markdown quoting values out of `values-diff.json`, and passing
 * that as one argument makes its correctness a question about argument length
 * and quoting rather than about what the round found.
 */
export async function fileGapTicket(opts: FileTicketOptions): Promise<TicketRef | string> {
  writeFileSync(opts.bodyFile, opts.draft.body)
  const result = await opts.run(
    'xgd',
    [
      'ticket',
      'create',
      '--type',
      opts.draft.type,
      '--title',
      opts.draft.title,
      '--fields',
      JSON.stringify({ status: GAP_TICKET_STATUS }),
      '--body-file',
      opts.bodyFile,
      '--json',
    ],
    opts.cwd,
  )
  if (result.code !== 0) return `xgd refused to create the ticket: ${lastWords(result.stderr || result.stdout)}`
  const ref = parseTicketRef(result.stdout)
  return ref ?? `xgd created a ticket but did not say which: ${lastWords(result.stdout)}`
}

export interface AppendEvidenceOptions {
  cwd: string
  run: CommandRunner
  /** The ticket the class already has. */
  uid: string
  evidence: string
  evidenceFile: string
}

/** Append this round's evidence to the class's existing ticket (behavior 6). */
export async function appendGapEvidence(opts: AppendEvidenceOptions): Promise<string | null> {
  writeFileSync(opts.evidenceFile, `\n${opts.evidence.trim()}\n`)
  const result = await opts.run(
    'xgd',
    ['ticket', 'update', opts.uid, '--append-body-file', opts.evidenceFile],
    opts.cwd,
  )
  return result.code === 0 ? null : `xgd refused to append to ${opts.uid}: ${lastWords(result.stderr || result.stdout)}`
}

/** The last few informative lines a refusal left behind. */
function lastWords(output: string, lines = 3): string {
  const informative = output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /\w/.test(line))
  return informative.length ? informative.slice(-lines).join(' · ') : 'no output'
}
