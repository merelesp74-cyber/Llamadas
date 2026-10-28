import React, { useState } from 'react';
import { Plus, CheckSquare, ChevronDown, ChevronUp } from 'lucide-react';

interface AddStoresDrawerProps {
  onAddStores: (names: string[], markDone: boolean) => void;
}

export const AddStoresDrawer: React.FC<AddStoresDrawerProps> = ({ onAddStores }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');

  const handleAdd = (markDone: boolean) => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    onAddStores(lines, markDone);
    setText('');
    setIsOpen(false);
  };

  return (
    <div className="bg-white dark:bg-[#1b212a] border border-[#e2e6ec] dark:border-[#2c3440] rounded-xl mb-4 overflow-hidden shadow-xs">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left font-semibold text-xs text-[#1c2430] dark:text-[#e7ebf0] hover:bg-slate-50 dark:hover:bg-[#202732] transition-colors"
      >
        <span className="flex items-center gap-2">
          <Plus className="w-4 h-4 text-blue-600" />
          <span>Agregar / Cargar Locales en Lote</span>
        </span>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="p-4 pt-1 border-t border-[#e2e6ec] dark:border-[#2c3440] space-y-3">
          <p className="text-xs text-[#6b7686] dark:text-[#98a3b3]">
            Pega los nombres de los locales o sucursales, uno por línea:
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder={`SUPERMERCADO CENTRO\nSUCURSAL RUTA 2\nEXPRESS LOS LAURELES`}
            className="w-full bg-slate-50 dark:bg-[#12161c] border border-[#e2e6ec] dark:border-[#2c3440] rounded-lg p-2.5 text-xs text-[#1c2430] dark:text-[#e7ebf0] focus:ring-1 focus:ring-blue-500 font-mono"
          />

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleAdd(false)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar locales</span>
            </button>

            <button
              onClick={() => handleAdd(true)}
              className="px-4 py-2 border border-[#e2e6ec] dark:border-[#2c3440] hover:bg-slate-100 dark:hover:bg-[#2c3440] text-xs font-medium text-[#1c2430] dark:text-[#e7ebf0] rounded-lg flex items-center gap-1.5 transition-colors"
              title="Marca como llamados los nombres pegados"
            >
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              <span>Marcar pegados como llamados</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
