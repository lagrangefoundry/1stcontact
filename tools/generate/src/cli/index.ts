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
import {
  editAssetAdd,
  editAssetGet,
  editAssetList,
  editAssetRm,
  editConfigGet,
  editConfigSet,
  editPageAdd,
  editPageGet,
  editPageList,
  editPageRm,
  editPageUpdate,
  editStatus,
  type EditOutput,
} from './edit'
import { cmdCapturePage } from './capture'
import { CommandError, EXIT_CODES } from './errors'
import { startServe } from './serve'
import { cmdShot, VIEWPORTS, type ViewportName } from './shot'
import { cmdValuesDiff, formatReport } from './fidelity'
import type { RenderChannel } from '../store'

export * from './commands'
export * from './edit'
export * from './capture'
export { CommandError, EXIT_CODES } from './errors'
export type { ErrorCode, CommandErrorShape } from './errors'
export { startServe } from './serve'
export type { ServeOptions, ServeHandle } from './serve'
export { cmdShot, VIEWPORTS } from './shot'
export type { ShotOptions, ShotResult, ViewportName } from './shot'
export { cmdValuesDiff, formatReport } from './fidelity'
export type { ValuesDiffOptions } from './fidelity'
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

Reference capture (REQ-12) — rendered-only headless-browser capture:
  1c capture page <url>

Screenshot primitive (REQ-13) — AI eyes; PNG of our own output or any URL:
  1c shot <slug> [--source draft|published] [--viewport mobile|tablet|desktop] [--out <file>] [--sandbox]
  1c shot --url <url> [--viewport mobile|tablet|desktop] [--out <file>]

Fidelity values-diff (REQ-31) — mechanical per-element value comparison:
  1c values-diff <slug> --ref <captureBundleDir> [--source draft|published] [--out <file>] [--json] [--sandbox]
  1c values-diff --ref <captureBundleDir> --actual <manifest.json> [--out <file>] [--json]
  Noise controls (REQ-35): tolerances default to jitter-tolerant; --strict = exact match.
    [--strict] [--color-tol <ΔE>] [--font-size-tol <px>] [--line-height-tol <px>]
    [--letter-spacing-tol <px>] [--padding-tol <px>] [--border-tol <px>] [--weight-tol <n>]

Structured-edit commands (REQ-11) — operate on draft/; support --json:
  1c status <slug>
  1c page list <slug>
  1c page get <slug> <pageId>
  1c page add <slug> <pageId> [--title <t>] [--path <p>]
  1c page update <slug> <pageId> [--title <t>] [--path <p>]
  1c page rm <slug> <pageId> [--force]
  1c config get <slug> [<key>]
  1c config set <slug> <key> <value>
  1c asset list <slug>
  1c asset get <slug> <assetName>
  1c asset add <slug> <file> [--as <name>]
  1c asset rm <slug> <assetName> [--force]

Every command defaults to the git-tracked sites/ tree; --sandbox targets the
gitignored sandbox/ scratch tree. Rendered output always lands in
dist/<root>/<slug>/<channel>/.

In --json mode, structured-edit commands emit {"ok":true,"data":...} on success
or {"ok":false,"error":{code,message,path?,hint?}} on failure. Exit codes:
0 success, 2 schema-invalid, 3 not-found, 4 referential-integrity, 5 conflict,
1 unexpected/internal.`

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

    case 'capture': {
      const sub = rest[0]
      if (sub !== 'page') {
        console.error(`Unknown capture subcommand: ${sub ?? '(none)'}\n\n${USAGE}`)
        process.exitCode = 1
        return
      }
      const url = requireSlug(rest[1])
      const { bundleDir, capture } = await cmdCapturePage(url, global)
      console.log(
        `Captured ${url} → ${bundleDir}\n  ${capture.sections.length} section(s), ${capture.assets.length} asset(s)`,
      )
      return
    }

    case 'shot': {
      const targetUrl = typeof flags.url === 'string' ? flags.url : undefined
      const slug = targetUrl ? undefined : requireSlug(rest[0])
      const source = flags.source === 'published' ? 'published' : 'draft'
      const viewport = parseViewport(flags.viewport)
      const { outFile, url: shotUrl, viewport: vp } = await cmdShot({
        ...global,
        slug,
        url: targetUrl,
        source,
        viewport,
        out: typeof flags.out === 'string' ? flags.out : undefined,
      })
      console.log(`Shot ${shotUrl} @ ${vp.width}×${vp.height} → ${outFile}`)
      return
    }

    case 'values-diff': {
      const ref = typeof flags.ref === 'string' ? flags.ref : undefined
      if (!ref) {
        console.error('values-diff requires --ref <captureBundleDir>.\n\n' + USAGE)
        process.exitCode = 1
        return
      }
      const actualPath = typeof flags.actual === 'string' ? flags.actual : undefined
      const slug = actualPath ? undefined : requireSlug(rest[0])
      const source: RenderChannel = flags.source === 'published' ? 'published' : 'draft'
      // REQ-35 tolerance flags: `--strict` for an exact pass, or per-metric
      // numeric overrides (`--color-tol`, `--line-height-tol`, …).
      const numFlag = (name: string): number | undefined => {
        const v = flags[name]
        if (typeof v !== 'string') return undefined
        const n = Number(v)
        if (Number.isNaN(n)) throw new Error(`--${name} expects a number, got '${v}'.`)
        return n
      }
      const diffOptions = {
        strict: flags.strict === true,
        colorTolerance: numFlag('color-tol'),
        fontSizeTolerancePx: numFlag('font-size-tol'),
        lineHeightTolerancePx: numFlag('line-height-tol'),
        letterSpacingTolerancePx: numFlag('letter-spacing-tol'),
        paddingTolerancePx: numFlag('padding-tol'),
        borderWidthTolerancePx: numFlag('border-tol'),
        fontWeightTolerance: numFlag('weight-tol'),
      }
      const report = await cmdValuesDiff({
        ...global,
        slug,
        source,
        refBundleDir: ref,
        actualManifestPath: actualPath,
        out: typeof flags.out === 'string' ? flags.out : undefined,
        diffOptions,
      })
      if (flags.json === true) {
        console.log(JSON.stringify(report, null, 2))
      } else {
        console.log(formatReport(report))
      }
      // A non-empty diff is a fidelity failure the operator must clear.
      if (report.deltas.length > 0) process.exitCode = 1
      return
    }

    case 'page':
    case 'config':
    case 'asset':
    case 'status': {
      const json = flags.json === true
      try {
        emit(dispatchEdit(command, rest, flags, global), json)
      } catch (err) {
        fail(err, json)
      }
      return
    }

    default:
      console.error(`Unknown command: ${command}\n\n${USAGE}`)
      process.exitCode = 1
      return
  }
}

/** Route a structured-edit command to its handler; throws {@link CommandError}. */
function dispatchEdit(
  command: string,
  rest: string[],
  flags: Record<string, string | boolean>,
  global: GlobalOptions,
): EditOutput {
  const str = (name: string): string | undefined => {
    const v = flags[name]
    return typeof v === 'string' ? v : undefined
  }
  const force = flags.force === true

  if (command === 'status') {
    return editStatus(requireArg(rest[0], 'slug'), global)
  }

  const sub = rest[0]
  const slug = requireArg(rest[1], 'slug')

  if (command === 'page') {
    const writeOpts = { ...global, title: str('title'), path: str('path') }
    switch (sub) {
      case 'list':
        return editPageList(slug, global)
      case 'get':
        return editPageGet(slug, requireArg(rest[2], 'pageId'), global)
      case 'add':
        return editPageAdd(slug, requireArg(rest[2], 'pageId'), writeOpts)
      case 'update':
        return editPageUpdate(slug, requireArg(rest[2], 'pageId'), writeOpts)
      case 'rm':
        return editPageRm(slug, requireArg(rest[2], 'pageId'), { ...global, force })
      default:
        throw unknownSub('page', sub)
    }
  }

  if (command === 'config') {
    switch (sub) {
      case 'get':
        return editConfigGet(slug, rest[2], global)
      case 'set':
        return editConfigSet(slug, requireArg(rest[2], 'key'), requireArg(rest[3], 'value'), global)
      default:
        throw unknownSub('config', sub)
    }
  }

  // command === 'asset'
  switch (sub) {
    case 'list':
      return editAssetList(slug, global)
    case 'get':
      return editAssetGet(slug, requireArg(rest[2], 'assetName'), global)
    case 'add':
      return editAssetAdd(slug, requireArg(rest[2], 'file'), { ...global, as: str('as') })
    case 'rm':
      return editAssetRm(slug, requireArg(rest[2], 'assetName'), { ...global, force })
    default:
      throw unknownSub('asset', sub)
  }
}

/** Print a success result: a `{ok,data}` envelope in JSON mode, else the human text. */
function emit(out: EditOutput, json: boolean): void {
  if (json) {
    console.log(JSON.stringify({ ok: true, data: out.data }))
  } else if (out.human) {
    console.log(out.human)
  }
}

/** Print a failure: a `{ok:false,error}` envelope in JSON mode, else a human line. Sets exit code. */
function fail(err: unknown, json: boolean): void {
  const ce =
    err instanceof CommandError
      ? err
      : new CommandError({ code: 'INTERNAL', message: err instanceof Error ? err.message : String(err) })
  if (json) {
    console.log(JSON.stringify({ ok: false, error: ce.toEnvelope() }))
  } else {
    console.error(ce.toHuman())
  }
  process.exitCode = EXIT_CODES[ce.code]
}

function unknownSub(command: string, sub: string | undefined): CommandError {
  return new CommandError({
    code: 'INTERNAL',
    message: `Unknown '${command}' subcommand: ${sub ?? '(none)'}`,
    hint: 'See `1c help` for usage.',
  })
}

/** Validate a `--viewport` flag against the known presets (default desktop). */
function parseViewport(val: string | boolean | undefined): ViewportName {
  if (typeof val !== 'string') return 'desktop'
  if (!(val in VIEWPORTS)) {
    throw new Error(`Invalid --viewport '${val}'. Use ${Object.keys(VIEWPORTS).join('|')}.`)
  }
  return val as ViewportName
}

function requireSlug(slug: string | undefined): string {
  if (!slug) {
    throw new Error('Missing required <slug> argument.')
  }
  return slug
}

/** Require a positional arg or throw a structured (enveloped) error. */
function requireArg(val: string | undefined, name: string): string {
  if (val === undefined || val === '') {
    throw new CommandError({
      code: 'INTERNAL',
      message: `Missing required <${name}> argument.`,
      hint: 'See `1c help` for usage.',
    })
  }
  return val
}

export { InvalidDefinitionError }
