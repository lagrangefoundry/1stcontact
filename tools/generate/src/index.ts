/**
 * `@1stcontact/generate` — the `1c` CLI: file-backed site storage, versioning,
 * and the server-side render pipeline (REQ-9, DOC-12 / DOC-7 §2.4).
 */
export * from './store'
export { renderSite } from './render'
export type { ModuleResolver, RenderSiteOptions } from './render'
export * from './cli'
export * from './conformance'
// L1 round-trip gate (REQ-82) — render/serve/capture an L1 doc + diff vs L1.
export * from './l1'
// Re-export the module catalog accessor so consumers (and the conformance
// self-tests) can reach a real module's contract without a direct framework
// dependency — the generate package already renders against this catalog.
export { getModule } from '@1stcontact/framework'
// Re-export the content-safety boundary (REQ-46) and the markdown renderer so the
// hardening unit tests can exercise them as runtime values through this package.
export {
  ContentSafetyError,
  isUnsafeUrl,
  assertSafeUrl,
  assertSafeHtml,
  renderMarkdown,
} from '@1stcontact/framework'
