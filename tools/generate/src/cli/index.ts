import { parseArgs } from './args'
import {
  cmdCheckout,
  cmdList,
  cmdNew,
  cmdPublish,
  cmdRender,
  cmdRevisions,
  InvalidDefinitionError,
  type GlobalOptions,
} from './commands'
import { startServe } from './serve'

export * from './commands'
export { startServe } from './serve'
export type { ServeOptions, ServeHandle } from './serve'
export { parseArgs } from './args'

const USAGE = `1c — file-backed site storage, versioning & server-side render (REQ-9)

Usage:
  1c new <slug> [--sandbox]
  1c list [--sandbox]
  1c render <slug> [--source draft|latest|<revId>] [--sandbox] [--out <dir>]
  1c publish <slug> [-m "message"] [--by <id>] [--sandbox]
  1c checkout <slug> [<revId>] [--force] [--sandbox]
  1c revisions <slug> [--sandbox]
  1c serve <slug> [--source draft|published] [--sandbox] [--port <n>]

Every command defaults to the git-tracked sites/ tree; --sandbox targets the
gitignored sandbox/ scratch tree. Rendered output always lands in
dist/<root>/<slug>/<channel>/.`

/** Parse a revision positional (`0001` or `1`) to a number, or undefined. */
function parseRev(tok: string | undefined): number | undefined {
  if (tok === undefined) return undefined
  const n = Number(tok)
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(`Invalid revision id '${tok}'.`)
  }
  return n
}

/**
 * Dispatch a parsed `1c` command line. Returns when the command completes —
 * except `serve`, which resolves only when its server closes.
 */
export async function run(argv: string[]): Promise<void> {
  const { positionals, flags } = parseArgs(argv)
  const [command, ...rest] = positionals
  const global: GlobalOptions = { sandbox: flags.sandbox === true }

  switch (command) {
    case undefined:
    case 'help':
    case '--help':
      console.log(USAGE)
      return

    case 'new': {
      const slug = requireSlug(rest[0])
      const { draftDir } = cmdNew(slug, global)
      console.log(`Created site '${slug}' at ${draftDir}`)
      return
    }

    case 'list': {
      const sites = cmdList(global)
      if (sites.length === 0) {
        console.log('(no sites)')
        return
      }
      for (const s of sites) {
        console.log(`${s.slug}\t${s.latest === null ? '(unpublished)' : `r${s.latest}`}`)
      }
      return
    }

    case 'revisions': {
      const slug = requireSlug(rest[0])
      const revs = cmdRevisions(slug, global)
      if (revs.length === 0) {
        console.log('(no revisions)')
        return
      }
      for (const r of revs) {
        const n = r.changes.added.length + r.changes.modified.length + r.changes.removed.length
        console.log(`r${r.id}\t${r.publishedAt}\t${n} change(s)\t${r.message}`)
      }
      return
    }

    case 'render': {
      const slug = requireSlug(rest[0])
      const { outDir, files } = await cmdRender(slug, {
        ...global,
        source: typeof flags.source === 'string' ? flags.source : undefined,
        out: typeof flags.out === 'string' ? flags.out : undefined,
      })
      console.log(`Rendered ${files.length} file(s) → ${outDir}`)
      return
    }

    case 'publish': {
      const slug = requireSlug(rest[0])
      const { id, outDir, changes } = await cmdPublish(slug, {
        ...global,
        message: typeof flags.message === 'string' ? flags.message : undefined,
        by: typeof flags.by === 'string' ? flags.by : undefined,
      })
      const n = changes.added.length + changes.modified.length + changes.removed.length
      console.log(`Published revision r${id} (${n} change(s)) → ${outDir}`)
      return
    }

    case 'checkout': {
      const slug = requireSlug(rest[0])
      const { id, draftDir } = cmdCheckout(slug, parseRev(rest[1]), {
        ...global,
        force: flags.force === true,
      })
      console.log(`Checked out revision r${id} → ${draftDir}`)
      return
    }

    case 'serve': {
      const slug = requireSlug(rest[0])
      const source = flags.source === 'draft' ? 'draft' : 'published'
      const { url, rootDir } = await startServe(slug, {
        ...global,
        source,
        port: typeof flags.port === 'string' ? Number(flags.port) : undefined,
      })
      console.log(`Serving ${rootDir}\n  ${url}`)
      // Keep the process alive until the server closes.
      await new Promise<void>(() => {})
      return
    }

    default:
      console.error(`Unknown command: ${command}\n\n${USAGE}`)
      process.exitCode = 1
      return
  }
}

function requireSlug(slug: string | undefined): string {
  if (!slug) {
    throw new Error('Missing required <slug> argument.')
  }
  return slug
}

export { InvalidDefinitionError }
