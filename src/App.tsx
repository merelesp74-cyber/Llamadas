/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { StoreItem, CallHistoryItem, getDefaultStores } from './types';
import { useWebRTC } from './hooks/useWebRTC';
import { KPICards } from './components/KPICards';
import { StoreTable } from './components/StoreTable';
import { VideoCallModal } from './components/VideoCallModal';
import { IncomingCallBanner } from './components/IncomingCallBanner';
import { ShareRoomModal } from './components/ShareRoomModal';
import { AddStoresDrawer } from './components/AddStoresDrawer';
import { HistorySection } from './components/HistorySection';
import { DeviceTestModal } from './components/DeviceTestModal';
import { BranchModeView } from './components/BranchModeView';
import {
  Video,
  Search,
  Filter,
  Download,
  RotateCcw,
  User,
  Shield,
  Smartphone,
  Sparkles,
  Layers,
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';

const OPERATOR_STORAGE_KEY = 'jefatura_prevencion_op';

export default function App() {
  // Query parameters check for Branch Mode
  const urlParams = useMemo(() => {
    if (typeof window === 'undefined') return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  }, []);

  const [isBranchMode, setIsBranchMode] = useState<boolean>(() => {
    return urlParams.get('mode') === 'branch' || !!urlParams.get('room');
  });

  const [currentBranchStoreId, setCurrentBranchStoreId] = useState<string>(() => {
    return urlParams.get('storeId') || '';
  });

  // Stores and History data with resilient offline/Vercel localStorage fallback
  const [stores, setStores] = useState<StoreItem[]>(() => {
    try {
      const saved = localStorage.getItem('llamadas_locales_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: any, i: number) => ({
            id: item.id || `store-${i + 1}-${(item.name || '').toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            name: item.name || `Local ${i + 1}`,
            done: !!item.done,
            date: item.date || '',
            hora: item.hora || '',
            op: item.op || '',
            obs: item.obs || '',
            foto: item.foto || '',
            callDuration: item.callDuration || 0
          }));
        }
      }
    } catch (e) {
      console.warn('LocalStorage load error:', e);
    }
    return getDefaultStores();
  });

  const [history, setHistory] = useState<CallHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('llamadas_historial_v1');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return [];
  });
  const [loading, setLoading] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'done' | 'pend' | 'obs'>('all');
  const [activeOperator, setActiveOperator] = useState<string>(() => {
    try {
      return localStorage.getItem(OPERATOR_STORAGE_KEY) || 'Inspector Central';
    } catch {
      return 'Inspector Central';
    }
  });

  // UI Modals
  const [shareStore, setShareStore] = useState<StoreItem | null>(null);
  const [showDeviceTest, setShowDeviceTest] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [resetArm, setResetArm] = useState(false);

  // Selected store for ongoing call
  const [callStore, setCallStore] = useState<StoreItem | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }, []);

  // Sync operator name
  const handleOperatorChange = (name: string) => {
    setActiveOperator(name);
    try {
      localStorage.setItem(OPERATOR_STORAGE_KEY, name);
    } catch {}
  };

  // Find active store for branch mode
  const currentBranchStore = useMemo(() => {
    if (currentBranchStoreId) {
      const match = stores.find((s) => s.id === currentBranchStoreId);
      if (match) return match;
    }
    return stores[0] || null;
  }, [stores, currentBranchStoreId]);

  // WebRTC Hook
  const webRTC = useWebRTC({
    role: isBranchMode ? 'branch' : 'operator',
    storeId: isBranchMode && currentBranchStore ? currentBranchStore.id : undefined,
    storeName: isBranchMode && currentBranchStore ? currentBranchStore.name : undefined,
    operatorName: activeOperator,
    onStoresSynced: (syncedStores, syncedHistory) => {
      setStores(syncedStores);
      setHistory(syncedHistory);
      setLoading(false);
    }
  });

  // Initial data load from API
  useEffect(() => {
    fetch('/api/stores')
      .then((res) => res.json())
      .then((data) => {
        if (data.stores) setStores(data.stores);
        if (data.history) setHistory(data.history);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading stores:', err);
        setLoading(false);
      });
  }, []);

  // Update a single store
  const handleUpdateStore = async (updated: StoreItem) => {
    setStores((prev) => {
      const next = prev.map((s) => (s.id === updated.id ? updated : s));
      try {
        localStorage.setItem('llamadas_locales_v1', JSON.stringify(next));
      } catch {}
      return next;
    });

    if (updated.done && updated.date) {
      setHistory((prev) => {
        const exists = prev.some(
          (h) => h.storeName === updated.name && h.date === updated.date && h.hora === updated.hora
        );
        if (!exists) {
          const next = [
            {
              id: `hist-${Date.now()}`,
              storeName: updated.name,
              date: updated.date,
              hora: updated.hora || '',
              op: updated.op || '',
              obs: updated.obs || '',
              foto: updated.foto || '',
              duration: updated.callDuration || 0
            },
            ...prev
          ];
          try {
            localStorage.setItem('llamadas_historial_v1', JSON.stringify(next));
          } catch {}
          return next;
        }
        return prev;
      });
    }

    showToast(`Local "${updated.name}" actualizado`);

    try {
      await fetch('/api/stores/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (e) {
      // Offline or static Vercel host
    }
  };

  // Add bulk stores
  const handleAddStores = async (names: string[], markDone: boolean) => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().slice(0, 5);

    setStores((prev) => {
      const copy = [...prev];
      names.forEach((nameRaw) => {
        const name = nameRaw.trim();
        if (!name) return;
        const existing = copy.find((s) => s.name.toLowerCase() === name.toLowerCase());
        if (existing) {
          if (markDone) {
            existing.done = true;
            existing.date = today;
            existing.hora = now;
            existing.op = activeOperator;
          }
        } else {
          copy.push({
            id: `store-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name,
            done: !!markDone,
            date: markDone ? today : '',
            hora: markDone ? now : '',
            op: markDone ? activeOperator : '',
            obs: '',
            foto: '',
            callDuration: 0
          });
        }
      });
      try {
        localStorage.setItem('llamadas_locales_v1', JSON.stringify(copy));
      } catch {}
      return copy;
    });

    showToast(`${names.length} locales procesados correctamente`);

    try {
      await fetch('/api/stores/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ names, markDone, operator: activeOperator })
      });
    } catch (e) {}
  };

  // Delete store
  const handleDeleteStore = async (id: string) => {
    setStores((prev) => {
      const next = prev.filter((s) => s.id !== id);
      try {
        localStorage.setItem('llamadas_locales_v1', JSON.stringify(next));
      } catch {}
      return next;
    });

    showToast('Local eliminado');

    try {
      await fetch('/api/stores/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
    } catch (e) {}
  };

  // Reset all calls with safety arm
  const handleResetCalls = async () => {
    if (!resetArm) {
      setResetArm(true);
      setTimeout(() => setResetArm(false), 4500);
      return;
    }

    setResetArm(false);

    // Archive done calls into history
    setHistory((prev) => {
      const newlyArchived: CallHistoryItem[] = [];
      stores.forEach((s) => {
        if (s.done && s.date) {
          newlyArchived.push({
            id: `hist-${Date.now()}-${s.id}`,
            storeName: s.name,
            date: s.date,
            hora: s.hora || '',
            op: s.op || '',
            obs: s.obs || '',
            foto: s.foto || '',
            duration: s.callDuration || 0
          });
        }
      });
      const next = [...newlyArchived, ...prev];
      try {
        localStorage.setItem('llamadas_historial_v1', JSON.stringify(next));
      } catch {}
      return next;
    });

    setStores((prev) => {
      const next = prev.map((s) => ({
        ...s,
        done: false,
        date: '',
        hora: '',
        op: '',
        obs: '',
        foto: '',
        callDuration: 0
      }));
      try {
        localStorage.setItem('llamadas_locales_v1', JSON.stringify(next));
      } catch {}
      return next;
    });

    showToast('Llamadas archivadas en historial y restablecidas');

    try {
      await fetch('/api/stores/batch-reset', {
        method: 'POST'
      });
    } catch (e) {}
  };

  // Copy current table to CSV
  const handleCopyCSV = async () => {
    const quote = (s: any) => `"${String(s || '').replace(/"/g, '""')}"`;
    const rows = [
      ['Local', 'Llamada', 'Fecha', 'Horario', 'Operador', 'Observaciones'].join(','),
      ...filteredStores.map((s) =>
        [
          quote(s.name),
          s.done ? 'Realizada' : 'Pendiente',
          s.date || '',
          s.hora || '',
          quote(s.op),
          quote(s.obs)
        ].join(',')
      )
    ];

    try {
      await navigator.clipboard.writeText(rows.join('\n'));
      showToast('¡Tabla copiada al portapapeles en formato CSV!');
    } catch (e) {
      showToast('No se pudo copiar al portapapeles');
    }
  };

  // Start WebRTC Call to a specific store
  const handleStartVideoCall = async (store: StoreItem) => {
    setCallStore(store);
    const branchClient = webRTC.presence.branchesOnline[store.id]?.clientId;
    await webRTC.startCall({ id: store.id, name: store.name }, branchClient);
  };

  // Start self loopback test
  const handleStartLoopbackTest = async () => {
    setCallStore({
      id: 'test-room',
      name: 'Auto-Prueba de Diagnóstico WebRTC',
      done: false,
      date: new Date().toISOString().split('T')[0],
      hora: new Date().toTimeString().slice(0, 5),
      op: activeOperator,
      obs: 'Sesión de prueba de dispositivos'
    });
    await webRTC.startSelfTestCall();
  };

  // Finish call callback from modal
  const handleEndCall = (updatedNotes?: string, capturedPhoto?: string) => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().slice(0, 5);

    if (callStore && callStore.id !== 'test-room') {
      const updated: StoreItem = {
        ...callStore,
        done: true,
        date: callStore.date || today,
        hora: callStore.hora || now,
        op: callStore.op || activeOperator,
        obs: updatedNotes !== undefined ? updatedNotes : callStore.obs,
        foto: capturedPhoto || callStore.foto,
        callDuration: webRTC.callDuration
      };
      handleUpdateStore(updated);
    }

    webRTC.endCall();
    setCallStore(null);
  };

  // Filtered stores
  const filteredStores = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return stores.filter((s) => {
      if (filterType === 'done' && !s.done) return false;
      if (filterType === 'pend' && s.done) return false;
      if (filterType === 'obs' && (!s.obs || !s.obs.trim())) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        (s.obs && s.obs.toLowerCase().includes(q)) ||
        (s.op && s.op.toLowerCase().includes(q))
      );
    });
  }, [stores, searchQuery, filterType]);

  // Branch Mode View renderer
  if (isBranchMode && currentBranchStore) {
    return (
      <>
        <IncomingCallBanner
          incomingCall={webRTC.incomingCall}
          onAccept={webRTC.acceptIncomingCall}
          onReject={webRTC.rejectIncomingCall}
        />
        <VideoCallModal
          isOpen={webRTC.isInCall}
          storeName={currentBranchStore.name}
          storeId={currentBranchStore.id}
          peerName={webRTC.activePeerName || 'Jefatura de Prevención'}
          callStatus={webRTC.callStatus}
          callDuration={webRTC.callDuration}
          localStream={webRTC.localStream}
          remoteStream={webRTC.remoteStream}
          isAudioMuted={webRTC.isAudioMuted}
          isVideoMuted={webRTC.isVideoMuted}
          isScreenSharing={webRTC.isScreenSharing}
          audioLevel={webRTC.audioLevel}
          isTestMode={webRTC.isTestMode}
          chatMessages={webRTC.chatMessages}
          currentOperator={currentBranchStore.name}
          facingMode={webRTC.facingMode}
          onEndCall={() => webRTC.endCall()}
          onToggleAudio={webRTC.toggleAudio}
          onToggleVideo={webRTC.toggleVideo}
          onFlipCamera={webRTC.flipCamera}
          onToggleScreenShare={webRTC.toggleScreenShare}
          onCaptureSnapshot={webRTC.captureSnapshot}
          onSendChatMessage={webRTC.sendChatMessage}
          currentStore={currentBranchStore}
        />
        <BranchModeView
          store={currentBranchStore}
          allStores={stores}
          onSelectStore={(selected) => setCurrentBranchStoreId(selected.id)}
          onExitBranchMode={() => setIsBranchMode(false)}
          webRTC={webRTC}
          onStartCallWithJefatura={() => {
            setCallStore(currentBranchStore);
            webRTC.startCall({ id: currentBranchStore.id, name: currentBranchStore.name });
          }}
        />
      </>
    );
  }

  // Supervisor Dashboard View
  return (
    <div className="min-h-screen bg-[#f5f6f8] dark:bg-[#12161c] text-[#1c2430] dark:text-[#e7ebf0] font-sans transition-colors pb-16">
      
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#1b212a]/90 backdrop-blur-md border-b border-[#e2e6ec] dark:border-[#2c3440] px-4 py-2.5 shadow-2xs">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#1c2430] dark:text-white leading-none">
                  Dashboard de Llamadas a Locales
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  WebRTC P2P
                </span>
              </div>
              <p className="text-xs text-[#6b7686] dark:text-[#98a3b3] mt-0.5">
                Jefatura de Prevención • Monitoreo e Inspección en Tiempo Real
              </p>
            </div>
          </div>

          {/* Quick Operator Switcher & Diagnostic */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#12161c] border border-[#e2e6ec] dark:border-[#2c3440] rounded-lg px-2.5 py-1">
              <User className="w-3.5 h-3.5 text-[#6b7686]" />
              <input
                type="text"
                value={activeOperator}
                onChange={(e) => handleOperatorChange(e.target.value)}
                placeholder="Nombre de Operador"
                className="bg-transparent text-xs font-medium focus:outline-none w-28 sm:w-36 text-[#1c2430] dark:text-[#e7ebf0]"
                title="Nombre del operador para los registros"
              />
            </div>

            <button
              onClick={() => setShowDeviceTest(true)}
              className="px-2.5 py-1.5 rounded-lg border border-[#e2e6ec] dark:border-[#2c3440] hover:bg-slate-100 dark:hover:bg-[#2c3440] text-xs font-medium text-[#1c2430] dark:text-[#e7ebf0] flex items-center gap-1.5 transition-colors"
              title="Comprobar micrófono y cámara"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span className="hidden sm:inline">Diagnóstico</span>
            </button>

            <button
              onClick={() => {
                setIsBranchMode(true);
                if (stores.length > 0 && !currentBranchStoreId) {
                  setCurrentBranchStoreId(stores[0].id);
                }
              }}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-2xs transition-colors"
              title="Abrir vista de sucursal / terminal de tienda"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Modo Sucursal</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-5">
        
        {/* KPI Cards & Progress Bar */}
        <KPICards stores={stores} presence={webRTC.presence} />

        {/* Add Stores Drawer */}
        <AddStoresDrawer onAddStores={handleAddStores} />

        {/* Action & Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-[#6b7686] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar local, operador u observación..."
              className="w-full bg-white dark:bg-[#1b212a] text-[#1c2430] dark:text-[#e7ebf0] border border-[#e2e6ec] dark:border-[#2c3440] rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-white dark:bg-[#1b212a] text-[#1c2430] dark:text-[#e7ebf0] border border-[#e2e6ec] dark:border-[#2c3440] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">Todos los locales</option>
              <option value="done">Llamada realizada</option>
              <option value="pend">Pendientes</option>
              <option value="obs">Con observaciones</option>
            </select>
          </div>

          {/* Copy CSV Button */}
          <button
            onClick={handleCopyCSV}
            className="px-3 py-2 rounded-xl border border-[#e2e6ec] dark:border-[#2c3440] bg-white dark:bg-[#1b212a] hover:bg-slate-50 dark:hover:bg-[#202732] text-xs font-medium text-[#1c2430] dark:text-[#e7ebf0] flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Copiar tabla (CSV)</span>
          </button>

          {/* Self-Test Call Button */}
          <button
            onClick={handleStartLoopbackTest}
            className="px-3 py-2 rounded-xl border border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Prueba tus dispositivos en una videollamada de auto-test sin molestar a las sucursales"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Probar Videollamada</span>
          </button>

          {/* Reset Calls Button */}
          <button
            onClick={handleResetCalls}
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${resetArm ? 'bg-red-600 text-white border-red-600 font-bold animate-pulse' : 'bg-white dark:bg-[#1b212a] border-[#e2e6ec] dark:border-[#2c3440] text-[#6b7686] hover:text-red-600 hover:border-red-300'}`}
          >
            <span className="flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{resetArm ? '¿Confirmar restablecer?' : 'Restablecer llamadas'}</span>
            </span>
          </button>
        </div>

        {/* Store Table */}
        <StoreTable
          stores={filteredStores}
          presence={webRTC.presence}
          onUpdateStore={handleUpdateStore}
          onDeleteStore={handleDeleteStore}
          onStartVideoCall={handleStartVideoCall}
          onOpenShareModal={(s) => setShareStore(s)}
          currentOperator={activeOperator}
        />

        {/* Monthly Call History */}
        <HistorySection history={history} />
      </main>

      {/* WebRTC Video Call Modal */}
      <VideoCallModal
        isOpen={webRTC.isInCall}
        storeName={callStore?.name || webRTC.activeStoreName}
        storeId={callStore?.id || webRTC.activeStoreId}
        peerName={webRTC.activePeerName || 'Sucursal'}
        callStatus={webRTC.callStatus}
        callDuration={webRTC.callDuration}
        localStream={webRTC.localStream}
        remoteStream={webRTC.remoteStream}
        isAudioMuted={webRTC.isAudioMuted}
        isVideoMuted={webRTC.isVideoMuted}
        isScreenSharing={webRTC.isScreenSharing}
        audioLevel={webRTC.audioLevel}
        isTestMode={webRTC.isTestMode}
        chatMessages={webRTC.chatMessages}
        currentOperator={activeOperator}
        facingMode={webRTC.facingMode}
        onEndCall={handleEndCall}
        onToggleAudio={webRTC.toggleAudio}
        onToggleVideo={webRTC.toggleVideo}
        onFlipCamera={webRTC.flipCamera}
        onToggleScreenShare={webRTC.toggleScreenShare}
        onCaptureSnapshot={webRTC.captureSnapshot}
        onSendChatMessage={webRTC.sendChatMessage}
        currentStore={callStore || undefined}
      />

      {/* Incoming Call Ringing Banner */}
      <IncomingCallBanner
        incomingCall={webRTC.incomingCall}
        onAccept={webRTC.acceptIncomingCall}
        onReject={webRTC.rejectIncomingCall}
      />

      {/* Share / QR Code Modal */}
      <ShareRoomModal
        store={shareStore}
        isOpen={!!shareStore}
        onClose={() => setShareStore(null)}
      />

      {/* Device Test Modal */}
      <DeviceTestModal
        isOpen={showDeviceTest}
        onClose={() => setShowDeviceTest(false)}
        onStartLoopbackTest={handleStartLoopbackTest}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1c2430] dark:bg-white text-white dark:text-[#1c2430] px-4 py-2.5 rounded-xl shadow-2xl text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
