const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, '..', 'src', 'data', 'leiSecaCTB.json');
const articles = JSON.parse(fs.readFileSync(p, 'utf8'));

function isVetoedOrRevokedSnippet(text) {
  if (!text) return true;
  const stripped = text
    .replace(/^Art\.?\s*\d+[º°]?(?:-[A-Za-z])?\.?\s*/i, '')
    .replace(/^[§\dº°IVXLCDM\.\-\s\(\)]+/i, '')
    .trim();
  
  if (/^vetado\b/i.test(stripped)) return true;
  if (/^\(?vetado\)?/i.test(stripped)) return true;
  if (/^revogad[oa]\b/i.test(stripped)) return true;
  if (/^\(?revogad[oa]\)?/i.test(stripped)) return true;
  if (/^vide\s+lei\b/i.test(stripped)) return true;
  return false;
}

const cleanedArticles = [];

for (const a of articles) {
  // Quebra os parágrafos do artigo
  const paragraphs = a.texto
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => {
      if (!p || p.length < 10) return false;
      if (isVetoedOrRevokedSnippet(p)) return false;
      if (/^CAPÍTULO\b/i.test(p) || /^Seção\b/i.test(p)) return false;
      return true;
    });

  if (paragraphs.length === 0) {
    console.log(`REMOVED EMPTY/VETOED ARTICLE: ${a.numero}`);
    continue;
  }

  // Verifica se o caput ou primeiro parágrafo é vetado/revogado
  const cleanFirst = paragraphs[0]
    .replace(/^Art\.?\s*\d+[º°]?(?:-[A-Za-z])?\.?\s*/i, '')
    .trim();

  if (isVetoedOrRevokedSnippet(cleanFirst) || cleanFirst.length < 20) {
    console.log(`REMOVED VETOED/REVOKED CAPUT: ${a.numero} -> "${cleanFirst}"`);
    continue;
  }

  const finalTexto = paragraphs.join('\n\n').trim();

  // Verifica se sobrou conteúdo substantivo
  const substantiveLetters = finalTexto.replace(/[^a-zA-ZÀ-ÿ]/g, '');
  if (substantiveLetters.length < 30) {
    console.log(`REMOVED INSUFFICIENT SUBSTANCE: ${a.numero}`);
    continue;
  }

  cleanedArticles.push({
    ...a,
    texto: finalTexto
  });
}

console.log('Final cleaned articles count:', cleanedArticles.length);
fs.writeFileSync(p, JSON.stringify(cleanedArticles, null, 2), 'utf8');

// Verificação final
const stillVetoed = cleanedArticles.filter(a => /vetado/i.test(a.texto));
console.log('Articles containing "vetado" word:', stillVetoed.length);
stillVetoed.forEach(a => {
  console.log(`Warning - ${a.numero} has "vetado": ${a.texto.match(/.{0,30}vetado.{0,30}/gi)}`);
});
