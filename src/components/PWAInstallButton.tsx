import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Smartphone, Download, Share, PlusSquare, X, CheckCircle, Sparkles } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isMobile, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [dismissBanner, setDismissBanner] = useState(false);

  // If already running in standalone PWA mode, don't show prompt
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      {/* Header Install Button */}
      <button
        onClick={handleInstallClick}
        className="px-2.5 py-1.5 rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 animate-pulse"
        title="Descargar e instalar aplicación en tu celular o computadora"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Descargar App</span>
      </button>

      {/* Floating Bottom Mobile Install Banner (visible on mobile browsers if not installed) */}
      {!dismissBanner && (
        <div className="fixed bottom-3 left-3 right-3 z-40 sm:hidden animate-in slide-in-from-bottom-3 duration-300">
          <div className="bg-[#1b212a] text-white border-2 border-blue-500/80 rounded-2xl p-3.5 shadow-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold leading-tight">
                  Descargar para Celular
                </h4>
                <p className="text-[11px] text-slate-300">
                  Instala la app para llamadas WebRTC a pantalla completa
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleInstallClick}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
              >
                Instalar
              </button>
              <button
                onClick={() => setDismissBanner(true)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
                title="Cerrar aviso"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Installation Instruction Modal (for iOS or fallback instructions) */}
      {showGuide && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm bg-white dark:bg-[#1b212a] border border-[#e2e6ec] dark:border-[#2c3440] rounded-2xl p-6 shadow-2xl text-[#1c2430] dark:text-[#e7ebf0]">
            
            <button
              onClick={() => setShowGuide(false)}
              className="absolute top-4 right-4 text-[#6b7686] hover:text-[#1c2430] dark:hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base">
                  Descargar en tu Celular
                </h3>
                <p className="text-xs text-[#6b7686] dark:text-[#98a3b3]">
                  Instalación directa como aplicación nativa
                </p>
              </div>
            </div>

            {isIOS ? (
              // iOS Safari Instructions
              <div className="space-y-3.5 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-[#12161c] rounded-xl border border-[#e2e6ec] dark:border-[#2c3440] space-y-2">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      En Safari de tu iPhone, presiona el botón <strong>Compartir</strong> <Share className="w-3.5 h-3.5 inline mx-1 text-blue-500" /> en la barra inferior.
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Desplázate hacia abajo y toca <strong>"Agregar a pantalla de inicio"</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-blue-500" />.
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      Toca <strong>"Agregar"</strong> en la esquina superior derecha. ¡Listo! Tendrás el icono en tu pantalla de inicio.
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              // Android / Chrome / Edge Instructions
              <div className="space-y-3.5 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-[#12161c] rounded-xl border border-[#e2e6ec] dark:border-[#2c3440] space-y-2">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      En Chrome o el navegador de tu celular, toca los <strong>3 puntos ⋮</strong> del menú superior.
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Selecciona <strong>"Instalar aplicación"</strong> o <strong>"Agregar a la pantalla principal"</strong>.
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      Confirma la descarga. La app se abrirá en pantalla completa sin barra de navegación.
                    </span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowGuide(false)}
              className="mt-4 w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
