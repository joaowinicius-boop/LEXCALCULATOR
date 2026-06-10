# -*- coding: utf-8 -*-
import re, zipfile, os

DOCTAG = open('_mdx/word/document.xml', encoding='utf-8').read()
doctag = re.search(r'<w:document[^>]*>', DOCTAG).group(0)
sectpr = re.search(r'<w:sectPr[^>]*>.*?</w:sectPr>', DOCTAG, re.S).group(0)

def esc(s): return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

RP = '<w:rFonts w:ascii="Cambria" w:eastAsia="Cambria" w:hAnsi="Cambria" w:cs="Times New Roman"/>'
def rpr(b=False): return '<w:rPr>' + RP + ('<w:b/><w:bCs/>' if b else '') + '<w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>'
def run(t, b=False): return '<w:r>' + rpr(b) + '<w:t xml:space="preserve">' + esc(t) + '</w:t></w:r>'
def para(runs, jc='both', after='120', firstline=None):
    pPr = '<w:pPr><w:spacing w:after="%s" w:line="276" w:lineRule="auto"/>' % after
    if firstline: pPr += '<w:ind w:firstLine="%s"/>' % firstline
    pPr += '<w:jc w:val="%s"/>' % jc + rpr() + '</w:pPr>'
    body = ''.join(runs) if isinstance(runs, list) else runs
    return '<w:p>' + pPr + body + '</w:p>'
def empty(): return '<w:p><w:pPr><w:spacing w:after="0" w:line="276" w:lineRule="auto"/>' + rpr() + '</w:pPr></w:p>'

TBLPR = ('<w:tblPr><w:tblW w:w="8494" w:type="dxa"/><w:jc w:val="center"/>'
 '<w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>'
 '<w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>'
 '<w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/></w:tblBorders>'
 '<w:tblLayout w:type="fixed"/></w:tblPr><w:tblGrid><w:gridCol w:w="4238"/><w:gridCol w:w="4256"/></w:tblGrid>')
def cellp(t, b=True):
    return '<w:p><w:pPr><w:spacing w:line="240" w:lineRule="auto"/><w:jc w:val="center"/>' + rpr(b) + '</w:pPr>' + run(t, b) + '</w:p>'
def tc(t, w='4238', b=True, span=False):
    pr = '<w:tcPr><w:tcW w:w="%s" w:type="dxa"/>' % w + ('<w:gridSpan w:val="2"/>' if span else '') + '</w:tcPr>'
    return '<w:tc>' + pr + cellp(t, b) + '</w:tc>'
def row(cells):
    return '<w:tr><w:trPr><w:jc w:val="center"/></w:trPr>' + ''.join(cells) + '</w:tr>'

table = ('<w:tbl>' + TBLPR
  + row([tc('DANO MORAL (principal)', '4238', True), tc('VALOR ATUALIZADO (cálculo anexo)', '4256', True)])
  + row([tc('((MORAL_ORIG))', '4238', False), tc('((MORAL_ATU))', '4256', True)])
  + row([tc('DANO MATERIAL INICIAL', '4238', True), tc('VALOR ATUALIZADO', '4256', True)])
  + row([tc('((MATERIAL_ORIG))', '4238', False), tc('((MATERIAL_ATU))', '4256', True)])
  + row([tc('HONORÁRIOS DE SUCUMBÊNCIA', '8494', True, span=True)])
  + row([tc('((HONORARIOS))', '8494', True, span=True)])
  + row([tc('TOTAL ATUALIZADO', '8494', True, span=True)])
  + row([tc('((TOTAL_EXT))', '8494', True, span=True)])
  + '</w:tbl>')

P = []
P.append(para([run('AO JUÍZO DE DIREITO DA ((VARA)).', True)]))
P.append(empty())
P.append(para([run('Processo nº ((PROCESSO))', True)]))
P.append(empty())
P.append(para([run('((CLIENTE))', True), run(', já qualificado(a) nos autos, vem, respeitosamente, perante Vossa Excelência, por intermédio do seu advogado abaixo-assinado, considerando o trânsito em julgado, manifestar-se nos seguintes termos:', False)]))
P.append(para([run('DOS CÁLCULOS DA EXECUÇÃO', True)]))
P.append(para([run('((FRASE_MORAL))', False)]))
P.append(para([run('((FRASE_MATERIAL))', False)]))
P.append(para([run('((FRASE_HONORARIOS))', False)]))
P.append(para([run('Assim sendo, apresenta-se planilha abaixo, com os débitos devidamente discriminados:', False)]))
P.append(table)
P.append(empty())
P.append(para([run('Assim sendo, requer-se que seja a parte Executada, intimada a realizar o pagamento da condenação, bem como a COMPROVAR o depósito da quantia de ((TOTAL_EXT)), aos autos do processo, no prazo de 15 (quinze) dias úteis, sob pena de penhora, nos termos do art. 523, CPC/15, razão pela qual, prezando pela celeridade processual, apresenta-se os dados abaixo, para fins de transferência de valores:', False)], firstline='1701'))
P.append(para([run('NICOLAS SANTOS CARVALHO GOMES, OAB/AM 8.926, diretamente para a seguinte conta do escritório NICOLAS GOMES SOCIEDADE INDIVIDUAL DE ADVOCACIA (OAB/AM 796/2022):', True)], firstline='1701'))
for t in ['Banco: SICREDI (748)', 'Agência: 0802', 'Conta Corrente: 79472-8', 'CNPJ: 46.533.658/0001-60']:
    P.append(para([run(t, True)], jc='center', after='0'))
P.append(empty())
P.append(para([run('Caso não ocorra o pagamento voluntário, pugna-se, automaticamente, desde já, o cumprimento forçado da obrigação, com acréscimo das penalidades previstas no Art. 523, § 1º e 3º, do CPC, devendo o alvará ser expedido em favor do patrono do Autor.', True)], firstline='1701'))
P.append(para([run('II. CONCLUSÃO', True)]))
P.append(para([run('Requer, portanto, a intimação do Requerido para apresentar e COMPROVAR o pagamento voluntário da condenação no prazo legal, no valor de ((TOTAL_EXT)), conforme cálculo anexo, sob pena de pagamento de multa nos termos do art. 523, CPC/15, conforme cálculo anexo.', False)], firstline='1701'))
P.append(empty()); P.append(empty()); P.append(empty())
P.append(para([run('Nestes termos, pede deferimento.', False)], jc='center', after='0'))
P.append(para([run('Manaus, ((DATA_EXT)).', False)], jc='center', after='0'))
P.append(empty())
P.append(para([run('Assinado eletronicamente', False)], jc='center', after='0'))
P.append(para([run('Nicolas Santos Carvalho Gomes', True)], jc='center', after='0'))
P.append(para([run('OAB/AM 8.926 | OAB/PA 32.769 | OAB/PA 37.146 | OAB/RJ 261.244', False)], jc='center', after='0'))

body = doctag + '<w:body>' + ''.join(P) + sectpr + '</w:body></w:document>'
newdoc = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n' + body

os.makedirs('public', exist_ok=True)
out = 'public/modelo_cumprimento.docx'
if os.path.exists(out): os.remove(out)
sep = os.sep
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    for root, _, files in os.walk('_mdx'):
        for f in files:
            full = os.path.join(root, f)
            arc = os.path.relpath(full, '_mdx').replace(sep, '/')
            if arc == 'word/document.xml':
                z.writestr(arc, newdoc)
            else:
                z.write(full, arc)
print('gerado', out, os.path.getsize(out), 'bytes')
toks = sorted(set(re.findall(r'\(\([A-Z_]+\)\)', newdoc)))
print('tokens:', toks)
