// Extrai o texto de um PDF no NAVEGADOR (pdfjs-dist), para enviar à IA como texto
// (rápido) em vez de mandar o PDF inteiro como imagem (visão — lento, estoura timeout).
import * as pdfjsLib from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc

/**
 * @param {File} file PDF
 * @returns {Promise<string>} texto extraído (vazio se for PDF escaneado/sem texto)
 */
export async function extrairTextoPdf(file) {
  const buf = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise
  let texto = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const linha = content.items.map(it => (it.str ?? '')).join(' ')
    texto += linha + '\n'
  }
  return texto.replace(/\s+\n/g, '\n').trim()
}
