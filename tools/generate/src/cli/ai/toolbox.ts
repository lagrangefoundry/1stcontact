/**
 * The L1 control surface as NODE gets it (REQ-146).
 *
 * `toolbox-core.ts` holds the surface itself: the declaration, every operation
 * that goes through the {@link SiteStore} port, the bound `L1Toolbox` class and
 * the Toolbox construction. None of it names a filesystem, so all of it loads in
 * workerd.
 *
 * THIS FILE IS THE PART THAT CANNOT. It supplies, for a host that has a disk:
 *
 *   - the library, resolved out of the out-of-repo shared store by file URL;
 *   - the filesystem {@link SiteStore} adapter;
 *   - the one operation that genuinely needs a disk — `add_asset`, which reads
 *     a file the operator names;
 *   - the append-only file audit sink;
 *   - the system KB bridge, itself loaded by file URL.
 *
 * WHY A SPLIT RATHER THAN A FLAG. It is not a preference: a Worker that imports
 * this file imports `../commands`, which reaches the filesystem store and through
 * it `node:fs`. (Louder still before REQ-148/150 removed Astro from the render
 * path: `../commands` pulled the Astro module registry and the bundle failed
 * outright on `No loader is configured for ".astro" files`. The bundle error went
 * with it; the reason for the split did not.) Reachability is decided by the
 * import graph, not by which branch runs — so the only way for the Worker not to
 * carry this is for the Worker not to import it.
 *
 * It is also the split upstream already made for the same reason and describes
 * in the same terms: `FileArchive` moved out of `archive.js` into
 * `file_archive.js` (lagrange-framework REQ-103) "so that this module, the port
 * and its runtime-agnostic adapters stay loadable where there is no filesystem".
 *
 * THE PUBLIC NAMES ARE UNCHANGED. Everything that imported `./toolbox` before
 * still imports `./toolbox`, still gets `createL1Toolbox(slug, opts)` with the
 * filesystem behind it, and still gets `fileAuditSink`, `aiCore` and
 * `L1_DECLARATION`. The Worker imports `./toolbox-core` instead and supplies its
 * own adapters.
 */

import { appendFileSync, mkdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import type { GlobalOptions } from '../commands'
import { ctxOf } from '../commands'
import { fsSiteStore } from '../../store'
import { CommandError } from '../errors'
import { sharedModuleUrl } from '../webui'
import { SYSTEM_KB } from '../kb'
import { CARETAKER_ROLE } from './roles'
import {
  createL1Toolbox as createL1ToolboxCore,
  opt,
  req,
  type AiLibrary,
  type AuditLine,
  type L1Operations,
  type Params,
} from './toolbox-core'
import type { EditOptions } from '../edit'
import { editAssetAdd } from '../edit'

export * from './toolbox-core'

/**
 * The AI library's SDK-free entry point.
 *
 * `./core` rather than the package root: the Toolbox is all this needs, and the
 * root self-registers the provider backends. Loaded through
 * {@link sharedModuleUrl} rather than by bare specifier because a bare one
 * resolves the shared store from the main checkout and finds nothing from a
 * linked `git worktree`.
 */
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any
let core: Promise<Untyped> | null = null
export function aiCore(): Promise<Untyped> {
  if (!core) core = import(/* @vite-ignore */ sharedModuleUrl('ai', './core'))
  return core
}

/**
 * Read a file the operator named, as bytes.
 *
 * NODE ONLY, and the reason it is a whole operation rather than a parameter: a
 * path is meaningless to a runtime with no filesystem, so this is the one place
 * in the surface where "the file at /x/y" is a thing that can be resolved. What
 * crosses into `edit.ts` is bytes.
 *
 * The refusal is the same `CommandError` `editAssetAdd` used to raise, with the
 * same code, path and hint — the envelope a caller sees is unchanged by the
 * layer that produces it.
 */
function readSourceFile(file: string): { name: string; bytes: Uint8Array } {
  try {
    return { name: path.basename(file), bytes: new Uint8Array(readFileSync(file)) }
  } catch {
    throw new CommandError({
      code: 'NOT_FOUND',
      message: `Source file '${file}' does not exist.`,
      path: file,
      hint: 'Pass a path to a readable file.',
    })
  }
}

/**
 * The operation only a host with a disk can implement.
 *
 * ONE, SINCE REQ-149. `publish` was the other, because publishing meant copying a
 * directory tree; it is a sequence of port verbs now, so it moved to
 * `toolbox-core.ts` and works against whichever store the host has. What is left
 * is `add_asset`, which reads a file the operator names — genuinely a disk.
 *
 * IT IS NOT GRANTED TO THE CARETAKER. `instances.json` withholds `ManageAssets`,
 * so the manual never mentions it and the model cannot propose it; it is declared
 * because the surface declares the whole API and the grant narrows it (DOC-30).
 * Supplying it here keeps that true for Node while making its absence in a Worker
 * a fact about the runtime rather than a second declaration.
 */
export function nodeOperations(slug: string, opts: EditOptions): Partial<L1Operations> {
  return {
    add_asset: async (p: Params) => {
      const source = readSourceFile(req(p, 'file'))
      const out = await editAssetAdd(slug, opt(p, 'as') ?? source.name, source.bytes, opts)
      return { ...(out.data as object), now: out.at }
    },
  }
}

/**
 * Where a site's tool calls are recorded.
 *
 * Beside the transcripts they belong to, and gitignored with them: these are a
 * record of what an assistant did to one operator's site, not something a
 * checkout should carry. DOC-20 S6 calls this "the minimum needed to operate an
 * AI that edits customer-facing sites", which is a description of this product;
 * nothing recorded it before.
 */
export function auditPath(opts: GlobalOptions): string {
  return path.join(ctxOf(opts).cwd, 'storage', 'chat', 'audit.jsonl')
}

/**
 * A sink that appends one JSON line per call.
 *
 * Deliberately dumb. The Toolbox swallows a sink's own failure — an audit
 * backend being down is not a reason to fail a call the policy already
 * allowed — so this does the smallest thing that survives a crash mid-turn:
 * one line, appended, flushed.
 */
export function fileAuditSink(opts: GlobalOptions): (record: { asObject(): AuditLine }) => void {
  const file = auditPath(opts)
  return (record) => {
    mkdirSync(path.dirname(file), { recursive: true })
    appendFileSync(file, `${JSON.stringify(record.asObject())}\n`)
  }
}

/**
 * Construct the Toolbox for one site and one role, with Node's adapters.
 *
 * The signature every existing caller already uses. What it adds over the core
 * is exactly the four things a disk makes possible: the library, the filesystem
 * store, the Node-only operations, and the KB bridge.
 */
export async function createL1Toolbox(
  slug: string,
  opts: GlobalOptions = {},
  {
    role = CARETAKER_ROLE,
    config = null,
    audit = null,
    session = null,
    knowledge = null,
    lib = null,
    store = null,
  }: {
    role?: string
    config?: Record<string, unknown> | null
    audit?: ((record: { asObject(): AuditLine }) => void) | null
    session?: string | null
    /** A `KnowledgeRuntime`, or `null` when the KB has not been built. */
    knowledge?: Untyped | null
    lib?: AiLibrary | null
    store?: Untyped | null
  } = {},
): Promise<Untyped> {
  const resolved = lib ?? (await aiCore())
  const siteStore = store ?? fsSiteStore(ctxOf(opts))
  const editOpts = { ...opts, store: siteStore } as EditOptions

  // The bridge is loaded HERE rather than in the core, for the same reason the
  // library is: it lives in the shared artifact store and is reached by file
  // URL. The core takes the constructed surface and the grant that travels with
  // it, and never learns where either came from.
  let knowledgeSurface: { surface: Untyped; granted: Record<string, unknown> } | null = null
  if (knowledge !== null) {
    const bridge = await import(/* @vite-ignore */ sharedModuleUrl('ai-knowledge'))
    knowledgeSurface = {
      surface: new bridge.KnowledgeToolbox(knowledge),
      // `knowledgeInstanceConfig` at the package root; `instanceConfig` is the
      // name inside the module it comes from.
      granted: bridge.knowledgeInstanceConfig([SYSTEM_KB]),
    }
  }

  return createL1ToolboxCore(slug, opts, {
    role,
    config,
    audit,
    session,
    lib: resolved,
    store: siteStore,
    extraOps: nodeOperations(slug, editOpts),
    knowledgeSurface,
  })
}
