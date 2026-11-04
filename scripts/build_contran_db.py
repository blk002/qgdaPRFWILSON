import os
import sys
import re
import json
import urllib.request
from pypdf import PdfReader

sys.stdout.reconfigure(encoding='utf-8')

# Diretório de download temporário
cache_dir = "temp_contran"
os.makedirs(cache_dir, exist_ok=True)

with open('scripts/resolutions_to_download.json', 'r', encoding='utf-8') as f:
    resolutions = json.load(f)

print(f"Total resolutions to process: {len(resolutions)}")

def download_pdf(url, dest_path):
    if os.path.exists(dest_path) and os.path.getsize(dest_path) > 1000:
        return True
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req, timeout=30) as resp, open(dest_path, 'wb') as out_file:
            out_file.write(resp.read())
        return True
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        return False

def clean_pdf_text(full_text):
    # Substitui ligaduras comuns
    text = full_text.replace('\ufb01', 'fi').replace('\ufb02', 'fl').replace('\ufb00', 'ff')
    # Normaliza quebras de linha e hifenização no fim da linha
    text = re.sub(r'(\w+)-\n(\w+)', r'\1\2', text)
    # Remove cabeçalhos e rodapés de página do Gov.br
    text = re.sub(r'Documento assinado eletronicamente[\s\S]*?\n', '', text)
    text = re.sub(r'Ministério dos Transportes[\s\S]*?\n', '', text)
    text = re.sub(r'Conselho Nacional de Trânsito[\s\S]*?\n', '', text)
    text = re.sub(r'Fl\.\s*\d+[\s\S]*?\n', '', text)
    return text

def is_revoked_or_invalid_paragraph(p):
    clean = p.strip()
    if not clean or len(clean) < 15:
        return True
    # Remove identificador do inciso/parágrafo
    clean_no_prefix = re.sub(r'^[§\dº°oIVXLCDM\.\-\s–—\(\)]+', '', clean).strip()
    if re.search(r'^\(?\s*(?:REVOGADO|Revogad[oa]|VETADO)\s*\)?', clean_no_prefix, re.I):
        return True
    if re.search(r'^\(?\s*(?:REVOGADO|Revogad[oa])\s+pela\s+Resolução', clean, re.I):
        return True
    return False

def is_purely_revocatory_article(art_text):
    # Artigos do tipo "Art. X Ficam revogadas as Resoluções..."
    first_line = art_text.split('\n')[0]
    if re.search(r'Ficam?\s+revogadas?\b', art_text, re.I):
        return True
    if re.search(r'Esta\s+Resolução\s+entra\s+em\s+vigor\b', art_text, re.I):
        return True
    return False

all_contran_articles = []

for item in resolutions:
    res_num = item['num']
    nome_res = item['nome']
    assunto = item['assunto']
    url = item['url']
    
    if not url:
        print(f"Skipping {nome_res} - no URL")
        continue

    dest_pdf = os.path.join(cache_dir, f"{res_num}.pdf")
    success = download_pdf(url, dest_pdf)
    if not success:
        print(f"Could not download {nome_res}")
        continue

    try:
        reader = PdfReader(dest_pdf)
        raw_text = ""
        for page in reader.pages:
            t = page.extract_text()
            if t:
                raw_text += t + "\n"
    except Exception as e:
        print(f"Error reading PDF {dest_pdf}: {e}")
        continue

    cleaned = clean_pdf_text(raw_text)

    # Identifica a ementa (texto antes do Art. 1º)
    ementa_match = re.search(r'(?:RESOLVE|Resolve):?\s*\n([\s\S]*?)(?=Art\.?\s*1[º°o]?\b)', cleaned)
    ementa = ementa_match.group(1).strip() if ementa_match else assunto

    # Quebra os artigos
    article_chunks = re.split(r'\n(?=Art\.?\s*\d+[º°o]?(?:-[A-Za-z])?\.?\s*)', cleaned)

    valid_res_articles = 0
    for chunk in article_chunks:
        chunk = chunk.strip()
        m_num = re.match(r'^(Art\.?\s*\d+[º°o]?(?:-[A-Za-z])?)', chunk, re.I)
        if not m_num:
            continue

        raw_art_num = m_num.group(1).replace('o', 'º').replace('°', 'º')
        # Normaliza número
        num_clean = re.sub(r'Art\.?\s*', 'Art. ', raw_art_num)

        # Se for artigo de vigência ou revogação pura de normas antigas, pula
        if is_purely_revocatory_article(chunk):
            continue

        # Quebra em parágrafos e filtra os revogados
        paragraphs = chunk.split('\n')
        active_paragraphs = []
        for p in paragraphs:
            p = p.strip()
            if not p:
                continue
            if is_revoked_or_invalid_paragraph(p):
                continue
            active_paragraphs.append(p)

        if not active_paragraphs:
            continue

        final_article_text = " ".join(active_paragraphs)
        # Normaliza espaços múltiplos
        final_article_text = re.sub(r'\s+', ' ', final_article_text).strip()

        # Verifica se sobrou texto substantivo
        if len(final_article_text) < 35:
            continue

        # Verifica se o próprio caput era revogado
        caput_check = re.sub(r'^Art\.?\s*\d+[º°o]?\.?\s*', '', final_article_text).strip()
        if is_revoked_or_invalid_paragraph(caput_check):
            continue

        dispositivo = f"{num_clean} da {nome_res}"
        art_id = f"contran-{res_num}-{num_clean.lower().replace(' ', '-').replace('º', '')}"

        all_contran_articles.append({
            "id": art_id,
            "resolucao": nome_res,
            "numeroRes": res_num,
            "numero": num_clean,
            "assunto": assunto,
            "dispositivo": dispositivo,
            "texto": final_article_text
        })
        valid_res_articles += 1

    print(f"Processed {nome_res}: extracted {valid_res_articles} active articles.")

print(f"\nTOTAL CONTRAN ARTICLES EXTRACTED: {len(all_contran_articles)}")

# Salva resultado em JSON
out_json = os.path.join("src", "data", "leiSecaCONTRAN.json")
with open(out_json, 'w', encoding='utf-8') as f:
    json.dump(all_contran_articles, f, ensure_ascii=False, indent=2)

print(f"Saved to {out_json} ({os.path.getsize(out_json) / 1024:.1f} KB)")
