/**
 * exportar.js — exportação do relatório
 *  - imprimir()    : abre o diálogo de impressão (e "Salvar como PDF" pelo navegador)
 *  - baixarWord()  : gera um .doc (HTML compatível com Word) editável
 *
 * Mantém-se sem dependências externas. Um gerador de PDF real (selecionável)
 * pode ser adicionado depois, se necessário.
 */

export function imprimir() {
  window.print()
}

/**
 * Baixa o conteúdo de um elemento como .doc (abre e edita no Word).
 * @param elementId id do container do relatório
 * @param filename  nome do arquivo (sem extensão)
 */
export function baixarWord(elementId, filename = 'relatorio-calculo') {
  const el = document.getElementById(elementId)
  if (!el) return
  const conteudo = el.innerHTML

  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${filename}</title>
  <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
  <style>
    @page { size: A4; margin: 2cm; }
    body { font-family: 'Calibri', Arial, sans-serif; font-size: 11pt; color: #111; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #999; padding: 4px 6px; font-size: 9pt; }
    th { background: #f0f4f8; text-align: left; }
    h1,h2,h3 { color: #0b5; }
    .mono { font-family: 'Consolas', monospace; }
    .right { text-align: right; }
  </style>
</head>
<body>${conteudo}</body>
</html>`

  const blob = new Blob(['﻿', html], { type: 'application/msword' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.doc`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
