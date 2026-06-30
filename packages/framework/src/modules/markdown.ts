import { createMarkdownProcessor, type MarkdownRenderer } from '@astrojs/markdown-remark'

/**
 * Markdown → HTML rendering for content fields typed `markdown` (DOC-7 §3.2).
 *
 * The processor is the same remark/rehype stack Astro uses for `.md` files, so
 * module-authored markdown renders identically to page content. It is created
 * lazily and memoised: construction is relatively expensive (it wires the full
 * plugin chain) and the result is a pure function of its input, so one instance
 * is shared for the lifetime of the build / dev server.
 */
let processor: Promise<MarkdownRenderer> | undefined

function getProcessor(): Promise<MarkdownRenderer> {
  // GFM is on by default; syntax highlighting is left at the default theme.
  // Raw HTML in content fields is the validator's concern (DOC-7 §6.5 layer 1),
  // not this renderer's — we render trusted, already-validated markdown.
  processor ??= createMarkdownProcessor({})
  return processor
}

/** `<img>` without an explicit `loading` attribute, so we can default it lazy. */
const BARE_IMG = /<img(?![^>]*\bloading=)([^>]*)>/g

/**
 * Render a markdown string to an HTML fragment suitable for `set:html`.
 *
 * Images gain `loading="lazy"` + `decoding="async"` for free responsive
 * behaviour (DOC-7's mobile-first default). `srcset` generation depends on the
 * asset pipeline and is deferred to a later REQ; lazy loading is the portion
 * available without it.
 */
export async function renderMarkdown(md: string): Promise<string> {
  const { code } = await (await getProcessor()).render(md)
  return code.replace(BARE_IMG, '<img loading="lazy" decoding="async"$1>')
}
