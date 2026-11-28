import { useState, useRef, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useStore, getCleanInitialState, PERSISTED_KEYS } from '../store/useStore';
import { assetUrl } from '../lib/assets';
import { formatBackupReasonLabel } from '../lib/backupManager';
import { toast } from 'sonner';
import {
  Target,
  AlertTriangle,
  Clock,
  Settings,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Sun,
  X,
  Save,
  User,
  Volume2,
  VolumeX,
  Shield,
  CheckCircle,
  Check,
  Camera,
  BookOpen,
  ScanLine,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  Zap,
  FastForward,
  Layers,
  RotateCcw,
  RefreshCw,
  Shuffle,
  Share2,
  Download,
  History,
  Cloud,
  Upload,
  Loader2,
  Link2,
  Unlink,
  ExternalLink
} from 'lucide-react';
import {
  parseDurationToSeconds,
  formatSecondsToClock,
  formatSecondsToFriendly,
  getSubjectVideoStats,
  formatMinutesToFriendly,
  calculateLessonsForGoal
} from '../lib/durationHelpers';
import { extractCourseIdFromUrl } from '../lib/caveiraLessonLinks';
import { APP_VERSION } from '../version';
import CaveiraDifficultySelector from '../components/CaveiraDifficultySelector';
import { DEFAULT_CAVEIRA_QUESTION_PREFS } from '../lib/caveiraDifficulty';

// Lazy-loaded heavy modals (isolates tesseract.js OCR engine from Config bundle)
const ImportOCR = lazy(() => import('../components/ImportOCR'));
const TopicLessonScanner = lazy(() => import('../components/TopicLessonScanner'));
const SelectiveResetModal = lazy(() => import('../components/SelectiveResetModal'));
const ShareSyllabusModal = lazy(() => import('../components/ShareSyllabusModal'));

const notificationsSupported = typeof Notification !== 'undefined';

function ModalLoadingOverlay() {
  return (
    <div className="fixed inset-0 z-[160] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-4 flex items-center gap-3 shadow-lg">
        <Loader2 className="w-4 h-4 text-sky-500 animate-spin" />
        <span className="text-xs font-medium text-slate-700 dark:text-slate-200">Carregando módulo...</span>
      </div>
    </div>
  );
}

const formatSnapshotTimestamp = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function Config({
  availableColors
}) {
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [draftSubject, setDraftSubject] = useState(null);
  const [showImportOCR, setShowImportOCR] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [shareModalConfig, setShareModalConfig] = useState(null); // { isOpen: boolean, tab: 'share'|'import', initialSubjectId: string|null }
  const [activeConfigTab, setActiveConfigTab] = useState('disciplinas'); // 'disciplinas' | 'ritmo' | 'perfil' | 'sistema'
  const [scannerTopicIdx, setScannerTopicIdx] = useState(null);
  const [expandedTopicLinkIdx, setExpandedTopicLinkIdx] = useState(null);
  const [expandedLessonLinkKey, setExpandedLessonLinkKey] = useState(null);
  const [restoreVersion, setRestoreVersion] = useState(0);
  const [isRestoringPoint, setIsRestoringPoint] = useState(false);
  const modalBodyRef = useRef(null);

  const {
    user,
    cycle,
    subjects,
    setSubjects,
    setSubjectSpeed,
    targetExamDate,
    setTargetExamDate,
    setGlobalModal,
    executeTotalWipe,
    userStats,
    enableSounds,
    setEnableSounds,
    dailyGoalMinutes,
    setDailyGoalMinutes,
    subjectGoals,
    setSubjectGoal,
    subjectTimeGoal,
    setSubjectTimeGoal,
    setSubjectLessonsPerBlock,
    pushSettings,
    setPushSettings,
    pushTime,
    setPushTime,
    futureScheduleRules,
    cycleScheduleType,
    cycleWeekStart,
    getRelativeDateInfo,
    createLocalRestorePoint,
    getLocalRestorePoints,
    restoreFromLocalPoint,
    deleteLocalRestorePoint,
    cloudSyncError,
    lastSyncedAt,
    saveToCloud,
    isSavingToCloud,
    caveiraQuestionPrefs = DEFAULT_CAVEIRA_QUESTION_PREFS,
    setCaveiraQuestionPrefs
  } = useStore();

  void restoreVersion;
  const restorePoints = activeConfigTab === 'sistema' ? (getLocalRestorePoints?.() || []) : [];

  const handleForceUpdate = async () => {
    toast.loading("Limpando caches e forçando atualização...", { id: 'force-update' });
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      toast.success("Caches limpos! Recarregando página...", { id: 'force-update' });
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch {
      window.location.reload();
    }
  };

  const effectiveCycleDays = (() => {
    const isWeekly = (cycleScheduleType || 'weekly') === 'weekly';
    const dayCount = isWeekly ? 7 : (cycle?.length || 0);
    return Array.from({ length: dayCount }, (_, dayIndex) => {
      const baseSlots = Array.isArray(cycle?.[dayIndex]) ? cycle[dayIndex] : [];
      const dateInfo = getRelativeDateInfo ? getRelativeDateInfo(dayIndex) : null;
      const fullDateStr = dateInfo?.fullDateStr;
      const dayOfWeek = isWeekly
        ? (cycleWeekStart === 'monday' ? (dayIndex + 1) % 7 : dayIndex)
        : undefined;
      const matchingRules = (futureScheduleRules || [])
        .filter(r => {
          if (!r || r.v !== 2 || !Array.isArray(r.daySlots)) return false;
          if (fullDateStr && r.fromDate && r.fromDate > fullDateStr) return false;
          if (isWeekly && r.dayOfWeek !== undefined && dayOfWeek !== undefined) {
            return r.dayOfWeek === dayOfWeek;
          }
          return r.cycleIndex === dayIndex || (dayOfWeek !== undefined && r.dayOfWeek === dayOfWeek);
        })
        .sort((a, b) => String(b.fromDate || '').localeCompare(String(a.fromDate || '')));
      return matchingRules.length > 0 ? matchingRules[0].daySlots : baseSlots;
    });
  })();

  const flatCycle = effectiveCycleDays.flat();
  const totalSlots = flatCycle.length;
  
  let b1Count = 0; let b2Count = 0; let b3Count = 0;
  
  flatCycle.forEach(subId => {
    const sub = subjects[subId];
    if (sub) {
      if (sub.block === 'B1') b1Count++;
      else if (sub.block === 'B2') b2Count++;
      else if (sub.block === 'B3') b3Count++;
    }
  });

  const b1Percent = totalSlots > 0 ? Math.round((b1Count / totalSlots) * 100) : 0;
  const b2Percent = totalSlots > 0 ? Math.round((b2Count / totalSlots) * 100) : 0;
  const b3Percent = totalSlots > 0 ? Math.round((b3Count / totalSlots) * 100) : 0;

  const isB2TooLow = b2Percent > 0 && 15 > b2Percent;
  const isB2TooHigh = b2Percent > 40; 
  const isB1TooLow = b1Percent > 0 && 35 > b1Percent;

  const subjectsList = Object.values(subjects || {});

  return (
    <div className="fade-in w-full pb-10 space-y-6">
      {/* Cabeçalho transparente padronizado */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-1">
        <div className="min-w-0">
          <h1 className="font-display text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Ajustes
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {subjectsList.length} {subjectsList.length === 1 ? 'disciplina' : 'disciplinas'} · {totalSlots} {totalSlots === 1 ? 'bloco' : 'blocos'} no ciclo · {APP_VERSION}
          </p>
        </div>
      </header>

      {/* Navegação por abas (underline padronizada) */}
      <div className="border-b border-slate-200/80 dark:border-slate-800 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 min-w-max">
          {[
            { id: 'disciplinas', label: 'Disciplinas & Edital', icon: BookOpen },
            { id: 'ritmo', label: 'Ritmo & Metas', icon: Target },
            { id: 'perfil', label: 'Perfil & Alertas', icon: User },
            { id: 'sistema', label: 'Backup & Sistema', icon: Shield }
          ].map((tabItem) => {
            const TabIcon = tabItem.icon;
            const isActive = activeConfigTab === tabItem.id;
            return (
              <button
                key={tabItem.id}
                type="button"
                onClick={() => setActiveConfigTab(tabItem.id)}
                className={`relative px-3.5 py-2.5 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'text-sky-600 dark:text-sky-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <TabIcon className="w-3.5 h-3.5 shrink-0" />
                <span>{tabItem.label}</span>
                {isActive && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 bg-sky-600 dark:bg-sky-400 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ABA 1: DISCIPLINAS & EDITAL */}
      {activeConfigTab === 'disciplinas' && (
        <div className="space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Minhas disciplinas</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Gerencie matérias, assuntos, videoaulas ou compartilhe sua grade.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShareModalConfig({ isOpen: true, tab: 'share', initialSubjectId: null })}
                className="h-9 px-3 rounded-lg text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                title="Compartilhar matérias, assuntos e videoaulas"
              >
                <Share2 className="w-3.5 h-3.5 text-sky-500" />
                <span>Compartilhar</span>
              </button>
              <button
                type="button"
                onClick={() => setShareModalConfig({ isOpen: true, tab: 'import', initialSubjectId: null })}
                className="h-9 px-3 rounded-lg text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                title="Importar grade recebida de um colega"
              >
                <Download className="w-3.5 h-3.5 text-emerald-500" />
                <span>Importar</span>
              </button>
              <button
                type="button"
                onClick={() => setShowImportOCR(true)}
                className="h-9 px-3 rounded-lg text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Camera className="w-3.5 h-3.5 text-slate-500" />
                <span>OCR</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const newId = 'sub_' + Date.now();
                  const defaultColor = (availableColors && availableColors[0]?.color) || 'bg-blue-600 text-white';
                  setDraftSubject({
                    id: newId,
                    name: '',
                    color: defaultColor,
                    block: 'B1',
                    speed: 1,
                    timeGoalMinutes: 0,
                    onCompleteAction: 'double_remaining',
                    replacementSubjectId: '',
                    topics: []
                  });
                  setEditingSubjectId(newId);
                }}
                className="h-9 px-3.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova disciplina</span>
              </button>
            </div>
          </div>

          {subjectsList.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-10 text-center">
              <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2.5" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Nenhuma disciplina cadastrada
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Crie sua primeira matéria, importe via código de compartilhamento ou use o scanner OCR.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjectsList.map(sub => {
                const st = getSubjectVideoStats(sub);
                const currentSpeed = Number(sub.speed) || 1;
                const currentTimeGoal = Number(sub.timeGoalMinutes || subjectTimeGoal?.[sub.id]) || 0;
                const dotColor = sub.color?.split(' ')[0] || 'bg-sky-500';
                const completionBehavior =
                  sub.onCompleteAction === 'replace' && sub.replacementSubjectId && subjects[sub.replacementSubjectId]
                    ? `Substitui por ${subjects[sub.replacementSubjectId].name}`
                    : sub.onCompleteAction === 'double_remaining'
                      ? 'Dobra restante no dia'
                      : 'Encerra ao concluir';

                return (
                  <div
                    key={sub.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between gap-3 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`} />
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate" title={sub.name}>
                            {sub.name}
                          </h3>
                          <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 shrink-0">
                            {sub.block}
                          </span>
                        </div>

                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setShareModalConfig({ isOpen: true, tab: 'share', initialSubjectId: sub.id })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title={`Compartilhar ${sub.name}`}
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDraftSubject({
                                ...sub,
                                speed: sub.speed || 1,
                                timeGoalMinutes: currentTimeGoal,
                                onCompleteAction: (sub.onCompleteAction === 'replace' || sub.onCompleteAction === 'double_remaining') ? sub.onCompleteAction : 'keep_fixed',
                                replacementSubjectId: sub.replacementSubjectId || ''
                              });
                              setEditingSubjectId(sub.id);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Editar disciplina"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setGlobalModal({
                                title: 'Excluir disciplina?',
                                message: `Deseja excluir "${sub.name}" permanentemente? Um ponto de restauração será salvo automaticamente antes da exclusão.`,
                                onConfirm: () => {
                                  createLocalRestorePoint?.('pre_delete_subject', `Antes de excluir ${sub.name}`);
                                  const storeState = useStore.getState();
                                  const newSubjects = { ...storeState.subjects };
                                  delete newSubjects[sub.id];
                                  Object.keys(newSubjects).forEach(k => {
                                    if (newSubjects[k]?.replacementSubjectId === sub.id) {
                                      newSubjects[k] = { ...newSubjects[k], replacementSubjectId: '' };
                                    }
                                  });

                                  const newCycle = (storeState.cycle || []).map(day => (day || []).filter(sId => sId !== sub.id));
                                  const newCycleSlotCounts = (storeState.cycleSlotCounts || []).map((counts, dIdx) => {
                                    const day = storeState.cycle?.[dIdx] || [];
                                    return (counts || []).filter((_, sIdx) => day[sIdx] !== sub.id);
                                  });

                                  const newOverrides = {};
                                  const newOverrideCounts = {};
                                  Object.entries(storeState.calendarOverrides || {}).forEach(([dateKey, arr]) => {
                                    const filtered = (arr || []).filter(sId => sId !== sub.id);
                                    if (filtered.length > 0 || (arr || []).length === 0) {
                                      newOverrides[dateKey] = filtered;
                                      if (storeState.calendarOverrideCounts?.[dateKey]) {
                                        newOverrideCounts[dateKey] = storeState.calendarOverrideCounts[dateKey].filter((_, sIdx) => (arr || [])[sIdx] !== sub.id);
                                      }
                                    }
                                  });

                                  const newRules = (storeState.futureScheduleRules || []).map(rule => {
                                    const slots = rule.daySlots || rule.subjects || [];
                                    const filtered = slots.filter(sId => sId !== sub.id);
                                    const filteredCounts = (rule.slotCounts || []).filter((_, sIdx) => slots[sIdx] !== sub.id);
                                    return { ...rule, daySlots: filtered, slotCounts: filteredCounts };
                                  });

                                  useStore.setState({
                                    subjects: newSubjects,
                                    cycle: newCycle,
                                    cycleSlotCounts: newCycleSlotCounts,
                                    calendarOverrides: newOverrides,
                                    calendarOverrideCounts: newOverrideCounts,
                                    futureScheduleRules: newRules,
                                    reviews: (storeState.reviews || []).filter(r =>
                                      r.subjectId !== sub.id ||
                                      r.isCaveiraQuestion ||
                                      Boolean(r.questionData) ||
                                      String(r.id || '').startsWith('rev_caveira_') ||
                                      String(r.topicName || '').startsWith('[Caveira')
                                    ),
                                    completedToday: []
                                  });
                                  useStore.getState().syncAndRepairCaveiraReviews?.();
                                  toast.success(`"${sub.name}" removida. Ponto de restauração salvo.`);
                                }
                              });
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Excluir disciplina"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {completionBehavior}
                        {currentSpeed > 1 && ` · ${currentSpeed}x`}
                        {currentTimeGoal > 0 && ` · ${formatMinutesToFriendly(currentTimeGoal)}/bloco`}
                      </p>
                    </div>

                    <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      <span>{sub.topics?.length || 0} {sub.topics?.length === 1 ? 'assunto' : 'assuntos'}</span>
                      <span className="font-mono text-[11px]" title={`Normal: ${st.totalFriendly} | Acelerado: ${st.acceleratedFriendly}`}>
                        {st.acceleratedFriendly}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ABA 2: RITMO & METAS */}
      {activeConfigTab === 'ritmo' && (
        <div className="space-y-6">
          {/* Auditoria do Ciclo (Curva ABC) */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-sky-500" />
                  <span>Auditoria do ciclo (Curva ABC)</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Distribuição dos seus <strong className="text-slate-800 dark:text-slate-200">{totalSlots} blocos</strong> em relação ao peso real do edital PRF.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800">
              <div className="p-5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Bloco I · Básicas</span>
                  <span className="text-slate-400 dark:text-slate-500 font-mono">Alvo ~46%</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`font-mono text-2xl font-bold tabular-nums ${isB1TooLow ? 'text-rose-600 dark:text-rose-400' : 'text-sky-600 dark:text-sky-400'}`}>
                    {b1Percent}%
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">{b1Count} blocos</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${isB1TooLow ? 'bg-rose-500' : 'bg-sky-500'}`} style={{ width: `${b1Percent}%` }} />
                </div>
              </div>

              <div className="p-5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Bloco II · Trânsito</span>
                  <span className="text-slate-400 dark:text-slate-500 font-mono">Alvo ~25%</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`font-mono text-2xl font-bold tabular-nums ${(isB2TooLow || isB2TooHigh) ? 'text-rose-600 dark:text-rose-400' : 'text-sky-600 dark:text-sky-400'}`}>
                    {b2Percent}%
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">{b2Count} blocos</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${(isB2TooLow || isB2TooHigh) ? 'bg-rose-500' : 'bg-sky-500'}`} style={{ width: `${b2Percent}%` }} />
                </div>
              </div>

              <div className="p-5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Bloco III · Direito</span>
                  <span className="text-slate-400 dark:text-slate-500 font-mono">Alvo ~29%</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-2xl font-bold tabular-nums text-purple-600 dark:text-purple-400">
                    {b3Percent}%
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">{b3Count} blocos</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: `${b3Percent}%` }} />
                </div>
              </div>
            </div>

            {(isB1TooLow || isB2TooLow || isB2TooHigh) && (
              <div className="px-5 py-3.5 border-t border-rose-200/70 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/20 flex items-start gap-2.5">
                <AlertTriangle className="text-rose-600 dark:text-rose-400 w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-800 dark:text-rose-200 leading-relaxed">
                  {isB2TooHigh && 'Seu cronograma está excessivamente focado em Trânsito. Atenção ao volume mínimo de horas do Bloco I.'}
                  {isB2TooLow && 'Pouca alocação em Trânsito. Considere aumentar a cadência do Bloco II.'}
                  {isB1TooLow && !isB2TooHigh && 'O volume do Bloco I (Básicas) está baixo em relação ao mínimo exigido de 15 pontos em 55 questões.'}
                </p>
              </div>
            )}
          </section>

          {/* Data da prova & Metas diárias */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 space-y-5">
              <div>
                <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-500" />
                  <span>Data da prova e meta diária</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Usados para projetar a conclusão do edital e acompanhar seu ritmo diário.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  Data alvo da prova
                </label>
                <input
                  type="date"
                  value={targetExamDate}
                  onChange={(e) => setTargetExamDate(e.target.value)}
                  className="h-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 text-sm font-mono font-medium text-slate-800 dark:text-slate-100 outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  Meta diária global (minutos)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="10"
                    max="1440"
                    value={dailyGoalMinutes}
                    onChange={(e) => setDailyGoalMinutes(parseInt(e.target.value) || 0)}
                    className="w-28 h-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 text-sm font-mono font-semibold text-slate-900 dark:text-white outline-none focus:border-sky-500 tabular-nums"
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400">min / dia</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {[60, 120, 180, 240, 300, 360].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDailyGoalMinutes(mins)}
                      className={`h-8 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        dailyGoalMinutes === mins
                          ? 'bg-sky-600 text-white dark:bg-sky-500 dark:text-slate-950'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                      }`}
                    >
                      {mins / 60}h
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Metas individuais por disciplina */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                  Meta diária por disciplina
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Tempo sugerido de teoria em minutos por dia.
                </p>
              </div>
              <div className="flex-1 max-h-64 overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-slate-800">
                {subjectsList.map(sub => (
                  <div key={sub.id} className="px-5 py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${sub.color?.split(' ')[0] || 'bg-slate-500'}`} />
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{sub.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={subjectGoals?.[sub.id] || ''}
                        onChange={(e) => setSubjectGoal(sub.id, parseInt(e.target.value) || 0)}
                        className="w-16 h-8 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 text-center text-xs font-mono font-semibold text-slate-900 dark:text-white outline-none focus:border-sky-500 tabular-nums"
                      />
                      <span className="text-[11px] text-slate-400">min</span>
                    </div>
                  </div>
                ))}
                {subjectsList.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-8">
                    Nenhuma disciplina cadastrada.
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* Filtros padrão do Projeto Caveira */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-sky-500" />
                  <span>Filtros padrão do Projeto Caveira</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure os 5 níveis oficiais do Caveira, status, bancas e alternativas diretamente no QG.
                </p>
              </div>
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
                Sincronizado com nuvem e extensão
              </span>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Nível de dificuldade (faixas globais do Caveira)
              </div>
              <CaveiraDifficultySelector
                showRateHint
                mode={caveiraQuestionPrefs?.difficultyMode || 'manual'}
                onChangeMode={(nextMode, nextIds) => {
                  setCaveiraQuestionPrefs?.({
                    difficultyMode: nextMode,
                    ...(Array.isArray(nextIds) ? { difficultyIds: nextIds } : {}),
                  });
                }}
                selectedIds={caveiraQuestionPrefs?.difficultyIds || []}
                onChangeIds={(nextIds) =>
                  setCaveiraQuestionPrefs?.({ difficultyMode: 'manual', difficultyIds: nextIds })
                }
                includeUndefined={Boolean(caveiraQuestionPrefs?.includeUndefined)}
                onChangeIncludeUndefined={(val) =>
                  setCaveiraQuestionPrefs?.({ includeUndefined: val })
                }
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                No modo <strong className="text-sky-600 dark:text-sky-400">⚡ Auto</strong>, o QG escolhe de Muito fácil a Muito difícil automaticamente conforme seu histórico no Raio-X.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Status padrão
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { value: 'not_resolved', label: 'Não resolvidas' },
                    { value: 'wrong', label: 'Só erradas' },
                    { value: 'right', label: 'Só certas' },
                    { value: 'resolved', label: 'Resolvidas' },
                    { value: '', label: 'Todas' },
                  ].map((opt) => {
                    const active = (caveiraQuestionPrefs?.status ?? 'not_resolved') === opt.value;
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setCaveiraQuestionPrefs?.({ status: opt.value })}
                        className={`h-7 px-2.5 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                          active
                            ? 'bg-sky-600 text-white border-sky-600 dark:bg-sky-500 dark:text-slate-950 dark:border-sky-500'
                            : 'bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Bancas padrão
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { value: 'cebraspe', label: 'CEBRASPE' },
                    { value: 'caveira_ineditas', label: 'Caveira Inéditas' },
                    { value: 'caveira_adaptadas', label: 'Caveira Adaptadas' },
                  ].map((b) => {
                    const currentBoards = Array.isArray(caveiraQuestionPrefs?.examBoards)
                      ? caveiraQuestionPrefs.examBoards
                      : [];
                    const active = currentBoards.includes(b.value);
                    return (
                      <button
                        key={b.value}
                        type="button"
                        onClick={() => {
                          const nextBoards = active
                            ? currentBoards.filter((x) => x !== b.value)
                            : [...currentBoards, b.value];
                          setCaveiraQuestionPrefs?.({ examBoards: nextBoards });
                        }}
                        className={`h-7 px-2.5 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                          active
                            ? 'bg-sky-600 text-white border-sky-600 dark:bg-sky-500 dark:text-slate-950 dark:border-sky-500'
                            : 'bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        {b.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Nº de alternativas
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { value: null, label: 'Qualquer' },
                    { value: 2, label: 'Certo/Errado (2)' },
                    { value: 4, label: '4 alts' },
                    { value: 5, label: '5 alts' },
                  ].map((opt) => {
                    const currentAlts = Array.isArray(caveiraQuestionPrefs?.numberAlternatives)
                      ? caveiraQuestionPrefs.numberAlternatives
                      : [];
                    const active = opt.value === null
                      ? currentAlts.length === 0
                      : currentAlts.includes(opt.value);
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() =>
                          setCaveiraQuestionPrefs?.({
                            numberAlternatives: opt.value === null ? [] : [opt.value],
                          })
                        }
                        className={`h-7 px-2.5 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                          active
                            ? 'bg-sky-600 text-white border-sky-600 dark:bg-sky-500 dark:text-slate-950 dark:border-sky-500'
                            : 'bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
              Salvo na sua conta do QG e sincronizado automaticamente com a extensão.
            </p>

            <label className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3 cursor-pointer">
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Fixação obrigatória na 1ª conclusão da aula (10q · Muito fácil)
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Aulas divididas em Parte 1, 2, 3... cobram apenas ao concluir a última parte e agendam revisões progressivas de 5 questões (100% para subir de nível).
                </p>
              </div>
              <input
                type="checkbox"
                checked={caveiraQuestionPrefs?.lessonFixationRequired !== false}
                onChange={(e) => setCaveiraQuestionPrefs?.({ lessonFixationRequired: e.target.checked })}
                className="w-4 h-4 mt-0.5 rounded accent-sky-600 cursor-pointer shrink-0"
              />
            </label>
          </section>

          {/* Aceleração de Videoaulas & Meta por Bloco */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Velocidade das aulas e duração por bloco</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ajuste a velocidade de reprodução (0.5x a 4x — aplicada automaticamente com resolução máxima no player) e o tamanho dos blocos para estimar o tempo total de estudo.
              </p>
            </div>

            {(() => {
              let globalLessons = 0;
              let globalOriginalSec = 0;
              let globalAccelSec = 0;

              subjectsList.forEach(sub => {
                const st = getSubjectVideoStats(sub);
                globalLessons += st.totalLessons;
                globalOriginalSec += st.totalSeconds;
                globalAccelSec += st.acceleratedSeconds;
              });

              const globalSavedSec = Math.max(0, globalOriginalSec - globalAccelSec);
              const globalPercentSaved = globalOriginalSec > 0 ? Math.round((globalSavedSec / globalOriginalSec) * 100) : 0;

              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800">
                  <div className="p-4">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Aulas no edital</span>
                    <span className="font-mono text-lg font-bold text-slate-900 dark:text-white tabular-nums mt-0.5 block">
                      {globalLessons}
                    </span>
                  </div>
                  <div className="p-4">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Tempo em 1x</span>
                    <span className="font-mono text-lg font-bold text-slate-700 dark:text-slate-300 tabular-nums mt-0.5 block">
                      {formatSecondsToFriendly(globalOriginalSec)}
                    </span>
                  </div>
                  <div className="p-4">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Com aceleração</span>
                    <span className="font-mono text-lg font-bold text-sky-600 dark:text-sky-400 tabular-nums mt-0.5 block">
                      {formatSecondsToFriendly(globalAccelSec)}
                    </span>
                  </div>
                  <div className="p-4">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Tempo economizado</span>
                    <span className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5 block">
                      {globalSavedSec > 0 ? `-${formatSecondsToFriendly(globalSavedSec)} (${globalPercentSaved}%)` : '0m'}
                    </span>
                  </div>
                </div>
              );
            })()}

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {subjectsList.map(sub => {
                const st = getSubjectVideoStats(sub);
                const currentSpeed = Number(sub.speed) || 1;
                const currentTimeGoal = Number(sub.timeGoalMinutes || subjectTimeGoal?.[sub.id]) || 0;
                const dotColor = sub.color?.split(' ')[0] || 'bg-sky-500';

                return (
                  <div key={sub.id} className="px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{sub.name}</span>
                        <span className="text-[11px] font-mono text-slate-400">{sub.block}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                          · {st.totalLessons} {st.totalLessons === 1 ? 'aula' : 'aulas'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
                        <span>1x: {st.totalFriendly}</span>
                        <span className="text-sky-600 dark:text-sky-400 font-medium">
                          {currentSpeed}x: {st.acceleratedFriendly}
                        </span>
                        {currentSpeed > 1 && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            Economia: -{st.savedFriendly} (-{st.percentSaved}%)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <div className="inline-flex items-center gap-0.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800">
                        {[1, 1.25, 1.5, 1.75, 2].map(spd => {
                          const isSelected = currentSpeed === spd;
                          return (
                            <button
                              key={spd}
                              type="button"
                              onClick={() => {
                                setSubjectSpeed(sub.id, spd);
                                toast.success(`${sub.name}: velocidade ${spd}x.`, { duration: 1200 });
                              }}
                              className={`px-2 py-1 rounded-md text-[11px] font-mono font-semibold transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-sky-600 text-white dark:bg-sky-500 dark:text-slate-950'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              {spd}x
                            </button>
                          );
                        })}
                      </div>

                      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800">
                        <input
                          key={`${sub.id}-${currentSpeed}`}
                          type="number"
                          min="0.5"
                          max="4"
                          step="0.05"
                          defaultValue={currentSpeed}
                          aria-label={`Velocidade personalizada de ${sub.name}`}
                          title="Digite qualquer velocidade (0.5x a 4x) e pressione Enter ou saia do campo"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            }
                          }}
                          onBlur={(e) => {
                            const parsed = Number(e.target.value);
                            if (!Number.isFinite(parsed) || parsed <= 0) {
                              e.target.value = String(currentSpeed);
                              return;
                            }
                            const clamped = Math.min(4, Math.max(0.5, Math.round(parsed * 100) / 100));
                            e.target.value = String(clamped);
                            if (clamped !== currentSpeed) {
                              setSubjectSpeed(sub.id, clamped);
                              toast.success(`${sub.name}: velocidade ${clamped}x.`, { duration: 1200 });
                            }
                          }}
                          className="w-14 h-6 px-1.5 text-right rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-mono font-semibold tabular-nums text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                        />
                        <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400">x</span>
                      </div>

                      <div className="inline-flex items-center gap-0.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800">
                        {[
                          { label: '1 aula', val: 0 },
                          { label: '45m', val: 45 },
                          { label: '1h', val: 60 },
                          { label: '1h30', val: 90 },
                          { label: '2h', val: 120 }
                        ].map(preset => {
                          const lessonsN = Number(sub.lessonsPerBlock) || 0;
                          const isSel = lessonsN === 0 && currentTimeGoal === preset.val;
                          return (
                            <button
                              key={preset.val}
                              type="button"
                              onClick={() => {
                                setSubjectTimeGoal(sub.id, preset.val);
                                if (preset.val === 0) setSubjectLessonsPerBlock(sub.id, 0);
                                toast.success(`${sub.name}: bloco definido em ${preset.label}.`, { duration: 1200 });
                              }}
                              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                                isSel
                                  ? 'bg-emerald-600 text-white'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              {preset.label}
                            </button>
                          );
                        })}
                        <div
                          className={`flex items-center gap-1 pl-1.5 pr-1.5 py-0.5 rounded-md border ${
                            Number(sub.lessonsPerBlock) > 0
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                              : 'border-transparent'
                          }`}
                          title="Quantidade fixa de aulas por bloco"
                        >
                          <input
                            type="number"
                            min="0"
                            max="50"
                            placeholder="Nº"
                            value={Number(sub.lessonsPerBlock) > 0 ? sub.lessonsPerBlock : ''}
                            onChange={(e) => setSubjectLessonsPerBlock(sub.id, e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                            className="w-8 bg-transparent text-center text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-400 outline-none placeholder:text-slate-400"
                          />
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">aulas</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {subjectsList.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-8">
                  Nenhuma disciplina cadastrada para configurar aceleração.
                </p>
              )}
            </div>
          </section>
        </div>
      )}

      {/* ABA 3: PERFIL & ALERTAS */}
      {activeConfigTab === 'perfil' && (
        <div className="space-y-6">
          <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 sm:p-6">
            <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-5">
              <User className="w-4 h-4 text-sky-500" />
              <span>Identidade e preferências</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <span className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-3">
                  Foto de perfil
                </span>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0">
                    {userStats.avatar ? (
                      <img src={assetUrl(userStats.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="h-9 px-3.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 text-xs font-semibold inline-flex items-center justify-center cursor-pointer transition-colors">
                      Enviar foto
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 500 * 1024) {
                            setGlobalModal({ title: 'Arquivo muito grande', message: 'A imagem deve ter no máximo 500KB.', isAlert: true });
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            useStore.setState(s => ({ userStats: { ...s.userStats, avatar: reader.result } }));
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                    {userStats.avatar && (
                      <button
                        type="button"
                        onClick={() => useStore.setState(s => ({ userStats: { ...s.userStats, avatar: '' } }))}
                        className="text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline text-left cursor-pointer"
                      >
                        Remover foto
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
                  JPG ou PNG até 500KB.
                </p>
              </div>

              <div>
                <span className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-3">
                  Feedback sonoro
                </span>
                <button
                  type="button"
                  onClick={() => setEnableSounds(!enableSounds)}
                  className={`flex items-center gap-3.5 p-3.5 rounded-xl border transition-colors w-full max-w-xs cursor-pointer ${
                    enableSounds
                      ? 'bg-sky-50/70 border-sky-200 text-sky-800 dark:bg-sky-950/30 dark:border-sky-900/60 dark:text-sky-300'
                      : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-850 dark:border-slate-800 dark:text-slate-400'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${enableSounds ? 'bg-sky-600 text-white' : 'bg-slate-300 dark:bg-slate-700 text-white'}`}>
                    {enableSounds ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold">{enableSounds ? 'Sons ativados' : 'Sons desativados'}</p>
                    <p className="text-[11px] opacity-80">Efeitos sutis ao ganhar XP e concluir revisões.</p>
                  </div>
                </button>
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 sm:p-6">
            <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-5">
              <Shield className="w-4 h-4 text-sky-500" />
              <span>Notificações e lembretes</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  Ative notificações no navegador para receber lembretes de revisões FSRS acumuladas e alertas para manter sua ofensiva diária.
                </p>
                {notificationsSupported && Notification.permission === 'default' && (
                  <button
                    type="button"
                    onClick={() => {
                      Notification.requestPermission().then(perm => {
                        if (perm === 'granted') {
                          setPushSettings({ ...pushSettings, enabled: true });
                          toast.success('Notificações autorizadas.');
                        } else {
                          toast.error('Permissão de notificações recusada.');
                        }
                      });
                    }}
                    className="h-9 px-4 rounded-lg bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Ativar notificações no navegador
                  </button>
                )}
                {notificationsSupported && Notification.permission === 'granted' && (
                  <p className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="w-4 h-4" />
                    Permissão concedida pelo navegador
                  </p>
                )}
                {notificationsSupported && Notification.permission === 'denied' && (
                  <p className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                    Notificações bloqueadas nas configurações do navegador
                  </p>
                )}
                {!notificationsSupported && (
                  <p className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <AlertTriangle className="w-4 h-4" />
                    Este navegador não suporta notificações nativas
                  </p>
                )}
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl">
                <label className="px-4 py-3 flex items-center justify-between gap-3 cursor-pointer">
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Alertas ativos</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Liga ou desliga todos os lembretes.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={pushSettings.enabled}
                    disabled={!notificationsSupported || Notification.permission !== 'granted'}
                    onChange={(e) => setPushSettings({ ...pushSettings, enabled: e.target.checked })}
                    className="w-4 h-4 rounded accent-sky-600 cursor-pointer disabled:cursor-not-allowed"
                  />
                </label>

                {pushSettings.enabled && (
                  <div className="px-4 py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Horário do lembrete</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Horário diário para iniciar os estudos.</p>
                    </div>
                    <input
                      type="time"
                      value={pushTime || '08:00'}
                      onChange={(e) => setPushTime(e.target.value)}
                      className="h-8 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 text-xs font-mono text-slate-800 dark:text-slate-200 outline-none focus:border-sky-500"
                    />
                  </div>
                )}

                <label className="px-4 py-3 flex items-center justify-between gap-3 cursor-pointer">
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Ofensiva em risco</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Aviso no fim do dia caso ainda não tenha estudado.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={pushSettings.streakWarning}
                    disabled={!pushSettings.enabled}
                    onChange={(e) => setPushSettings({ ...pushSettings, streakWarning: e.target.checked })}
                    className="w-4 h-4 rounded accent-sky-600 cursor-pointer disabled:cursor-not-allowed"
                  />
                </label>

                <label className="px-4 py-3 flex items-center justify-between gap-3 cursor-pointer">
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Revisões acumuladas</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Alerta quando houver mais de 5 revisões pendentes.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={pushSettings.reviewsPending}
                    disabled={!pushSettings.enabled}
                    onChange={(e) => setPushSettings({ ...pushSettings, reviewsPending: e.target.checked })}
                    className="w-4 h-4 rounded accent-sky-600 cursor-pointer disabled:cursor-not-allowed"
                  />
                </label>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ABA 4: BACKUP & SISTEMA */}
      {activeConfigTab === 'sistema' && (
        <div className="space-y-6">
          {/* Status da nuvem */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Cloud className={`w-5 h-5 shrink-0 mt-0.5 ${cloudSyncError ? 'text-amber-500' : 'text-sky-500'}`} />
              <div>
                <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                  Sincronização na nuvem
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {user
                    ? cloudSyncError
                      ? cloudSyncError
                      : lastSyncedAt
                        ? `Última sincronização em ${formatSnapshotTimestamp(lastSyncedAt)} (${user.email})`
                        : `Conectado como ${user.email}`
                    : 'Modo local ativo. Faça login para sincronizar entre dispositivos.'}
                </p>
              </div>
            </div>
            {user && (
              <button
                type="button"
                disabled={isSavingToCloud}
                onClick={async () => {
                  const ok = await saveToCloud?.();
                  if (ok) toast.success('Dados sincronizados com a nuvem.');
                  else toast.error('Não foi possível sincronizar agora.');
                }}
                className="h-9 px-3.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSavingToCloud ? 'animate-spin' : ''}`} />
                <span>{isSavingToCloud ? 'Sincronizando...' : 'Sincronizar agora'}</span>
              </button>
            )}
          </section>

          {/* Pontos de Restauração Automáticos */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-sky-500" />
                  <span>Pontos de restauração locais</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Snapshots salvos automaticamente antes de ações destrutivas (reset, exclusão de matéria ou importação). Mantém até 8 versões recentes neste navegador.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const created = createLocalRestorePoint?.('manual', 'Ponto manual');
                  if (created) {
                    setRestoreVersion(v => v + 1);
                    toast.success('Ponto de restauração criado.');
                  } else {
                    toast.error('Nenhum dado para salvar no momento.');
                  }
                }}
                className="h-9 px-3.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Criar ponto agora</span>
              </button>
            </div>

            {restorePoints.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                Nenhum ponto de restauração salvo ainda. Clique em "Criar ponto agora" ou faça alterações para gerar snapshots automáticos.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {restorePoints.map((pt) => (
                  <div key={pt.id} className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">
                          {pt.label || formatBackupReasonLabel(pt.reason)}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 tabular-nums">
                          {formatSnapshotTimestamp(pt.timestamp)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                        {pt.summary?.subjectsCount || 0} matérias · {pt.summary?.completedLessons || 0} aulas concluídas · {pt.summary?.reviewsCount || 0} revisões · {(pt.summary?.xp || 0).toLocaleString()} XP
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={isRestoringPoint}
                        onClick={() => {
                          setGlobalModal({
                            title: 'Restaurar ponto salvo?',
                            message: `Seus dados atuais serão substituídos pelo snapshot de ${formatSnapshotTimestamp(pt.timestamp)}. Um ponto de segurança do estado atual será criado automaticamente antes.`,
                            onConfirm: async () => {
                              setIsRestoringPoint(true);
                              try {
                                const res = await restoreFromLocalPoint?.(pt.id);
                                if (res === true || res?.ok) {
                                  setRestoreVersion(v => v + 1);
                                  toast.success('Ponto restaurado com sucesso.');
                                } else {
                                  toast.error(res?.error || 'Não foi possível restaurar este ponto.');
                                }
                              } finally {
                                setIsRestoringPoint(false);
                              }
                            }
                          });
                        }}
                        className="h-8 px-3 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restaurar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          deleteLocalRestorePoint?.(pt.id);
                          setRestoreVersion(v => v + 1);
                          toast.success('Ponto removido.');
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Excluir ponto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Exportar / Importar JSON */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-500" />
                <span>Backup em arquivo (.json)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl">
                Exporte uma cópia completa do seu progresso para guardar no computador ou importe um arquivo salvo anteriormente.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const state = useStore.getState();
                  const dataToExport = {};
                  PERSISTED_KEYS.forEach(key => { if (state[key] !== undefined) dataToExport[key] = state[key]; });

                  const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `qg-prf-backup-${useStore.getState().getLocalDateStr()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success('Backup exportado.');
                }}
                className="h-9 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar (.json)</span>
              </button>

              <label className="h-9 px-3.5 rounded-lg bg-white hover:bg-slate-50 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap">
                <Upload className="w-3.5 h-3.5" />
                <span>Importar (.json)</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                      try {
                        const content = event.target.result;
                        const parsed = JSON.parse(content);

                        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
                          throw new Error('formato inválido');
                        }
                        if (!PERSISTED_KEYS.some(k => parsed[k] !== undefined)) {
                          throw new Error('backup sem dados reconhecíveis');
                        }

                        // Snapshot preventivo antes de sobrescrever com arquivo JSON
                        createLocalRestorePoint?.('pre_import_backup', `Antes de importar ${file.name}`);

                        const merged = { ...getCleanInitialState() };
                        PERSISTED_KEYS.forEach(k => { if (parsed[k] !== undefined) merged[k] = parsed[k]; });

                        if (merged.calendarDate) merged.calendarDate = new Date(merged.calendarDate);
                        if (merged.reviewCalendarDate) merged.reviewCalendarDate = new Date(merged.reviewCalendarDate);

                        useStore.setState(merged);
                        useStore.getState().syncDayRollover?.();
                        useStore.getState().syncAndRepairCaveiraReviews?.();
                        try {
                          localStorage.setItem('prf_caveira_questions', JSON.stringify(merged.caveiraQuestions || []));
                        } catch (_) {}
                        await useStore.getState().saveToCloud();
                        setRestoreVersion(v => v + 1);
                        toast.success('Backup restaurado com sucesso.');
                      } catch {
                        toast.error('Arquivo de backup inválido.');
                      }
                    };
                    reader.readAsText(file);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
          </section>

          {/* Versão e cache */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                  Versão do aplicativo
                </h2>
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                  {APP_VERSION}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Caso uma atualização recente não carregue automaticamente, limpe o cache local do navegador.
              </p>
            </div>
            <button
              type="button"
              onClick={handleForceUpdate}
              className="h-9 px-3.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Limpar cache e recarregar</span>
            </button>
          </section>

          {/* Zona de perigo */}
          <section className="bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/50 rounded-xl p-5 space-y-4">
            <div>
              <h2 className="font-display text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Zona de perigo</span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
                Escolha exatamente quais módulos deseja zerar (aulas assistidas, ciclo, Raio-X, revisões FSRS, carreira ou disciplinas). Um ponto de restauração local é salvo automaticamente antes de qualquer reset.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="h-9 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset seletivo</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setGlobalModal({
                    title: 'Zerar todos os dados?',
                    message: 'Isto apagará todas as matérias, assuntos, histórico, moedas e progresso da nuvem. Um ponto de restauração local será preservado caso precise recuperar.',
                    onConfirm: () => {
                      executeTotalWipe();
                      toast.error('Sistema zerado.');
                    }
                  });
                }}
                className="h-9 px-4 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold transition-colors cursor-pointer"
              >
                Zerar tudo agora
              </button>
            </div>
          </section>
        </div>
      )}
      {/* Modal de Edição de Disciplina */}
      {editingSubjectId && draftSubject && createPortal((
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-[120] p-3 sm:p-5 overflow-y-auto fade-in font-sans"
          onClick={() => {
            setEditingSubjectId(null);
            setDraftSubject(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-subject-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_24px_64px_-16px_rgba(15,23,42,0.35)] dark:shadow-[0_24px_64px_-16px_rgba(0,0,0,0.75)] ring-1 ring-slate-950/5 dark:ring-white/[0.04] max-w-2xl w-full border border-slate-200/90 dark:border-slate-800 relative overflow-hidden flex flex-col h-[90vh] max-h-[90vh] my-auto"
          >
            {/* Cabeçalho Fixo */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/90 flex items-start justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 dark:bg-sky-400/10 ring-1 ring-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 id="edit-subject-modal-title" className="font-display text-base font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                    Configurar disciplina
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                    ID: {draftSubject.id}
                  </p>
                </div>
              </div>
                <button
                type="button"
                onClick={() => {
                  setEditingSubjectId(null);
                  setDraftSubject(null);
                  setExpandedTopicLinkIdx(null);
                  setExpandedLessonLinkKey(null);
                }}
                aria-label="Fechar janela"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Corpo com rolagem independente */}
            <div ref={modalBodyRef} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-5 space-y-5">
              {/* Dados Básicos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nome da disciplina
                  </label>
                  <input
                    type="text"
                    value={draftSubject.name}
                    onChange={(e) => setDraftSubject(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
                    className="w-full h-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 font-semibold text-sm text-slate-900 dark:text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    placeholder="Ex.: PORTUGUÊS..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Alocação de bloco
                  </label>
                  <select
                    value={draftSubject.block}
                    onChange={(e) => setDraftSubject(prev => ({ ...prev, block: e.target.value }))}
                    className="w-full h-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 font-semibold text-sm text-slate-900 dark:text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all cursor-pointer"
                  >
                    <option value="B1">Bloco I (Básicas)</option>
                    <option value="B2">Bloco II (Trânsito)</option>
                    <option value="B3">Bloco III (Direito)</option>
                  </select>
                </div>
              </div>

              {/* Cores */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Cor da disciplina ({availableColors?.length || 18} opções)
                  </label>
                  {draftSubject.color && (
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${draftSubject.color}`}>
                      Cor selecionada
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-6 sm:grid-cols-9 gap-2 p-3 bg-slate-50/80 dark:bg-slate-950/55 rounded-xl border border-slate-200/80 dark:border-slate-800/90">
                  {availableColors.map(c => {
                    const isSelected = draftSubject.color === c.color;
                    const isDarkText = c.color.includes('text-slate-950') || c.color.includes('text-slate-900');
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setDraftSubject(prev => ({ ...prev, color: c.color }))}
                        title={c.label}
                        className={`h-9 rounded-lg transition-all relative flex items-center justify-center cursor-pointer ${
                          isSelected
                            ? 'ring-2 ring-slate-900 dark:ring-white ring-offset-2 ring-offset-white dark:ring-offset-slate-900 shadow-sm scale-105 z-10'
                            : 'hover:scale-105 opacity-85 hover:opacity-100'
                        }`}
                      >
                        <div className={`w-full h-full rounded-lg ${c.color.split(' ')[0]} flex items-center justify-center`}>
                          {isSelected && (
                            <Check className={`w-4 h-4 stroke-[3] ${isDarkText ? 'text-slate-950' : 'text-white'}`} />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Velocidade de Vídeo-Aula */}
              <div className="bg-slate-50/80 dark:bg-slate-950/55 border border-slate-200/80 dark:border-slate-800/90 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FastForward className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    Velocidade de reprodução padrão
                  </label>
                  <span className="text-xs font-semibold tabular-nums text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800/80 px-2 py-0.5 rounded-md">
                    {Math.min(4, Math.max(0.5, Number(draftSubject.speed) || 1))}x
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                  Defina em qual velocidade você assiste às videoaulas desta matéria. O sistema recalcula os tempos reais de estudo e a extensão aplica automaticamente a velocidade e a resolução máxima no player.
                </p>
                <div className="flex gap-2 mb-3">
                  {[1, 1.25, 1.5, 1.75, 2].map(s => {
                    const isSel = Number(draftSubject.speed || 1) === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setDraftSubject(prev => ({ ...prev, speed: s }))}
                        className={`flex-1 h-9 rounded-lg text-xs font-semibold tabular-nums transition-colors cursor-pointer ${
                          isSel
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {s}x
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between gap-3 mb-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2">
                  <label htmlFor="custom-subject-speed" className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Velocidade personalizada (0.5x a 4x)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      id="custom-subject-speed"
                      type="number"
                      min="0.5"
                      max="4"
                      step="0.05"
                      value={draftSubject.speed ?? 1}
                      onChange={(e) => {
                        setDraftSubject(prev => ({ ...prev, speed: e.target.value }));
                      }}
                      onBlur={() => {
                        const parsed = Number(draftSubject.speed);
                        const clamped = Number.isFinite(parsed) && parsed > 0
                          ? Math.min(4, Math.max(0.5, Math.round(parsed * 100) / 100))
                          : 1;
                        setDraftSubject(prev => ({ ...prev, speed: clamped }));
                      }}
                      className="w-20 h-8 px-2 text-right rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold tabular-nums text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                    />
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">x</span>
                  </div>
                </div>

                {/* Comparativo de Tempo da Matéria */}
                {(() => {
                  const safeSpeed = Math.min(4, Math.max(0.5, Number(draftSubject.speed) || 1));
                  const stats = getSubjectVideoStats({ ...draftSubject, speed: safeSpeed });
                  return (
                    <div className="grid grid-cols-3 gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 text-center">
                      <div>
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Sem aceleração</span>
                        <span className="text-xs font-bold tabular-nums text-slate-800 dark:text-slate-200">{stats.totalFriendly}</span>
                      </div>
                      <div>
                        <span className="text-[11px] font-medium text-sky-600 dark:text-sky-400 block">Em {safeSpeed}x</span>
                        <span className="text-xs font-bold tabular-nums text-sky-600 dark:text-sky-400">{stats.acceleratedFriendly}</span>
                      </div>
                      <div>
                        <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 block">Economia</span>
                        <span className="text-xs font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                          {stats.savedSeconds > 0 ? `-${stats.savedFriendly} (${stats.percentSaved}%)` : '0m'}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Meta de Tempo por Bloco de Estudo no Ciclo */}
              <div className="bg-slate-50/80 dark:bg-slate-950/55 border border-slate-200/80 dark:border-slate-800/90 p-4 rounded-xl">
                <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Meta por bloco no ciclo
                  </label>
                  <span className="text-xs font-semibold tabular-nums text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/80 px-2 py-0.5 rounded-md">
                    {draftSubject.timeGoalMinutes > 0 ? formatMinutesToFriendly(draftSubject.timeGoalMinutes) : (Number(draftSubject.lessonsPerBlock) > 0 ? `${draftSubject.lessonsPerBlock} aulas fixas` : 'Sem meta (1 aula)')}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                  Defina quanto tempo deseja estudar desta matéria em cada bloco do cronograma (ex.: 1h30). O sistema agrupará as videoaulas no tempo acelerado até completar a meta.
                </p>

                {/* Presets Rápidos */}
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {[
                    { label: '1 aula', val: 0 },
                    { label: '45m', val: 45 },
                    { label: '1h', val: 60 },
                    { label: '1h 30m', val: 90 },
                    { label: '2h', val: 120 }
                  ].map(preset => {
                    const isSel = !(Number(draftSubject.lessonsPerBlock) > 0) && (draftSubject.timeGoalMinutes || 0) === preset.val;
                    return (
                      <button
                        key={preset.val}
                        type="button"
                        onClick={() => setDraftSubject(prev => ({ ...prev, timeGoalMinutes: preset.val, lessonsPerBlock: 0 }))}
                        className={`h-9 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          isSel
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                {/* Input customizado de minutos */}
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 text-xs">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Tempo personalizado (em minutos):</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="360"
                      step="5"
                      value={draftSubject.timeGoalMinutes || 0}
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value) || 0);
                        setDraftSubject(prev => ({ ...prev, timeGoalMinutes: val, lessonsPerBlock: val > 0 ? 0 : (prev.lessonsPerBlock || 0) }));
                      }}
                      className="w-16 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-center font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400 outline-none focus:border-emerald-500"
                    />
                    <span className="text-slate-500 font-medium">min</span>
                  </div>
                </div>

                {/* Quantidade fixa de aulas por bloco */}
                <div className={`mt-2 flex flex-col gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-lg border text-xs ${Number(draftSubject.lessonsPerBlock) > 0 ? 'border-emerald-400 dark:border-emerald-500' : 'border-slate-200/80 dark:border-slate-800'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Ou: quantidade fixa de aulas por bloco:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        placeholder="0"
                        value={Number(draftSubject.lessonsPerBlock) > 0 ? draftSubject.lessonsPerBlock : ''}
                        onChange={(e) => {
                          const val = Math.min(50, Math.max(0, parseInt(e.target.value) || 0));
                          setDraftSubject(prev => ({ ...prev, lessonsPerBlock: val, timeGoalMinutes: val > 0 ? 0 : (prev.timeGoalMinutes || 0) }));
                        }}
                        className="w-16 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-center font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400 outline-none focus:border-emerald-500"
                      />
                      <span className="text-slate-500 font-medium">aulas</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[2, 3, 4, 5, 6, 8, 10].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setDraftSubject(prev => ({ ...prev, lessonsPerBlock: n, timeGoalMinutes: 0 }))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          Number(draftSubject.lessonsPerBlock) === n
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {n} aulas
                      </button>
                    ))}
                  </div>
                  {Number(draftSubject.lessonsPerBlock) > 0 && (
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                      Cada bloco terá exatamente <strong>{draftSubject.lessonsPerBlock} {Number(draftSubject.lessonsPerBlock) === 1 ? 'aula' : 'aulas'}</strong> (a meta de tempo fica desativada).
                    </p>
                  )}
                </div>

                {/* Preview de quantas aulas cabem */}
                {draftSubject.timeGoalMinutes > 0 && (() => {
                  const firstTopic = (draftSubject.topics || []).find(t => (t.lessons && t.lessons.length > 0) || t.total > 0);
                  const spd = Math.min(4, Math.max(0.5, Number(draftSubject.speed) || 1));
                  const sample = firstTopic
                    ? calculateLessonsForGoal(firstTopic.lessons || [], 0, spd, draftSubject.timeGoalMinutes, firstTopic.total)
                    : null;
                  return (
                    <div className="mt-3 p-2.5 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>
                        Com a meta de <strong>{formatMinutesToFriendly(draftSubject.timeGoalMinutes)}</strong> a <strong>{spd}x</strong>, cada bloco agrupará <strong>~{sample?.count || 2} aulas</strong> no cronograma.
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Vínculo no Projeto Caveira (curso padrão ou cursos isolados por assunto) */}
              <div className="bg-slate-50/80 dark:bg-slate-950/55 border border-slate-200/80 dark:border-slate-800/90 p-4 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Vínculo no Projeto Caveira
                  </label>
                  <div className="flex items-center gap-2">
                    {draftSubject.caveiraCourseId && (
                      <span className="text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/70 px-2 py-0.5 rounded-md">
                        Curso #{draftSubject.caveiraCourseId}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setDraftSubject((prev) => ({
                          ...prev,
                          caveiraCourseId: '',
                          caveiraCourseName: '',
                          caveiraModuleUrl: '',
                          topics: (prev.topics || []).map((t) => ({
                            ...t,
                            caveiraCourseId: '',
                            caveiraCourseName: '',
                            caveiraModuleUrl: '',
                            lessons: (t.lessons || []).map((l) => {
                              const nextL = { ...l };
                              delete nextL.caveiraUrl;
                              delete nextL.caveiraVideoId;
                              delete nextL.caveiraCourseId;
                              delete nextL.caveiraCourseName;
                              return nextL;
                            }),
                          })),
                        }));
                        toast.info('Links do Caveira limpos nesta disciplina.');
                      }}
                      className="text-[11px] font-semibold text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Unlink className="w-3 h-3" />
                      Limpar links do Caveira
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Se um assunto estiver em um curso isolado (ex.: &quot;Português para Iniciantes - Parte 1&quot;), defina o link diretamente no ícone de elo do assunto ou da aula abaixo.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={draftSubject.caveiraModuleUrl || ''}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      const cid = extractCourseIdFromUrl(val);
                      setDraftSubject((prev) => ({
                        ...prev,
                        caveiraModuleUrl: val,
                        caveiraCourseId: cid || '',
                      }));
                    }}
                    placeholder="URL padrão do curso/módulo (opcional)"
                    className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    value={draftSubject.caveiraCourseName || ''}
                    onChange={(e) => setDraftSubject((prev) => ({ ...prev, caveiraCourseName: e.target.value }))}
                    placeholder="Nome do curso (ex.: Português para Iniciantes - Parte 1)"
                    className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Transição ao Concluir Edital / Aulas */}
              <div className="bg-slate-50/80 dark:bg-slate-950/55 border border-slate-200/80 dark:border-slate-800/90 p-4 rounded-xl">
                <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    Transição ao concluir conteúdo
                  </label>
                  <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800/80 px-2 py-0.5 rounded-md">
                    {draftSubject.onCompleteAction === 'replace' ? 'Substituir' : draftSubject.onCompleteAction === 'double_remaining' ? 'Dobrar no dia' : 'Encerrar ao fim'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                  Quando todas as aulas desta matéria forem concluídas, o que o cronograma e o calendário devem fazer com os blocos vagos?
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-2">
                  {/* Opção 1: Dobrar */}
                  <button
                    type="button"
                    onClick={() => setDraftSubject(prev => ({ ...prev, onCompleteAction: 'double_remaining' }))}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                      draftSubject.onCompleteAction === 'double_remaining'
                        ? 'bg-sky-50/90 dark:bg-sky-950/40 border-sky-400 dark:border-sky-500 ring-1 ring-sky-500/25'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Dobrar no dia
                      </span>
                      {draftSubject.onCompleteAction === 'double_remaining' && (
                        <Check className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 stroke-[3]" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      A vaga é absorvida pela outra matéria pendente do mesmo dia.
                    </p>
                  </button>

                  {/* Opção 2: Substituir */}
                  <button
                    type="button"
                    onClick={() => setDraftSubject(prev => ({ ...prev, onCompleteAction: 'replace' }))}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                      draftSubject.onCompleteAction === 'replace'
                        ? 'bg-sky-50/90 dark:bg-sky-950/40 border-sky-400 dark:border-sky-500 ring-1 ring-sky-500/25'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Shuffle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Nova disciplina
                      </span>
                      {draftSubject.onCompleteAction === 'replace' && (
                        <Check className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 stroke-[3]" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      Outra matéria cadastrada entra no lugar desta quando acabar.
                    </p>
                  </button>

                  {/* Opção 3: Encerrar ao Concluir */}
                  <button
                    type="button"
                    onClick={() => setDraftSubject(prev => ({ ...prev, onCompleteAction: 'keep_fixed' }))}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                      (draftSubject.onCompleteAction !== 'replace' && draftSubject.onCompleteAction !== 'double_remaining')
                        ? 'bg-sky-50/90 dark:bg-sky-950/40 border-sky-400 dark:border-sky-500 ring-1 ring-sky-500/25'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" /> Encerrar ao fim
                      </span>
                      {(draftSubject.onCompleteAction !== 'replace' && draftSubject.onCompleteAction !== 'double_remaining') && (
                        <Check className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 stroke-[3]" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      Ao concluir a última aula, a matéria encerra e libera o horário.
                    </p>
                  </button>
                </div>

                {/* Se escolher substituir por outra matéria */}
                {draftSubject.onCompleteAction === 'replace' && (
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 mt-2.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Qual disciplina deve entrar nesta vaga quando concluir?
                    </label>
                    <select
                      value={draftSubject.replacementSubjectId || ''}
                      onChange={(e) => setDraftSubject(prev => ({ ...prev, replacementSubjectId: e.target.value }))}
                      className="w-full h-9 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-sky-500 cursor-pointer"
                    >
                      <option value="">-- Selecione uma matéria substituta --</option>
                      {Object.values(subjects || {})
                        .filter(s => s.id !== draftSubject.id)
                        .map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.topics?.reduce((acc, t) => acc + (t.total || 0), 0) || 0} aulas cadastradas)
                          </option>
                        ))}
                    </select>
                    {(!draftSubject.replacementSubjectId || !subjects[draftSubject.replacementSubjectId]) && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Selecione uma disciplina acima para assumir a vaga automaticamente.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Assuntos */}
              <div>
                <div className="flex justify-between items-center mb-3 border-b border-slate-100 dark:border-slate-800/90 pb-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Conteúdo programático (assuntos)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setDraftSubject(prev => {
                        const newTopics = [...(prev.topics || [])];
                        newTopics.push({ id: 't' + Date.now(), name: 'NOVO ASSUNTO', total: 0, completed: 0, lessons: [] });
                        return { ...prev, topics: newTopics };
                      });
                      setTimeout(() => {
                        if (modalBodyRef.current) {
                          modalBodyRef.current.scrollTo({ top: modalBodyRef.current.scrollHeight, behavior: 'smooth' });
                        }
                      }, 60);
                    }}
                    className="flex items-center gap-1 text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/60 px-2.5 py-1 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Novo assunto
                  </button>
                </div>

                <div className="space-y-3">
                  {(() => {
                    const topicsList = draftSubject.topics || [];
                    const moveTopic = (from, to) => {
                      if (from < 0 || to < 0 || from >= topicsList.length || to >= topicsList.length) return;
                      setDraftSubject(prev => {
                        const newTopics = [...(prev.topics || [])];
                        const [moved] = newTopics.splice(from, 1);
                        newTopics.splice(to, 0, moved);
                        return { ...prev, topics: newTopics };
                      });
                    };

                    return topicsList.map((topic, idx) => {
                      const isFirstTopic = idx === 0;
                      const isLastTopic = idx === topicsList.length - 1;

                      return (
                        <div key={topic.id} className="bg-slate-50/80 dark:bg-slate-950/55 border border-slate-200/80 dark:border-slate-800/90 rounded-xl p-3">
                          {/* Linha do nome do assunto + Controles de posição */}
                          <div className="flex gap-2 items-center mb-2">
                            <div className="flex items-center gap-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => moveTopic(idx, 0)}
                                disabled={isFirstTopic}
                                className="p-1 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                                title="Mover para o topo"
                              >
                                <ChevronsUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveTopic(idx, idx - 1)}
                                disabled={isFirstTopic}
                                className="p-1 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                                title="Mover 1 posição para cima"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-1 font-mono tabular-nums select-none">
                                #{idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => moveTopic(idx, idx + 1)}
                                disabled={isLastTopic}
                                className="p-1 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                                title="Mover 1 posição para baixo"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveTopic(idx, topicsList.length - 1)}
                                disabled={isLastTopic}
                                className="p-1 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                                title="Mover para o fim"
                              >
                                <ChevronsDown className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <input
                              type="text"
                              value={topic.name}
                              onChange={(e) => setDraftSubject(prev => {
                                const newTopics = [...prev.topics];
                                newTopics[idx] = { ...newTopics[idx], name: e.target.value };
                                return { ...prev, topics: newTopics };
                              })}
                              className="flex-1 bg-transparent border-b border-slate-200 dark:border-slate-700 pb-1 font-semibold text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500 transition-colors min-w-0"
                              placeholder="Nome do assunto..."
                            />
                            {/* Vínculo de curso isolado por assunto */}
                            <button
                              type="button"
                              onClick={() => setExpandedTopicLinkIdx(expandedTopicLinkIdx === idx ? null : idx)}
                              title={topic.caveiraModuleUrl || topic.caveiraCourseId ? `Vinculado ao curso #${topic.caveiraCourseId || '?'}` : 'Vincular curso/módulo do Caveira a este assunto'}
                              className={`flex items-center gap-1 text-[11px] font-semibold border px-2 py-1 rounded-lg transition-colors shrink-0 cursor-pointer ${
                                topic.caveiraModuleUrl || topic.caveiraCourseId
                                  ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                                  : 'text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:text-emerald-600'
                              }`}
                            >
                              <Link2 className="w-3 h-3" /> Curso
                            </button>
                            {/* Botão escanear aulas */}
                            <button
                              type="button"
                              onClick={() => setScannerTopicIdx(idx)}
                              title="Adicionar aulas por imagem"
                              className="flex items-center gap-1 text-[11px] font-semibold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800/60 px-2 py-1 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors shrink-0 cursor-pointer"
                            >
                              <ScanLine className="w-3 h-3" /> Scan
                            </button>
                            <button
                              type="button"
                              onClick={() => setDraftSubject(prev => ({
                                ...prev,
                                topics: prev.topics.filter((_, i) => i !== idx)
                              }))}
                              className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                              title="Excluir assunto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {expandedTopicLinkIdx === idx && (
                            <div className="mb-2.5 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-800/60 space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                                  Curso do Caveira para este assunto {topic.caveiraCourseId ? `(Curso #${topic.caveiraCourseId})` : ''}
                                </span>
                                {(topic.caveiraModuleUrl || topic.caveiraCourseId || topic.caveiraCourseName) && (
                                  <button
                                    type="button"
                                    onClick={() => setDraftSubject((prev) => {
                                      const newTopics = [...prev.topics];
                                      newTopics[idx] = {
                                        ...newTopics[idx],
                                        caveiraModuleUrl: '',
                                        caveiraCourseId: '',
                                        caveiraCourseName: '',
                                        lessons: (newTopics[idx].lessons || []).map((l) => {
                                          const nl = { ...l };
                                          delete nl.caveiraUrl;
                                          delete nl.caveiraVideoId;
                                          delete nl.caveiraCourseId;
                                          delete nl.caveiraCourseName;
                                          return nl;
                                        }),
                                      };
                                      return { ...prev, topics: newTopics };
                                    })}
                                    className="text-[10.5px] font-semibold text-red-500 hover:text-red-600 cursor-pointer"
                                  >
                                    Limpar link do assunto
                                  </button>
                                )}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  value={topic.caveiraModuleUrl || ''}
                                  onChange={(e) => {
                                    const val = e.target.value.trim();
                                    const newCid = extractCourseIdFromUrl(val);
                                    setDraftSubject((prev) => {
                                      const newTopics = [...prev.topics];
                                      const curLessons = newTopics[idx].lessons || [];
                                      newTopics[idx] = {
                                        ...newTopics[idx],
                                        caveiraModuleUrl: val,
                                        caveiraCourseId: newCid || '',
                                        lessons: curLessons.map((l) => {
                                          const lCid = extractCourseIdFromUrl(l?.caveiraUrl || l?.url);
                                          if (newCid && lCid && lCid !== newCid) {
                                            const nl = { ...l };
                                            delete nl.caveiraUrl;
                                            delete nl.caveiraVideoId;
                                            delete nl.caveiraCourseId;
                                            return nl;
                                          }
                                          return l;
                                        }),
                                      };
                                      return { ...prev, topics: newTopics };
                                    });
                                  }}
                                  placeholder="URL do curso/módulo (ex.: https://app.caveira.com/courses/99)"
                                  className="w-full h-8 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-2.5 text-[11px] text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500"
                                />
                                <input
                                  type="text"
                                  value={topic.caveiraCourseName || ''}
                                  onChange={(e) => setDraftSubject((prev) => {
                                    const newTopics = [...prev.topics];
                                    newTopics[idx] = { ...newTopics[idx], caveiraCourseName: e.target.value };
                                    return { ...prev, topics: newTopics };
                                  })}
                                  placeholder="Nome exato do curso (ex.: Português para Iniciantes - Parte 1)"
                                  className="w-full h-8 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-2.5 text-[11px] text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500"
                                />
                              </div>
                            </div>
                          )}

                          {/* Lista de aulas internas */}
                          {(topic.lessons && topic.lessons.length > 0) ? (
                            <div className="space-y-1 mt-2">
                              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                                <BookOpen className="w-3 h-3" /> {topic.lessons.length} aula{topic.lessons.length !== 1 ? 's' : ''} cadastrada{topic.lessons.length !== 1 ? 's' : ''}
                              </p>
                              {topic.lessons.map((lesson, lIdx) => {
                                const isFirst = lIdx === 0;
                                const isLast = lIdx === topic.lessons.length - 1;
                                const moveLesson = (from, to) => setDraftSubject(prev => {
                                  const newTopics = [...prev.topics];
                                  const newLessons = [...(newTopics[idx].lessons || [])];
                                  const [moved] = newLessons.splice(from, 1);
                                  newLessons.splice(to, 0, moved);
                                  newTopics[idx] = { ...newTopics[idx], lessons: newLessons };
                                  return { ...prev, topics: newTopics };
                                });
                                const insertAfter = (afterIdx) => setDraftSubject(prev => {
                                  const newTopics = [...prev.topics];
                                  const newLessons = [...(newTopics[idx].lessons || [])];
                                  newLessons.splice(afterIdx + 1, 0, { name: 'NOVA AULA', duration: '00:00' });
                                  newTopics[idx] = { ...newTopics[idx], lessons: newLessons, total: newLessons.length };
                                  return { ...prev, topics: newTopics };
                                });
                                return (
                                  <div key={lIdx}>
                                    <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg px-2 py-1.5">
                                      <div className="flex flex-col gap-0.5 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => moveLesson(lIdx, lIdx - 1)}
                                          disabled={isFirst}
                                          className="p-0.5 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                                          title="Mover para cima"
                                        >
                                          <ChevronUp className="w-3 h-3" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => moveLesson(lIdx, lIdx + 1)}
                                          disabled={isLast}
                                          className="p-0.5 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                                          title="Mover para baixo"
                                        >
                                          <ChevronDown className="w-3 h-3" />
                                        </button>
                                      </div>
                                      <span className="text-[11px] font-mono tabular-nums text-slate-400 dark:text-slate-500 shrink-0 w-5 text-right">{lIdx + 1}.</span>
                                      <input
                                        type="text"
                                        value={lesson.name}
                                        onPaste={(e) => e.stopPropagation()}
                                        onChange={(e) => setDraftSubject(prev => {
                                          const newTopics = [...prev.topics];
                                          const newLessons = [...(newTopics[idx].lessons || [])];
                                          newLessons[lIdx] = { ...newLessons[lIdx], name: e.target.value };
                                          newTopics[idx] = { ...newTopics[idx], lessons: newLessons, total: newLessons.length };
                                          return { ...prev, topics: newTopics };
                                        })}
                                        className="flex-1 bg-transparent text-xs font-medium text-slate-900 dark:text-slate-200 outline-none border-b border-transparent focus:border-sky-500 pb-0.5 transition-colors min-w-0"
                                      />
                                      <div className="flex items-center gap-1 shrink-0">
                                        <input
                                          type="text"
                                          value={lesson.duration || '00:00'}
                                          onPaste={(e) => e.stopPropagation()}
                                          onChange={(e) => setDraftSubject(prev => {
                                            const newTopics = [...prev.topics];
                                            const newLessons = [...(newTopics[idx].lessons || [])];
                                            newLessons[lIdx] = { ...newLessons[lIdx], duration: e.target.value };
                                            newTopics[idx] = { ...newTopics[idx], lessons: newLessons };
                                            return { ...prev, topics: newTopics };
                                          })}
                                          className="w-13 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md px-1 py-0.5 text-center text-[11px] font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400 outline-none focus:border-emerald-500"
                                        />
                                        {(() => {
                                          const safeLessonSpeed = Math.min(4, Math.max(0.5, Number(draftSubject.speed) || 1));
                                          return safeLessonSpeed > 1 && lesson.duration && lesson.duration !== '00:00' ? (
                                            <span
                                              className="text-[10px] font-mono tabular-nums font-semibold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/70 px-1.5 py-0.5 rounded-md border border-sky-200 dark:border-sky-900"
                                              title={`Com aceleração de ${safeLessonSpeed}x`}
                                            >
                                              {formatSecondsToClock(Math.round(parseDurationToSeconds(lesson.duration) / safeLessonSpeed))}
                                            </span>
                                          ) : null;
                                        })()}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const k = `${idx}:${lIdx}`;
                                          setExpandedLessonLinkKey(expandedLessonLinkKey === k ? null : k);
                                        }}
                                        className={`p-0.5 transition-colors shrink-0 cursor-pointer ${
                                          lesson.caveiraUrl
                                            ? 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700'
                                            : 'text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                                        }`}
                                        title={lesson.caveiraUrl ? `Link direto: ${lesson.caveiraUrl}` : 'Vincular URL direta desta aula no Caveira'}
                                      >
                                        <Link2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setDraftSubject(prev => {
                                          const newTopics = [...prev.topics];
                                          const newLessons = (newTopics[idx].lessons || []).filter((_, i) => i !== lIdx);
                                          const newTotal = newLessons.length;
                                          newTopics[idx] = {
                                            ...newTopics[idx],
                                            lessons: newLessons,
                                            total: newTotal,
                                            completed: Math.min(newTopics[idx].completed || 0, newTotal)
                                          };
                                          return { ...prev, topics: newTopics };
                                        })}
                                        className="p-0.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors shrink-0 cursor-pointer"
                                        title="Remover aula"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    {expandedLessonLinkKey === `${idx}:${lIdx}` && (
                                      <div className="mt-1 mb-1 flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-100/90 dark:bg-slate-900 border border-emerald-200/70 dark:border-emerald-800/60">
                                        <input
                                          type="text"
                                          value={lesson.caveiraUrl || ''}
                                          onPaste={(e) => e.stopPropagation()}
                                          onChange={(e) => {
                                            const val = e.target.value.trim();
                                            const cid = extractCourseIdFromUrl(val);
                                            setDraftSubject((prev) => {
                                              const newTopics = [...prev.topics];
                                              const newLessons = [...(newTopics[idx].lessons || [])];
                                              newLessons[lIdx] = {
                                                ...newLessons[lIdx],
                                                caveiraUrl: val,
                                                ...(cid ? { caveiraCourseId: cid } : {}),
                                              };
                                              newTopics[idx] = { ...newTopics[idx], lessons: newLessons };
                                              return { ...prev, topics: newTopics };
                                            });
                                          }}
                                          placeholder="Cole o link direto da aula no Caveira..."
                                          className="flex-1 h-7 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 text-[11px] text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500"
                                        />
                                        {lesson.caveiraUrl && (
                                          <a
                                            href={lesson.caveiraUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 shrink-0"
                                            title="Testar link no Caveira"
                                          >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                          </a>
                                        )}
                                        {lesson.caveiraUrl && (
                                          <button
                                            type="button"
                                            onClick={() => setDraftSubject((prev) => {
                                              const newTopics = [...prev.topics];
                                              const newLessons = [...(newTopics[idx].lessons || [])];
                                              const nl = { ...newLessons[lIdx] };
                                              delete nl.caveiraUrl;
                                              delete nl.caveiraVideoId;
                                              delete nl.caveiraCourseId;
                                              newLessons[lIdx] = nl;
                                              newTopics[idx] = { ...newTopics[idx], lessons: newLessons };
                                              return { ...prev, topics: newTopics };
                                            })}
                                            className="text-[10.5px] font-semibold text-red-500 hover:text-red-600 px-1 cursor-pointer shrink-0"
                                          >
                                            Limpar
                                          </button>
                                        )}
                                      </div>
                                    )}
                                    {/* Inserir aula abaixo deste item */}
                                    <button
                                      type="button"
                                      onClick={() => insertAfter(lIdx)}
                                      className="w-full flex items-center justify-center gap-1 text-[10px] font-medium text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 py-0.5 rounded transition-colors group mt-0.5 cursor-pointer"
                                      title="Inserir aula aqui"
                                    >
                                      <div className="flex-1 h-px bg-slate-200/80 dark:bg-slate-800 group-hover:bg-sky-300 dark:group-hover:bg-sky-800/70 transition-colors" />
                                      <Plus className="w-2.5 h-2.5" />
                                      <span>inserir aqui</span>
                                      <div className="flex-1 h-px bg-slate-200/80 dark:bg-slate-800 group-hover:bg-sky-300 dark:group-hover:bg-sky-800/70 transition-colors" />
                                    </button>
                                  </div>
                                );
                              })}
                              {/* Adicionar aula manual */}
                              <button
                                type="button"
                                onClick={() => setDraftSubject(prev => {
                                  const newTopics = [...prev.topics];
                                  const newLessons = [...(newTopics[idx].lessons || []), { name: 'NOVA AULA', duration: '00:00' }];
                                  newTopics[idx] = { ...newTopics[idx], lessons: newLessons, total: newLessons.length };
                                  return { ...prev, topics: newTopics };
                                })}
                                className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2 py-1 rounded transition-colors mt-1 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" /> Adicionar aula manualmente
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-xs text-slate-500 dark:text-slate-400">Nenhuma aula. Use Scan ou informe a quantidade manual.</p>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Qtd manual:</span>
                                <input
                                  type="number"
                                  value={topic.total || 0}
                                  min={0}
                                  onChange={(e) => setDraftSubject(prev => {
                                    const newTopics = [...prev.topics];
                                    const newTotal = Math.max(0, parseInt(e.target.value) || 0);
                                    newTopics[idx] = {
                                      ...newTopics[idx],
                                      total: newTotal,
                                      completed: Math.min(newTopics[idx].completed || 0, newTotal)
                                    };
                                    return { ...prev, topics: newTopics };
                                  })}
                                  className="w-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-center text-xs font-mono tabular-nums font-semibold text-slate-900 dark:text-white outline-none focus:border-sky-500"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                  {(draftSubject.topics || []).length === 0 && (
                    <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/40">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Nenhum assunto cadastrado. Clique abaixo para adicionar.</p>
                    </div>
                  )}
                </div>

                {/* Botão Adicionar Assunto no Final */}
                <button
                  type="button"
                  onClick={() => {
                    setDraftSubject(prev => {
                      const newTopics = [...(prev.topics || [])];
                      newTopics.push({ id: 't' + Date.now(), name: 'NOVO ASSUNTO', total: 0, completed: 0, lessons: [] });
                      return { ...prev, topics: newTopics };
                    });
                    setTimeout(() => {
                      if (modalBodyRef.current) {
                        modalBodyRef.current.scrollTo({ top: modalBodyRef.current.scrollHeight, behavior: 'smooth' });
                      }
                    }, 60);
                  }}
                  className="w-full mt-3.5 h-10 bg-sky-50/70 dark:bg-sky-950/30 hover:bg-sky-100/80 dark:hover:bg-sky-950/50 border border-dashed border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar assunto</span>
                </button>
              </div>
            </div>

            {/* Ações Fixas no Rodapé */}
            <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800/90 bg-slate-50/60 dark:bg-slate-950/40 shrink-0 flex items-center justify-end gap-2.5">
                <button
                type="button"
                onClick={() => {
                  setEditingSubjectId(null);
                  setDraftSubject(null);
                  setExpandedTopicLinkIdx(null);
                  setExpandedLessonLinkKey(null);
                }}
                className="h-10 px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!draftSubject.name || draftSubject.name.trim() === "") {
                    toast.error("Por favor, defina um nome para a disciplina.");
                    return;
                  }
                  const parsedSpd = Number(draftSubject.speed);
                  const clampedSpd = Number.isFinite(parsedSpd) && parsedSpd > 0
                    ? Math.min(4, Math.max(0.5, Math.round(parsedSpd * 100) / 100))
                    : 1;
                  setSubjects(prev => ({ ...prev, [draftSubject.id]: { ...draftSubject, speed: clampedSpd, lessonsPerBlock: Math.max(0, Math.floor(Number(draftSubject.lessonsPerBlock) || 0)) } }));
                  if (draftSubject.timeGoalMinutes !== undefined) {
                    setSubjectTimeGoal(draftSubject.id, draftSubject.timeGoalMinutes || 0);
                  }
                  setEditingSubjectId(null);
                  setDraftSubject(null);
                  toast.success("Disciplina salva com sucesso!");
                }}
                className="h-10 px-5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 text-xs cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Salvar configurações
              </button>
            </div>
          </div>
        </div>
      ), document.body)}

      {/* Modais carregados sob demanda (isolam tesseract.js e demais bundles pesados) */}
      <Suspense fallback={<ModalLoadingOverlay />}>
        {scannerTopicIdx !== null && draftSubject && (
          <TopicLessonScanner
            topicName={(draftSubject.topics || [])[scannerTopicIdx]?.name || 'Assunto'}
            onClose={() => setScannerTopicIdx(null)}
            onConfirm={(newLessons, newTopicName) => {
              setDraftSubject(prev => {
                const newTopics = [...(prev.topics || [])];
                const existing = newTopics[scannerTopicIdx].lessons || [];
                const merged = [...existing, ...newLessons];
                newTopics[scannerTopicIdx] = {
                  ...newTopics[scannerTopicIdx],
                  name: (newTopicName && newTopicName.trim()) ? newTopicName.trim() : newTopics[scannerTopicIdx].name,
                  lessons: merged,
                  total: merged.length
                };
                return { ...prev, topics: newTopics };
              });
              setScannerTopicIdx(null);
              if (newTopicName && newTopicName.trim()) {
                toast.success(`Assunto renomeado para "${newTopicName.trim()}" e ${newLessons.length} aula(s) adicionada(s).`);
              } else {
                toast.success(`${newLessons.length} aula(s) adicionada(s) ao assunto.`);
              }
            }}
          />
        )}

        {showImportOCR && (
          <ImportOCR
            subjects={subjects}
            setSubjects={setSubjects}
            availableColors={availableColors}
            onClose={() => setShowImportOCR(false)}
          />
        )}

        {showResetModal && (
          <SelectiveResetModal
            isOpen={showResetModal}
            onClose={() => {
              setShowResetModal(false);
              setRestoreVersion(v => v + 1);
            }}
          />
        )}

        {shareModalConfig?.isOpen && (
          <ShareSyllabusModal
            subjects={subjects}
            setSubjects={setSubjects}
            initialSubjectId={shareModalConfig.initialSubjectId}
            initialTab={shareModalConfig.tab || 'share'}
            onClose={() => setShareModalConfig(null)}
          />
        )}
      </Suspense>

    </div>
  );
}
