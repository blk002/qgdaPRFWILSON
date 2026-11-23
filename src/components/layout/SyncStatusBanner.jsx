import React, { useEffect, useState } from 'react';
import { WifiOff, CloudOff, RefreshCw } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { isLocalTestUser } from '../../lib/localTestAuth';

export default function SyncStatusBanner() {
  const user = useStore((s) => s.user);
  const cloudSyncError = useStore((s) => s.cloudSyncError);
  const hasUnsyncedChanges = useStore((s) => s.hasUnsyncedChanges);
  const isSavingToCloud = useStore((s) => s.isSavingToCloud);
  const isSyncing = useStore((s) => s.isSyncing);
  const saveToCloud = useStore((s) => s.saveToCloud);
  const loadFromCloud = useStore((s) => s.loadFromCloud);
  const hasCompletedInitialCloudSync = useStore((s) => s.hasCompletedInitialCloudSync);

  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine !== false : true
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      const st = useStore.getState();
      if (st.user && !isLocalTestUser(st.user)) {
        if (st.hasUnsyncedChanges && st.hasCompletedInitialCloudSync) {
          st.saveToCloud?.();
        } else if (!st.hasCompletedInitialCloudSync) {
          st.loadFromCloud?.();
        }
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!user || isLocalTestUser(user)) return null;

  const showOffline = !isOnline;
  const showError = Boolean(cloudSyncError) && !isSyncing;

  // Fica totalmente oculto quando tudo está online e sincronizado
  if (!showOffline && !showError) return null;

  const handleRetry = () => {
    if (!hasCompletedInitialCloudSync) {
      loadFromCloud?.();
    } else {
      saveToCloud?.();
    }
  };

  const busy = isSavingToCloud || isSyncing;

  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-950/25 px-4 py-2.5 text-xs"
    >
      <div className="flex items-center gap-2.5 min-w-0 text-amber-900 dark:text-amber-200">
        {showOffline ? (
          <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        ) : (
          <CloudOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        )}
        <span className="truncate font-medium">
          {showOffline
            ? 'Sem conexão com a internet. Suas alterações estão sendo salvas no dispositivo.'
            : cloudSyncError || (hasUnsyncedChanges ? 'Alterações pendentes de sincronização com a nuvem.' : '')}
        </span>
      </div>

      {!showOffline && (
        <button
          type="button"
          disabled={busy}
          onClick={handleRetry}
          className="h-8 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
          <span>{busy ? 'Sincronizando...' : 'Tentar sincronizar'}</span>
        </button>
      )}
    </div>
  );
}
