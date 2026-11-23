export const NOTA_CORTE_PRF = 75;
export const NOTA_MINIMA_GERAL = 50;
export const NOTA_ELITE_PRF = 96;
export const TOTAL_QUESTOES_PRF = 120;

export const PRF_BLOCKS = [
  {
    key: 'b1',
    code: 'B1',
    blocoLabel: 'Bloco I',
    name: 'Básicas',
    fullName: 'Bloco I · Básicas',
    total: 55,
    min: 15,
    color: '#2563eb'
  },
  {
    key: 'b2',
    code: 'B2',
    blocoLabel: 'Bloco II',
    name: 'Trânsito',
    fullName: 'Bloco II · Trânsito',
    total: 30,
    min: 10,
    color: '#d97706'
  },
  {
    key: 'b3',
    code: 'B3',
    blocoLabel: 'Bloco III',
    name: 'Direito',
    fullName: 'Bloco III · Direito',
    total: 35,
    min: 10,
    color: '#059669'
  }
];

export function formatBrDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return '—';
  const parts = dateStr.split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
}

export function formatShortDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return '—';
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
  const brParts = dateStr.split('/');
  if (brParts.length === 3) return `${brParts[0]}/${brParts[1]}`;
  return dateStr;
}

export function isFiniteNum(v) {
  return v !== undefined && v !== null && v !== '' && Number.isFinite(Number(v));
}

export function getEliminationInfo(sim) {
  if (!sim) return { failed: false, reason: '—', failedItems: [] };
  const hasBlocks =
    isFiniteNum(sim.b1Liquida) && isFiniteNum(sim.b2Liquida) && isFiniteNum(sim.b3Liquida);

  if (!hasBlocks) {
    const failed =
      sim.pct !== undefined && sim.pct !== null
        ? Number(sim.pct) < 50
        : (Number(sim.liquida) || 0) < NOTA_MINIMA_GERAL;
    return {
      failed,
      reason: failed ? 'Abaixo do mínimo (50)' : 'Aprovado',
      failedItems: failed ? ['Total < 50'] : []
    };
  }

  const reasons = [];
  if (Number(sim.b1Liquida) < 15) reasons.push('B1 < 15');
  if (Number(sim.b2Liquida) < 10) reasons.push('B2 < 10');
  if (Number(sim.b3Liquida) < 10) reasons.push('B3 < 10');
  if (Number(sim.liquida) < NOTA_MINIMA_GERAL) reasons.push('Total < 50');

  return {
    failed: reasons.length > 0,
    reason: reasons.length > 0 ? reasons.join(' · ') : 'Aprovado nos mínimos',
    failedItems: reasons
  };
}

export function getDateOriginLabel(dateSource) {
  if (dateSource === 'release') return 'data de liberação';
  if (dateSource === 'api_date') return 'via API';
  if (dateSource === 'import') return 'data de importação';
  return '';
}

export function getBlockShortCode(bloco) {
  if (bloco === 'Bloco III') return 'B3';
  if (bloco === 'Bloco II') return 'B2';
  return 'B1';
}
