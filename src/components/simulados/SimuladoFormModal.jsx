import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Target, CheckCircle2, AlertTriangle } from 'lucide-react';
import {
  PRF_BLOCKS,
  NOTA_CORTE_PRF,
  NOTA_MINIMA_GERAL,
  TOTAL_QUESTOES_PRF
} from './simuladoUtils';

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

  const hasBlockOverflow = b1C + b1E > 55 || b2C + b2E > 30 || b3C + b3E > 35;

  const b1Liquida = b1C - b1E;
  const b2Liquida = b2C - b2E;
  const b3Liquida = b3C - b3E;
  const liquidaTotal = b1Liquida + b2Liquida + b3Liquida;
  const totalCertas = b1C + b2C + b3C;
  const totalErradas = b1E + b2E + b3E;
  const totalBrancas = Math.max(0, TOTAL_QUESTOES_PRF - totalCertas - totalErradas);

  const hasAnyInput = Object.values(scores).some((v) => v !== '');

  const checks = [
    { label: 'B1 ≥ 15 pts', ok: b1Liquida >= 15, val: b1Liquida },
    { label: 'B2 ≥ 10 pts', ok: b2Liquida >= 10, val: b2Liquida },
    { label: 'B3 ≥ 10 pts', ok: b3Liquida >= 10, val: b3Liquida },
    { label: `Geral ≥ ${NOTA_MINIMA_GERAL} pts`, ok: liquidaTotal >= NOTA_MINIMA_GERAL, val: liquidaTotal },
    { label: `Corte PRF ≥ ${NOTA_CORTE_PRF} pts`, ok: liquidaTotal >= NOTA_CORTE_PRF, val: liquidaTotal, target: true }
  ];

  const reprovouMinimo =
    b1Liquida < 15 || b2Liquida < 10 || b3Liquida < 10 || liquidaTotal < NOTA_MINIMA_GERAL;

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
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Cabeçalho */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/50 border border-sky-200/80 dark:border-sky-900/60 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                {editingSimulado ? 'Editar Simulado' : 'Registrar Simulado PRF'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Padrão Cebraspe · 120 questões · 1 errada anula 1 certa
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar formulário"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo em 2 colunas no desktop */}
        <div className="grid grid-cols-1 md:grid-cols-12 overflow-y-auto custom-scrollbar flex-1">
          {/* Coluna esquerda: Identificação + Blocos */}
          <div className="md:col-span-7 p-5 flex flex-col gap-4">
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
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500"
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

            <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              {PRF_BLOCKS.map((blk) => {
                const cKey = `${blk.key}C`;
                const eKey = `${blk.key}E`;
                const cVal = toInt(scores[cKey]);
                const eVal = toInt(scores[eKey]);
                const answered = cVal + eVal;
                const isOverLimit = answered > blk.total;
                const net = cVal - eVal;
                const blanks = Math.max(0, blk.total - answered);
                const touched = scores[cKey] !== '' || scores[eKey] !== '';
                const belowMin = touched && net < blk.min;
                const hitPct = Math.min(100, (cVal / blk.total) * 100);
                const errPct = Math.min(100 - hitPct, (eVal / blk.total) * 100);

                return (
                  <div
                    key={blk.key}
                    className={`p-3.5 flex flex-col gap-2.5 ${
                      isOverLimit ? 'bg-red-50/50 dark:bg-red-950/20' : 'bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {blk.fullName}
                      </span>
                      <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        {blk.total}q ·{' '}
                        <strong
                          className={
                            belowMin
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-slate-900 dark:text-slate-100'
                          }
                        >
                          Líq {net}
                        </strong>{' '}
                        · {blanks}○
                      </span>
                    </div>

                    {isOverLimit && (
                      <p className="text-[11px] font-semibold text-red-600 dark:text-red-400">
                        Certas + erradas ({answered}) excede o limite de {blk.total} questões.
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-2.5">
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
                          className="w-full bg-slate-50/70 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 py-1.5 px-3 rounded-lg font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400 text-center text-sm outline-none focus:border-emerald-500"
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
                          className="w-full bg-slate-50/70 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 py-1.5 px-3 rounded-lg font-mono font-bold tabular-nums text-red-600 dark:text-red-400 text-center text-sm outline-none focus:border-red-500"
                        />
                      </div>
                    </div>

                    {/* Barra proporcional ao vivo */}
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                      <div className="bg-emerald-500 h-full transition-all" style={{ width: `${hitPct}%` }} />
                      <div className="bg-red-500 h-full transition-all" style={{ width: `${errPct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coluna direita: Placar ao vivo & Checklist PRF */}
          <div className="md:col-span-5 p-5 bg-slate-50/70 dark:bg-slate-950/60 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-4">
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Placar Cebraspe ao vivo
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span
                    className={`text-4xl font-mono font-bold tabular-nums ${
                      !hasAnyInput
                        ? 'text-slate-400 dark:text-slate-600'
                        : reprovouMinimo
                          ? 'text-red-600 dark:text-red-400'
                          : liquidaTotal >= NOTA_CORTE_PRF
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {liquidaTotal}
                  </span>
                  <span className="text-sm font-mono text-slate-400">/ {TOTAL_QUESTOES_PRF}</span>
                </div>

                <div className="mt-2 text-xs font-medium">
                  {!hasAnyInput ? (
                    <span className="text-slate-400">Preencha certas e erradas nos 3 blocos.</span>
                  ) : reprovouMinimo ? (
                    <span className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-400 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Eliminado pelos mínimos
                    </span>
                  ) : liquidaTotal >= NOTA_CORTE_PRF ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Dentro da zona de corte PRF
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 font-semibold tabular-nums">
                      Aprovado nos mínimos · faltam {NOTA_CORTE_PRF - liquidaTotal} pts p/ 75
                    </span>
                  )}
                </div>
              </div>

              {/* Resumo C / E / B */}
              <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-200/80 dark:border-slate-800 text-center font-mono tabular-nums">
                <div>
                  <span className="block text-[10px] font-sans text-slate-500">Certas</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {totalCertas}
                  </span>
                </div>
                <div className="border-x border-slate-200/80 dark:border-slate-800">
                  <span className="block text-[10px] font-sans text-slate-500">Erradas</span>
                  <span className="text-sm font-bold text-red-600 dark:text-red-400">
                    {totalErradas}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-sans text-slate-500">Brancas</span>
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                    {totalBrancas}
                  </span>
                </div>
              </div>

              {/* Checklist de requisitos do edital */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Verificação de mínimos do edital
                </span>
                {checks.map((item) => {
                  const showState = hasAnyInput;
                  return (
                    <div
                      key={item.label}
                      className="flex items-center justify-between text-xs gap-2"
                    >
                      <span
                        className={`inline-flex items-center gap-1.5 ${
                          !showState
                            ? 'text-slate-500 dark:text-slate-400'
                            : item.ok
                              ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                              : item.target
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-red-600 dark:text-red-400 font-semibold'
                        }`}
                      >
                        {showState && item.ok ? (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 opacity-70" />
                        )}
                        <span>{item.label}</span>
                      </span>
                      <span className="font-mono font-bold tabular-nums text-slate-700 dark:text-slate-300">
                        {showState ? `${item.val} pts` : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {!editingSimulado && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pt-3 border-t border-slate-200/80 dark:border-slate-800">
                Registrar um novo simulado concede <strong className="text-slate-700 dark:text-slate-200">+500 XP</strong> e contabiliza na missão de simulados.
              </p>
            )}
          </div>
        </div>

        {/* Rodapé */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 bg-white dark:bg-slate-900">
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
            className="h-9 px-5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {editingSimulado ? 'Salvar Alterações' : 'Salvar Simulado'}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
