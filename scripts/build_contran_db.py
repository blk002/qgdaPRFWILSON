import os
import sys
import re
import json
import urllib.request
import io
from pypdf import PdfReader

sys.stdout.reconfigure(encoding='utf-8')

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
    # Substitui ligaduras tipográficas
    text = full_text.replace('\ufb01', 'fi').replace('\ufb02', 'fl').replace('\ufb00', 'ff').replace('\u0000', 'ti')
    # Normaliza quebras de hifenização no fim de linha
    text = re.sub(r'(\w+)-\n(\w+)', r'\1\2', text)
    # Remove cabeçalhos DOU e links de rodapé
    text = re.sub(r'\d{2}/\d{2}/\d{4}(?:,?\s*\d{2}:\d{2})?\s+RESOLUÇÃO\s+CONTRAN\s+Nº[^\n]*?- DOU - Imprensa Nacional\s+https?://\S+\s+\d+/\d+', '\n', text, flags=re.I)
    text = re.sub(r'\d{2}/\d{2}/\d{4}\s+SEI/MINFRA\s+-\s+\d+\s+-\s+Resolução\s+CONTRAN\s+https?://\S+\s+\d+/\d+', '\n', text, flags=re.I)
    text = re.sub(r'https?://(?:www\.)?in\.gov\.br\S*', '', text, flags=re.I)
    text = re.sub(r'https?://sei\.infraestrutura\.gov\.br\S*', '', text, flags=re.I)
    text = re.sub(r'Documento assinado eletronicamente[\s\S]*?\n', '', text)
    text = re.sub(r'Fl\.\s*\d+[\s\S]*?\n', '', text)
    return text

def is_stray_title_or_header(b):
    s = b.strip()
    # Se já é um dispositivo normativo legal reconhecido (Art, §, Parágrafo, Inciso ou Alínea), preserva
    if re.match(r'^(?:Art\.?\s*\d+|§\s*\d+|Parágrafo\s+único|[IVXLCDM]+\s*[\-–—\.]|[a-z]\)\s*)', s, re.I):
        return False
    # Se não termina com pontuação e é curto ou todo em maiúsculas, é cabeçalho de seção espúrio
    if not re.search(r'[.\?!;:]$', s):
        return True
    if re.match(r'^[A-ZÁ-Ú\s\-\–—/]{4,}$', s):
        return True
    return False

def is_section_header(line):
    s = line.strip()
    if re.match(r'^(?:CAPÍTULO|Capítulo|Seção|SEÇÃO)\s+[IVXLCDM\d]+', s, re.I):
        return True
    if re.match(r'^(?:Do[s]?|Da[s]?|De)\s+[A-Za-zÀ-ÿ\s\-\–—/]{4,}$', s, re.I) and not s.endswith('.'):
        return True
    if re.match(r'^(?:DISPOSIÇÕES\s+FINAIS|DISPOSIÇÕES\s+PRELIMINARES|DAS\s+DISPOSIÇÕES\s+GERAIS|Disposições\s+Gerais|Disposições\s+Finais|Disposições\s+Transitórias)$', s, re.I):
        return True
    if re.match(r'^(?:ANEXO|Anexo)\s+[IVXLCDM\d]+', s, re.I) and not s.endswith('.'):
        return True
    return False

def is_revoked_block(text):
    clean = text.strip()
    if not clean or len(clean) < 5:
        return True
    clean_core = re.sub(r'^[§\dº°oIVXLCDM\.\-\s–—\(\)]+', '', clean).strip()
    if re.search(r'^\(?\s*(?:REVOGADO|Revogad[oa]|VETADO)\s*\)?', clean_core, re.I):
        return True
    if re.search(r'^\(?\s*(?:REVOGADO|Revogad[oa])\s+pela\s+Resolução', clean, re.I):
        return True
    return False

all_contran_articles = []

for item in resolutions:
    res_num = item['num']
    nome_res = item['nome']
    assunto = item['assunto']
    url = item['url']
    
    if not url:
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

    # Divide por 'Art. X'
    raw_articles = re.split(r'\n(?=Art\.?\s*\d+[º°o]?(?:-[A-Za-z])?\.?\s*)', cleaned)

    valid_res_articles = 0
    for raw in raw_articles:
        raw = raw.strip()
        m = re.match(r'^Art\.?\s*(\d+[º°o]?(?:-[A-Za-z])?)\.?\s*', raw, re.I)
        if not m:
            continue

        art_clean_num = m.group(1).replace('o', 'º').replace('°', 'º')
        art_num = f"Art. {art_clean_num}"

        # Pula artigos revogatórios puros ou vigência
        if re.search(r'Ficam?\s+revogadas?\b', raw, re.I) or re.search(r'Esta\s+Resolução\s+entra\s+em\s+vigor\b', raw, re.I):
            continue

        lines = raw.split('\n')
        blocks = []
        current_block = []

        def flush_block():
            if current_block:
                b_text = ' '.join(current_block).strip()
                b_text = re.sub(r'\s+', ' ', b_text)
                if not is_section_header(b_text) and not is_stray_title_or_header(b_text) and not is_revoked_block(b_text):
                    blocks.append(b_text)
                current_block.clear()

        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue

            if is_section_header(line_str):
                flush_block()
                continue

            # Início de novo dispositivo: Artigo, Parágrafo, Inciso ou Alínea
            is_new_device = (
                re.match(r'^Art\.?\s*\d+', line_str, re.I) or
                re.match(r'^(?:§\s*\d+|Parágrafo\s+único)', line_str, re.I) or
                re.match(r'^[IVXLCDM]+\s*[\-–—\.]', line_str) or
                re.match(r'^[a-z]\)\s*', line_str)
            )

            if is_new_device:
                flush_block()
                current_block.append(line_str)
            else:
                current_block.append(line_str)

        flush_block()

        if not blocks:
            continue

        # Verifica se o primeiro bloco (caput) é revogado
        if is_revoked_block(blocks[0]):
            continue

        # Junta os blocos individuais com \n\n
        final_text = '\n\n'.join(blocks)
        if len(final_text) < 35:
            continue

        dispositivo = f"{art_num} da {nome_res}"
        clean_id_suffix = art_clean_num.lower().replace(' ', '-').replace('º', '')
        art_id = f"contran-{res_num}-{clean_id_suffix}"

        all_contran_articles.append({
            "id": art_id,
            "resolucao": nome_res,
            "numeroRes": res_num,
            "numero": art_num,
            "assunto": assunto,
            "dispositivo": dispositivo,
            "texto": final_text
        })
        valid_res_articles += 1

    print(f"Processed {nome_res}: extracted {valid_res_articles} active articles.")

print(f"\nTOTAL CONTRAN ARTICLES EXTRACTED: {len(all_contran_articles)}")

# Salva resultado em JSON
out_json = os.path.join("src", "data", "leiSecaCONTRAN.json")
with open(out_json, 'w', encoding='utf-8') as f:
    json.dump(all_contran_articles, f, ensure_ascii=False, indent=2)

print(f"Saved to {out_json} ({os.path.getsize(out_json) / 1024:.1f} KB)")
