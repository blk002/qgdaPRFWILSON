// Simula o parser v3 com o output real do test B (binarização)
const ocrText = `SISTEMA INTERNACIONAL DE UNIDADES
Disponivel até 24/06/2027 as 23:06
17:13 |
-=*= UNIDADES DE TEMPO
e Disponivel até 2ADE0D27 as 23:00
23:44
UNIDADES DE COMPRIMENTO
Cisponihvel até 24/CE/26027 a5 23:00
14:32 l
= —a="- NOTAÇÃO CIENTÍFICA
[Cisponivel até 24/DE/2D27 as 23:6DD
34:47 |
8 ORDEM DE GRANDEZA
à 7 Cisponihvel até 24/CE/2027 a5 23:00
15:47
epa ALGARISMOS SIGNIFICATIVOS
ES Dispontvel até 24/0CE/2D27 as 23:06D
23:35 ;`;

const lines = ocrText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
const durRegex = /\b(\d{1,3}[:;.,]\d{2}(?:[:;.,]\d{2})?)\b/;
const ignoreRegex = /disponível|disponivel|dispon[ií]vel|cispon|até\s+\d|^\d{2}\/\d{2}|^às\s|^\d+%$|^0%$/i;

const lineData = lines.map((line, idx) => {
  const isIgnored = ignoreRegex.test(line);
  const durMatch = line.match(durRegex);
  let duration = null;
  let durationValid = false;
  if (durMatch) {
    duration = durMatch[1].replace(/[;.,]/g, ':');
    const parts = duration.split(':');
    const m = parseInt(parts[0], 10);
    const s = parseInt(parts[1], 10);
    durationValid = m <= 180 && s < 60 && !(m === 23 && s <= 10) && !(m === 24) && !(m >= 2020);
  }
  const nameText = durMatch ? line.replace(durRegex, '').trim() : line;
  const isNameCandidate = !isIgnored && nameText.length > 3 && /[A-ZÀ-Ü]{3,}/.test(nameText);
  return { line, idx, isIgnored, duration, durationValid, nameText, isNameCandidate };
});

const cleanName = (str) => {
  let s = str
    .replace(/^[\s\-=*|\\/""":;.,!?#@&()\[\]{}<>_~`^+\[]+/, '')
    .replace(/[\s\-=*|\\/""":;.,!?#@&()\[\]{}<>_~`^+]+$/, '')
    .replace(/^[^A-ZÀ-Ü]*?(?=[A-ZÀ-Ü]{2,})/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
  if (s.length < 3) s = str.toUpperCase().replace(/[^A-ZÀ-Ü0-9\s\-]/g, '').trim();
  s = s.replace(/[.,;:!?|]+$/, '').trim();
  return s;
};

console.log('=== LINE DATA ===');
lineData.forEach((ld, i) => {
  console.log(`${i}: ignored=${ld.isIgnored} dur=${ld.duration}(${ld.durationValid}) name=${ld.isNameCandidate} | "${ld.line}"`);
});

const results = [];
const usedNameLines = new Set();
for (let i = 0; i < lineData.length; i++) {
  const ld = lineData[i];
  if (!ld.durationValid) continue;
  if (ld.isNameCandidate && ld.nameText.length > 3) {
    const cleaned = cleanName(ld.nameText);
    if (cleaned.length >= 3 && !results.some(r => r.name === cleaned)) {
      results.push({ name: cleaned, duration: ld.duration });
      usedNameLines.add(i);
      continue;
    }
  }
  for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
    const prev = lineData[j];
    if (usedNameLines.has(j)) continue;
    if (prev.isIgnored) continue;
    if (prev.durationValid && !prev.isNameCandidate) continue;
    if (prev.isNameCandidate) {
      const cleaned = cleanName(prev.nameText);
      if (cleaned.length >= 3 && !results.some(r => r.name === cleaned)) {
        results.push({ name: cleaned, duration: ld.duration });
        usedNameLines.add(j);
      }
      break;
    }
  }
}

console.log('\n=== RESULTADOS ===');
results.forEach((r,i) => console.log(`${i+1}. ${r.name} | ${r.duration}`));
console.log(`Total: ${results.length} aulas`);
