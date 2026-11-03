const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'temp_ctb.html');
const rawHtml = new TextDecoder('latin1').decode(fs.readFileSync(htmlPath));

// 1. Remove trechos taxados (<strike> e <s>) que indicam redações revogadas no Planalto
let html = rawHtml.replace(/<strike\b[\s\S]*?<\/strike>/gi, '');
html = html.replace(/<s\b[\s\S]*?<\/s>/gi, '');

// 2. Divide por parágrafos HTML (<p ...>)
const rawParagraphs = html.split(/<p\b[^>]*>/i);
console.log(`Parágrafos brutos encontrados: ${rawParagraphs.length}`);

// Limpa tags e entidades de cada parágrafo
const cleanedParagraphs = [];
for (const raw of rawParagraphs) {
  let clean = raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&sect;/gi, '§');

  clean = clean.replace(/[ \t]+/g, ' ').trim();
  if (clean.length > 0) {
    cleanedParagraphs.push(clean);
  }
}

function getChapterByArtNum(intVal, rawNum) {
  if (rawNum.startsWith('67-')) return 'Capítulo III-A - Condução por Motoristas Profissionais (Arts. 67-A a 67-E)';
  if (intVal >= 1 && intVal <= 4) return 'Capítulo I - Disposições Preliminares (Arts. 1º a 4º)';
  if (intVal >= 5 && intVal <= 25) return 'Capítulo II - Do Sistema Nacional de Trânsito (Arts. 5º a 25)';
  if (intVal >= 26 && intVal <= 67) return 'Capítulo III - Das Normas Gerais de Circulação e Conduta (Arts. 26 a 67)';
  if (intVal >= 68 && intVal <= 71) return 'Capítulo IV - Dos Pedestres e Não Motorizados (Arts. 68 a 71)';
  if (intVal >= 72 && intVal <= 73) return 'Capítulo V - Do Cidadão (Arts. 72 e 73)';
  if (intVal >= 74 && intVal <= 79) return 'Capítulo VI - Da Educação para o Trânsito (Arts. 74 a 79)';
  if (intVal >= 80 && intVal <= 90) return 'Capítulo VII - Da Sinalização de Trânsito (Arts. 80 a 90)';
  if (intVal >= 91 && intVal <= 95) return 'Capítulo VIII - Da Engenharia de Tráfego (Arts. 91 a 95)';
  if (intVal >= 96 && intVal <= 102) return 'Capítulo IX - Dos Veículos: Classificação (Arts. 96 a 102)';
  if (intVal >= 103 && intVal <= 113) return 'Capítulo X - Da Segurança dos Veículos e Equipamentos (Arts. 103 a 113)';
  if (intVal >= 114 && intVal <= 117) return 'Capítulo XI - Da Identificação Veicular e Placas (Arts. 114 a 117)';
  if (intVal >= 118 && intVal <= 135) return 'Capítulo XII - Do Licenciamento e Registro (Arts. 118 a 135)';
  if (intVal >= 140 && intVal <= 160) return 'Capítulo XIII - Da Habilitação, CNH e Categorias (Arts. 140 a 160)';
  if (intVal >= 161 && intVal <= 255) return 'Capítulo XIV - Das Infrações de Trânsito em Espécie (Arts. 161 a 255)';
  if (intVal >= 256 && intVal <= 268) return 'Capítulo XV - Das Penalidades e Pontuação (Arts. 256 a 268)';
  if (intVal >= 269 && intVal <= 279) return 'Capítulo XVI - Das Medidas Administrativas (Arts. 269 a 279-A)';
  if (intVal >= 280 && intVal <= 290) return 'Capítulo XVII - Do Processo Administrativo e Recursos (Arts. 280 a 290-A)';
  if (intVal >= 291 && intVal <= 312) return 'Capítulo XVIII - Dos Crimes de Trânsito (Arts. 291 a 312-B)';
  return 'Capítulo XIX - Disposições Finais e Transitórias (Arts. 313 a 341)';
}

const artStartRegex = /(?:^|\s)Art\.?\s*(\d+[º°]?(?:-[A-Za-z])?)\b\.?\s*(.*)$/i;
let currentArt = null;
const allArticles = [];

for (let i = 0; i < cleanedParagraphs.length; i++) {
  const p = cleanedParagraphs[i];
  const m = p.match(artStartRegex);

  if (m) {
    if (currentArt) {
      const caput = currentArt.paragraphs[0] || '';
      const isCompletelyRevoked =
        (caput.toLowerCase().includes('(revogado') ||
          caput.toLowerCase().includes('revogado pela') ||
          caput.toLowerCase().includes('(vetado)')) &&
        currentArt.paragraphs.length <= 2;

      if (!isCompletelyRevoked && currentArt.paragraphs.join(' ').length > 25) {
        allArticles.push(currentArt);
      }
    }

    const rawNum = m[1].replace(/[°]/g, 'º');
    const intVal = parseInt(rawNum.replace(/\D/g, ''), 10) || 0;
    const cleanNumStr = rawNum.replace(/º/g, '');

    currentArt = {
      numero: `Art. ${rawNum}`,
      rawNum,
      intVal,
      cleanNumStr,
      capitulo: getChapterByArtNum(intVal, cleanNumStr),
      paragraphs: [p],
    };
  } else if (currentArt) {
    if (!p.startsWith('(Redação dada pela Lei') && !p.startsWith('(Incluído pela Lei')) {
      currentArt.paragraphs.push(p);
    }
  }
}

if (currentArt) {
  allArticles.push(currentArt);
}

// Deduplica mantendo a versão mais extensa de cada artigo
const map = new Map();
allArticles.forEach(a => {
  const key = a.numero.toLowerCase();
  const existing = map.get(key);
  if (!existing || a.paragraphs.join(' ').length > existing.paragraphs.join(' ').length) {
    map.set(key, a);
  }
});

const finalArticles = Array.from(map.values())
  .sort((a, b) => a.intVal - b.intVal)
  .map(a => {
    const fullText = a.paragraphs.join('\n\n').trim();
    return {
      id: `ctb-art-${a.cleanNumStr.toLowerCase()}`,
      numero: a.numero,
      capitulo: a.capitulo,
      dispositivo: `${a.numero} do CTB (Lei nº 9.503/1997)`,
      texto: fullText,
    };
  });

console.log(`\n🎉 EXTRAÇÃO CONCLUÍDA COM SUCESSO!`);
console.log(`Total de Artigos oficiais ativos no CTB: ${finalArticles.length}`);
console.log(`Primeiro: ${finalArticles[0].numero} - ${finalArticles[0].capitulo}`);
console.log(`Último: ${finalArticles[finalArticles.length - 1].numero} - ${finalArticles[finalArticles.length - 1].capitulo}`);

// Sanity checks
['Art. 20', 'Art. 29', 'Art. 67-C', 'Art. 147', 'Art. 148-A', 'Art. 165', 'Art. 165-A', 'Art. 203', 'Art. 218', 'Art. 261', 'Art. 271', 'Art. 280', 'Art. 302', 'Art. 306', 'Art. 308', 'Art. 312-B'].forEach(alvo => {
  const achou = finalArticles.find(a => a.numero.startsWith(alvo));
  if (achou) {
    console.log(`  ✓ ${alvo} presente (${achou.texto.length} chars)`);
  } else {
    console.log(`  ✗ ${alvo} ausente`);
  }
});

const outputPath = path.join(__dirname, '..', 'src', 'data', 'leiSecaCTB.json');
fs.writeFileSync(outputPath, JSON.stringify(finalArticles, null, 2), 'utf8');
console.log(`\nArquivo salvo: ${outputPath} (${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB)`);
