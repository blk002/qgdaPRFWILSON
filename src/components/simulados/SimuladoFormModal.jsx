import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Target, CheckCircle, AlertTriangle } from 'lucide-react';

const BLOCKS = [
  { key: 'b1', name: 'Bloco I · Básicas', total: 55, min: 15 },
  { key: 'b2', name: 'Bloco II · Trânsito', total: 30, min: 10 },
  { key: 'b3', name: 'Bloco III · Direito', total: 35, min: 10 }
];

export default function SimuladoFormModal({ isOpen, editingSimulado, onClose, onSubmit }) {
  const [dataVal, setDataVal] = useState(
    editingSimulado ? editingSimulado.data : new Date().toLocaleDateString('pt-BR')
  );
  const [titleVal, setTitleVal] = useState(editingSimulado?.title || '');
  const [scores, setScores] = useState({
    b1C: editingSimulado?.b1C ?? '',
    b1E: editingSimulado?.b1E ?? '',
    b2C: editingSimulado?.b2C ?? '',
    b2E: editingSimulado?.b2E ?? '',
    b3C: editingSimulado?.b3C ?? '',
    b3E: editingSimulado?.b3E ?? ''
  });

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toInt = (v) => Math.max(0, parseInt(v, 10) || 0);
  const b1C = toInt(scores.b1C);
  const b1E = toInt(scores.b1E);
  const b2C = toInt(scores.b2C);
  const b2E = toInt(scores.b2E);
  const b3C = toInt(scores.b3C);
  const b3E = toInt(scores.b3E);

  const hasBlockOverflow =
    b1C + b1E > 55 || b2C + b2E > 30 || b3C + b3E > 35;

  const b1Liquida = b1C - b1E;
  const b2Liquida = b2C - b2E;
  const b3Liquida = b3C - b3E;
  const liquidaTotal = b1Liquida + b2Liquida + b3Liquida;

  const reprovouCorte = b1Liquida < 15 || b2Liquida < 10 || b3Liquida < 10 || liquidaTotal < 50;
  const hasAnyInput = Object.values(scores).some((v) => v !== '');

  const handleField = (field, raw, blockTotal, siblingField) => {
    if (raw === '') {
      setScores((prev) => ({ ...prev, [field]: '' }));
      return;
    }
    setScores((prev) => {
      const siblingVal = toInt(prev[siblingField]);
      const allowedMax = Math.max(0, blockTotal - siblingVal);
      const parsed = Math.max(0, Math.min(allowedMax, parseInt(raw, 10) || 0));
      return { ...prev, [field]: String(parsed) };
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (hasBlockOverflow) return;
    onSubmit({
      data: dataVal.trim() || new Date().toLocaleDateString('pt-BR'),
      title: titleVal.trim(),
      b1C,
      b1E,
      b2C,
      b2E,
      b3C,
      b3E,
      b1Liquida,
      b2Liquida,
      b3Liquida,
      liquida: liquidaTotal
    });
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center z-[999] p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <form
        onSubmit={handleFormSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-5 sm:p-6 relative flex flex-col gap-4 max-h-[92vh]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar formulário"
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho */}
        <div className="pr-8">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Target className="w-5 h-5 text-sky-500 shrink-0" />
            <span>{editingSimulado ? 'Editar Simulado' : 'Registrar Simulado'}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Informe acertos e erros por bloco (Cebraspe: 1 errada anula 1 certa).
          </p>
        </div>

        {/* Prévia ao vivo da nota líquida */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Nota líquida prevista
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                {liquidaTotal}
              </span>
              <span className="text-xs font-mono text-slate-400">/ 120 pts</span>
            </div>
          </div>

          {hasAnyInput ? (
            reprovouCorte ? (
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-3.5 h-3.5" /> Abaixo do mínimo
                </span>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Mínimos: B1 ≥ 15 · B2 ≥ 10 · B3 ≥ 10 · Geral ≥ 50
                </span>
              </div>
            ) : (
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-3.5 h-3.5" /> Acima dos mínimos
                </span>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {liquidaTotal >= 75 ? 'Dentro da zona de corte PRF (≥ 75)' : `Faltam ${75 - liquidaTotal} pts p/ corte 75`}
                </span>
              </div>
            )
          ) : (
            <span className="text-xs text-slate-400 dark:text-slate-500 text-right">
              Preencha os blocos abaixo
            </span>
          )}
        </div>

        {/* Campos do formulário */}
        <div className="overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data de realização
              </label>
              <input
                name="data"
                type="text"
                required
                value={dataVal}
                onChange={(e) => setDataVal(e.target.value)}
                placeholder="DD/MM/AAAA"
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Identificação <span className="font-normal text-slate-400">(opcional)</span>
              </label>
              <input
                name="title"
                type="text"
                value={titleVal}
                onChange={(e) => setTitleVal(e.target.value)}
                placeholder="Ex: Simulado Nacional #04"
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {BLOCKS.map((blk) => {
            const cKey = `${blk.key}C`;
            const eKey = `${blk.key}E`;
            const cVal = toInt(scores[cKey]);
            const eVal = toInt(scores[eKey]);
            const answered = cVal + eVal;
            const isOverLimit = answered > blk.total;
            const net = cVal - eVal;
            const blanks = Math.max(0, blk.total - answered);
            const belowMin = (scores[cKey] !== '' || scores[eKey] !== '') && net < blk.min;

            return (
              <div
                key={blk.key}
                className={`p-3.5 rounded-xl border flex flex-col gap-2.5 ${
                  isOverLimit
                    ? 'border-red-400 dark:border-red-700 bg-red-50/50 dark:bg-red-950/25'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-slate-900 dark:text-slate-100">{blk.name}</span>
                  <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                    {blk.total}q · mín. {blk.min} ·{' '}
                    <strong className={belowMin ? 'text-red-500' : 'text-slate-900 dark:text-slate-100'}>
                      Líq: {net}
                    </strong>{' '}
                    ({blanks} brancas)
                  </span>
                </div>

                {isOverLimit && (
                  <p className="text-[11px] font-semibold text-red-600 dark:text-red-400">
                    A soma de certas + erradas ({answered}) excede o limite de {blk.total} questões deste bloco.
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                      Certas
                    </label>
                    <input
                      name={cKey}
                      type="number"
                      min="0"
                      max={Math.max(0, blk.total - eVal)}
                      required
                      value={scores[cKey]}
                      onChange={(e) => handleField(cKey, e.target.value, blk.total, eKey)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 py-2 px-3 rounded-lg font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400 text-center text-sm outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-red-600 dark:text-red-400 mb-1">
                      Erradas
                    </label>
                    <input
                      name={eKey}
                      type="number"
                      min="0"
                      max={Math.max(0, blk.total - cVal)}
                      required
                      value={scores[eKey]}
                      onChange={(e) => handleField(eKey, e.target.value, blk.total, cKey)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 py-2 px-3 rounded-lg font-mono font-bold tabular-nums text-red-600 dark:text-red-400 text-center text-sm outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rodapé de ações */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={hasBlockOverflow}
            className="h-9 px-5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
          >
            {editingSimulado ? 'Salvar Alterações' : 'Salvar Simulado'}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
