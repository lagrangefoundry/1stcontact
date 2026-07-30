import path from 'node:path'
import { ctxOf, cmdRender, type GlobalOptions } from '../cli/commands'
import {
  draftDir,
  liveRevision,
  padRevision,
  readDraftBase,
  readHistory,
  revisionDir,
  type RenderChannel,
} from '../store'
import { collectSnapshotFiles, formatBytes, snapshotSha, type SnapshotFile } from './content'
import {
  readManifest,
  writeManifest,
  type ManifestPreview,
  type ManifestRevision,
  type SiteManifest,
} from './manifest'
import { contentTypeFor, DEPLOY_BUCKET, WranglerR2Client, type R2Client } from './r2'

/**
 * `1c deploy` (REQ-110) — ship a rendered snapshot to R2 so it can be seen by
 * someone other than the operator.
 *
 * This migrates **serving, not storing**. Site definitions stay canonical on the
 * laptop and authoring is unchanged; moving the canonical store to D1 while
 * authoring is local would create a bidirectional sync problem that no end state
 * has. What crosses the wire is the artifact DOC-12 already defines: an
 * immutable, complete snapshot (`out/` + `source/`).
 */

/** Origin the shareable URLs are formed against. */
export const DEPLOY_BASE_URL = 'https://1stcontact.io'

/**
 * One labelled line of the deploy report. Every stage names itself, so a deploy
 * is readable as a sequence of things that happened rather than one spinner.
 */
export interface DeployStage {
  /** Stage name: `render`, `hash`, `upload`, `manifest`, `prune`. */
  label: string
  /** Primary subject — a path, a snapshot id, an object key. */
  target: string
  /** Trailing detail: file count + size, or a note. */
  note?: string
}

export interface DeployResult {
  slug: string
  channel: RenderChannel
  /** Content-addressed id of the deployed bytes. */
  sha: string
  /** Revision shipped, for `--channel published`; null for a draft preview. */
  revision: number | null
  /** Key prefix the snapshot lives under, e.g. `sites/acme/preview/a1b2c3d4e5f6`. */
  prefix: string
  /** The shareable URL the deploy resolves to. */
  url: string
  stages: DeployStage[]
  /** Object keys written this run (empty when unchanged or on `--dry-run`). */
  uploadedKeys: string[]
  /** True when the content was already deployed and nothing needed uploading. */
  alreadyDeployed: boolean
  /** Object keys `--prune` removed (or would remove, under `--dry-run`). */
  prunedKeys: string[]
  dryRun: boolean
}

export interface DeployOptions extends GlobalOptions {
  /** `draft` → a preview snapshot (default); `published` → the latest revision. */
  channel?: RenderChannel
  /** Print the full plan and write nothing. */
  dryRun?: boolean
  /** Delete snapshot objects the manifest does not reference. */
  prune?: boolean
  /** R2 boundary; defaults to the `wrangler`-backed client. Injected by tests. */
  client?: R2Client
  /** Origin for the shareable URL (default {@link DEPLOY_BASE_URL}). */
  baseUrl?: string
  /** ISO timestamp to record (injectable for deterministic tests). */
  now?: string
}

/**
 * Render, hash, upload, and index a snapshot.
 *
 * Rendering happens on every run without an opt-out: there must be no way to
 * ship stale bytes, so `dist/` is never trusted as an input.
 */
export async function cmdDeploy(slug: string, opts: DeployOptions = {}): Promise<DeployResult> {
  const ctx = ctxOf(opts)
  const channel: RenderChannel = opts.channel ?? 'draft'
  const dryRun = opts.dryRun === true
  const baseUrl = (opts.baseUrl ?? DEPLOY_BASE_URL).replace(/\/+$/, '')
  const client = opts.client ?? new WranglerR2Client({ bucket: DEPLOY_BUCKET, cwd: ctx.cwd })
  const stages: DeployStage[] = []

  // `publish` mints the revision; `deploy` ships it. A published deploy with no
  // revision to ship is refused by name rather than silently shipping the draft.
  const history = readHistory(ctx, slug)
  const live = liveRevision(history)
  if (channel === 'published' && live === null) {
    throw new Error(
      `Site '${slug}' has no revisions to deploy.\n` +
        `Run \`1c publish ${slug}\`${opts.sandbox ? ' --sandbox' : ''} first — ` +
        `publish mints the revision, deploy ships it.`,
    )
  }

  // ── render ────────────────────────────────────────────────────────────────
  const { outDir, files: rendered } = await cmdRender(slug, {
    cwd: opts.cwd,
    sandbox: opts.sandbox,
    source: channel === 'draft' ? 'draft' : 'latest',
  })
  const sourceDir = channel === 'draft' ? draftDir(ctx, slug) : revisionDir(ctx, slug, live as number)

  // ── hash ──────────────────────────────────────────────────────────────────
  const files = collectSnapshotFiles(outDir, sourceDir)
  const sha = snapshotSha(files)
  const prefix =
    channel === 'draft'
      ? `sites/${slug}/preview/${sha}`
      : `sites/${slug}/rev/${padRevision(live as number)}`

  const outFiles = files.filter((f) => f.rel.startsWith('out/'))
  stages.push({
    label: 'render',
    target: path.relative(ctx.cwd, outDir) || outDir,
    note: fileCount(outFiles),
  })

  const { manifest, raw } = await readManifest(client, slug)
  let current: SiteManifest = manifest
  const alreadyDeployed =
    channel === 'draft'
      ? manifest.previews.some((p) => p.sha === sha)
      : manifest.live === live && manifest.revisions.some((r) => r.id === live && r.sha === sha)

  stages.push({
    label: 'hash',
    target: sha,
    note: alreadyDeployed ? '(already deployed — nothing to upload)' : undefined,
  })

  // ── upload ────────────────────────────────────────────────────────────────
  const uploadedKeys: string[] = []
  if (!alreadyDeployed) {
    for (const group of ['out', 'source'] as const) {
      stages.push({
        label: 'upload',
        target: `${shortPrefix(prefix)}/${group}`,
        note: fileCount(files.filter((f) => f.rel.startsWith(`${group}/`))),
      })
    }
    const keys = files.map((f) => `${prefix}/${f.rel}`)
    if (!dryRun) {
      // Recorded before the first byte moves: an interrupted deploy then leaves
      // keys the manifest never references, which is exactly what `--prune`
      // exists to collect.
      await client.record(keys)
      for (const f of files) {
        const key = `${prefix}/${f.rel}`
        await client.put(key, f.abs, contentTypeFor(key))
        uploadedKeys.push(key)
      }
    }
  }

  // ── manifest ──────────────────────────────────────────────────────────────
  const now = opts.now ?? new Date().toISOString()
  if (!alreadyDeployed) {
    const next = applyToManifest(manifest, { channel, slug, sha, now, live, ctx })
    stages.push(
      channel === 'draft'
        ? {
            label: 'manifest',
            target: `+ preview ${sha}`,
            note: `(basedOn ${basedOnLabel(readDraftBase(ctx, slug).basedOn)})`,
          }
        : {
            label: 'manifest',
            target: `+ rev ${padRevision(live as number)} ${sha}`,
            note: `(live = ${live})`,
          },
    )
    if (!dryRun) await writeManifest(client, slug, next, raw)
    current = next
  }

  // ── prune ─────────────────────────────────────────────────────────────────
  const prunedKeys: string[] = []
  if (opts.prune === true) {
    const unreferenced = await unreferencedKeys(client, slug, current)
    for (const key of unreferenced) {
      stages.push({ label: 'prune', target: `- ${shortKey(slug, key)}` })
      if (!dryRun) await client.delete(key)
      prunedKeys.push(key)
    }
    if (unreferenced.length === 0) {
      stages.push({ label: 'prune', target: 'nothing unreferenced' })
    }
  }

  const url =
    channel === 'draft'
      ? `${baseUrl}/site/${slug}/draft/${sha}/`
      : `${baseUrl}/site/${slug}/`

  return {
    slug,
    channel,
    sha,
    revision: channel === 'published' ? (live as number) : null,
    prefix,
    url,
    stages,
    uploadedKeys,
    alreadyDeployed,
    prunedKeys,
    dryRun,
  }
}

/** Append the preview, or upsert the revision and move `live`, without mutating input. */
function applyToManifest(
  manifest: SiteManifest,
  args: {
    channel: RenderChannel
    slug: string
    sha: string
    now: string
    live: number | null
    ctx: ReturnType<typeof ctxOf>
  },
): SiteManifest {
  const { channel, slug, sha, now, live, ctx } = args
  if (channel === 'draft') {
    const preview: ManifestPreview = {
      sha,
      createdAt: now,
      basedOn: readDraftBase(ctx, slug).basedOn,
    }
    return { ...manifest, slug, previews: [...manifest.previews, preview] }
  }
  const entry = readHistory(ctx, slug).revisions.find((r) => r.id === live)
  const revision: ManifestRevision = {
    id: live as number,
    publishedAt: entry?.publishedAt ?? now,
    message: entry?.message ?? '',
    sha,
  }
  const revisions = [...manifest.revisions.filter((r) => r.id !== revision.id), revision].sort(
    (a, b) => a.id - b.id,
  )
  return { ...manifest, slug, live: revision.id, revisions }
}

/**
 * Snapshot objects present in the bucket that no manifest entry points at.
 *
 * These are orphans: a snapshot whose upload or manifest write was interrupted.
 * The manifest itself is never a candidate — only keys under a `preview/` or
 * `rev/` prefix are, so a stray object elsewhere under the slug is left alone
 * rather than swept up by a garbage collector that does not understand it.
 */
async function unreferencedKeys(
  client: R2Client,
  slug: string,
  manifest: SiteManifest,
): Promise<string[]> {
  const referenced = [
    ...manifest.previews.map((p) => `sites/${slug}/preview/${p.sha}/`),
    ...manifest.revisions.map((r) => `sites/${slug}/rev/${padRevision(r.id)}/`),
  ]
  const snapshotRoots = [`sites/${slug}/preview/`, `sites/${slug}/rev/`]
  const keys = await client.list(`sites/${slug}/`)
  return keys.filter(
    (k) => snapshotRoots.some((r) => k.startsWith(r)) && !referenced.some((r) => k.startsWith(r)),
  )
}

/** `13 files   498.5 KB` — the trailing note every file-moving stage carries. */
function fileCount(files: readonly SnapshotFile[]): string {
  const bytes = files.reduce((n, f) => n + f.bytes, 0)
  return `${files.length} files   ${formatBytes(bytes)}`
}

/** `sites/acme/preview/abc` → `preview/abc` (the report drops the slug scope). */
function shortPrefix(prefix: string): string {
  return prefix.split('/').slice(2).join('/')
}

function shortKey(slug: string, key: string): string {
  return key.startsWith(`sites/${slug}/`) ? key.slice(`sites/${slug}/`.length) : key
}

function basedOnLabel(basedOn: number | null): string {
  return basedOn === null ? 'no revision' : `rev ${basedOn}`
}

/** The human report: one labelled, column-aligned line per stage, ending in the URL. */
export function formatDeployReport(result: DeployResult): string {
  const width = result.stages.reduce((w, s) => Math.max(w, s.target.length), 0)
  const lines = result.stages.map((s) =>
    (`  ${s.label.padEnd(10)} ${s.note ? s.target.padEnd(width) : s.target}` +
      (s.note ? `   ${s.note}` : '')).trimEnd(),
  )
  if (result.dryRun) lines.push('', '  (dry-run — nothing was uploaded)')
  lines.push('', `  →  ${result.url}`)
  return lines.join('\n')
}
