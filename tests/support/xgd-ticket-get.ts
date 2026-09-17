/**
 * What `xgd ticket get <id> --json` prints, for a console test to answer with.
 *
 * ONE DEFINITION SITE ([[BUG-104]]). Three suites drive the reproduction
 * console's `readTicket()` through an injected `CommandRunner`, and every one
 * of them has to produce the document it parses. Before the read-back moved to
 * `--json` that document was the one line `Status: draft`, which was cheap
 * enough to restate; it is now a nested frontmatter object with a status AND a
 * provenance in it, and three hand-written copies of that shape would drift the
 * moment a fourth field is read back.
 *
 * The banner is deliberate. `xgd` brackets its output with `▶ xgd <version>`
 * and `◀ xgd <version>` lines, and `parseJsonOutput` exists to survive exactly
 * that — a fake that printed a bare document would let a regression in the
 * slicing pass every test and fail on the real CLI.
 */
export interface XgdTicketGetOptions {
  id?: string
  status?: string
  /** `frontmatter.title`, which the console's ticket view renders verbatim. */
  title?: string
  /** `frontmatter.created_by`. Defaults to a round's own provenance. */
  createdBy?: string
}

export function xgdTicketGetJson(opts: XgdTicketGetOptions = {}): string {
  const document = {
    uid: 'request-0badc0de',
    frontmatter: {
      uid: 'request-0badc0de',
      id: opts.id ?? 'REQ-263',
      type: 'request',
      title: opts.title ?? 'fold: a gap',
      created_by: opts.createdBy ?? 'repro-console:joyfulculinarycreations#1',
      status: opts.status ?? 'draft',
    },
    fields: {},
    body: 'the round wrote this',
    links: [],
  }
  return `▶ xgd 0.17.50\n${JSON.stringify(document, null, 2)}\n◀ xgd 0.17.50\n`
}
