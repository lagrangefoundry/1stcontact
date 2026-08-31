/**
 * The bytes REQ-163's ingestion suites feed the pipeline.
 *
 * SHARED BECAUSE BOTH RUNTIMES NEED THEM. The node suite proves the describers
 * and the fetch guard; the workerd suite proves the routes and the store against
 * real D1 and R2. They must describe the SAME bytes, or "the pipeline stores what
 * the describer described" is two claims about two files.
 *
 * BUILT RATHER THAN CHECKED IN, for the PDF. A committed binary fixture is a
 * fixture nobody can read in a diff, and the interesting property here is that
 * the file genuinely contains a sentence — which a generator states in one line
 * and a checked-in blob hides. The font is checked in already
 * (`tests/fixtures/capture/heading-font.ttf`) because a real SFNT name table is
 * exactly the thing that cannot be usefully faked.
 */

/**
 * A minimal, real PDF carrying `text`, and a `/Title` in its info dictionary.
 *
 * REAL, NOT A STUB. pdf.js parses this: the xref table is computed from actual
 * byte offsets, the content stream declares its own length, and the page tree is
 * complete. A fixture that only LOOKED like a PDF would prove nothing about
 * `unpdf`, which is the dependency the ticket asks to be justified.
 */
export function minimalPdf(text: string, title = 'Brand guidelines'): Uint8Array {
  const content = `BT /F1 24 Tf 72 700 Td (${text}) Tj ET`
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] ' +
      '/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Title (${title}) >>`,
  ]
  let body = '%PDF-1.4\n'
  const offsets: number[] = []
  objects.forEach((object, i) => {
    offsets.push(body.length)
    body += `${i + 1} 0 obj\n${object}\nendobj\n`
  })
  const xref = body.length
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const offset of offsets) body += `${String(offset).padStart(10, '0')} 00000 n \n`
  body +=
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 6 0 R >>\n` +
    `startxref\n${xref}\n%%EOF\n`
  return new TextEncoder().encode(body)
}

/**
 * A PDF with a page and no text at all — the scanned case.
 *
 * A real scan is a page-sized image and this is an empty page, but what the
 * pipeline observes is identical: extraction runs, succeeds, and yields nothing.
 * That is the branch under test, and a 4MB photograph of a page would prove the
 * same thing more slowly.
 */
export function scannedPdf(): Uint8Array {
  return minimalPdf('', 'Scan')
}

/** Whatever the caller says, as bytes. */
export function bytesOf(text: string): Uint8Array {
  return new TextEncoder().encode(text)
}
