import React from 'react';
import { StoreItem, PresenceInfo } from '../types';
import { Store, PhoneCall, Clock, AlertTriangle, Radio } from 'lucide-react';

interface KPICardsProps {
  stores: StoreItem[];
  presence: PresenceInfo;
}

export const KPICards: React.FC<KPICardsProps> = ({ stores, presence }) => {
  const total = stores.length;
  const doneCount = stores.filter((s) => s.done).length;
  const pendingCount = total - doneCount;
  const obsCount = stores.filter((s) => s.obs && s.obs.trim().length > 0).length;
  const onlineCount = Object.keys(presence.branchesOnline || {}).length;
  const percentage = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="space-y-3 mb-5">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Total Stores */}
        <div className="bg-white dark:bg-[#1b212a] border border-[#e2e6ec] dark:border-[#2c3440] rounded-xl p-3.5 shadow-xs transition-all hover:border-blue-400">
          <div className="flex items-center justify-between text-[#6b7686] dark:text-[#98a3b3] mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Locales Total</span>
            <Store className="w-4 h-4 text-blue-500" />
          </div>
          <b className="text-2xl font-bold tracking-tight text-[#1c2430] dark:text-[#e7ebf0]">
            {total}
          </b>
          <span className="block text-xs text-[#6b7686] dark:text-[#98a3b3] mt-0.5">
            Cadena de sucursales
          </span>
        </div>

        {/* Realizadas */}
        <div className="bg-white dark:bg-[#1b212a] border border-[#e2e6ec] dark:border-[#2c3440] rounded-xl p-3.5 shadow-xs transition-all hover:border-emerald-400">
          <div className="flex items-center justify-between text-[#6b7686] dark:text-[#98a3b3] mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Llamadas OK</span>
            <PhoneCall className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <b className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {doneCount}
          </b>
          <span className="block text-xs text-[#6b7686] dark:text-[#98a3b3] mt-0.5">
            Realizadas con éxito
          </span>
        </div>

        {/* Pendientes */}
        <div className="bg-white dark:bg-[#1b212a] border border-[#e2e6ec] dark:border-[#2c3440] rounded-xl p-3.5 shadow-xs transition-all hover:border-amber-400">
          <div className="flex items-center justify-between text-[#6b7686] dark:text-[#98a3b3] mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Pendientes</span>
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <b className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
            {pendingCount}
          </b>
          <span className="block text-xs text-[#6b7686] dark:text-[#98a3b3] mt-0.5">
            Por contactar hoy
          </span>
        </div>

        {/* Observaciones */}
        <div className="bg-white dark:bg-[#1b212a] border border-[#e2e6ec] dark:border-[#2c3440] rounded-xl p-3.5 shadow-xs transition-all hover:border-purple-400">
          <div className="flex items-center justify-between text-[#6b7686] dark:text-[#98a3b3] mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Novedades</span>
            <AlertTriangle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <b className="text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400">
            {obsCount}
          </b>
          <span className="block text-xs text-[#6b7686] dark:text-[#98a3b3] mt-0.5">
            Con observaciones
          </span>
        </div>

        {/* En Línea WebRTC */}
        <div className="col-span-2 md:col-span-1 bg-white dark:bg-[#1b212a] border border-[#e2e6ec] dark:border-[#2c3440] rounded-xl p-3.5 shadow-xs transition-all hover:border-sky-400">
          <div className="flex items-center justify-between text-[#6b7686] dark:text-[#98a3b3] mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">WebRTC Online</span>
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${onlineCount > 0 ? 'bg-emerald-400' : 'bg-slate-300'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${onlineCount > 0 ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
            </span>
          </div>
          <b className="text-2xl font-bold tracking-tight text-sky-600 dark:text-sky-400">
            {onlineCount}
          </b>
          <span className="block text-xs text-[#6b7686] dark:text-[#98a3b3] mt-0.5">
            {onlineCount === 1 ? '1 sucursal lista' : `${onlineCount} sucursales listas`}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-[#1b212a] border border-[#e2e6ec] dark:border-[#2c3440] rounded-xl p-3 shadow-xs">
        <div className="flex items-center justify-between text-xs font-semibold text-[#1c2430] dark:text-[#e7ebf0]">
          <span className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-blue-600" />
            Avance de control: <span className="font-bold text-emerald-600 dark:text-emerald-400">{percentage}%</span>
          </span>
          <span className="text-[#6b7686] dark:text-[#98a3b3]">
            {doneCount} de {total} locales supervisados
          </span>
        </div>
        <div className="h-2.5 w-full bg-[#e2e6ec] dark:bg-[#2c3440] rounded-full overflow-hidden mt-2">
          <div
            className="h-full bg-linear-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};
