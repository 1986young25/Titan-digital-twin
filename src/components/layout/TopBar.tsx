import { ENTITIES } from '../../data/mockTitanData';
import { ChevronDown, ShieldCheck, Sun, Moon, Printer } from 'lucide-react';
import { useEntityContext } from '../../context/EntityContext';
import { useTheme } from '../../context/ThemeContext';

export function TopBar() {
  const { activeEntityId, setActiveEntityId, activeEntity } = useEntityContext();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800/50 flex items-center justify-between px-6 z-40 sticky top-0 transition-colors duration-200">
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded text-[10px] text-gray-500 font-mono transition-colors duration-200">
          <span className="font-bold text-gray-700 dark:text-gray-300">Ctrl+K</span> to search
        </div>
        <div className="relative group">
          <select
            value={activeEntityId}
            onChange={(e) => setActiveEntityId(e.target.value)}
            className="appearance-none bg-white dark:bg-black/50 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-mono text-sm rounded-lg py-2 pl-4 pr-10 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
          >
            {ENTITIES.map(entity => (
              <option key={entity.id} value={entity.id}>
                {entity.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-emerald-500 transition-colors" />
        </div>
        
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-500 font-mono">EIN / REGISTRATION</span>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold tracking-widest">{activeEntity.ein}</span>
        </div>
        
        <div className="h-8 w-px bg-gray-300 dark:bg-gray-800 mx-2 transition-colors duration-200" />
        
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-500 font-mono">JURISDICTION</span>
          <span className="text-xs text-gray-700 dark:text-gray-300 font-mono uppercase">{activeEntity.jurisdiction}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => window.print()}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors duration-200"
          title="Print Report"
        >
          <Printer className="w-4 h-4" />
        </button>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors duration-200"
          title="Toggle Diagnostic Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <div className="bg-emerald-100/50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors duration-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
          <span className="text-xs text-emerald-700 dark:text-emerald-400 font-mono">Ed25519 ENFORCED</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 flex items-center justify-center transition-colors duration-200">
          <span className="text-xs font-mono font-bold text-gray-600 dark:text-gray-300">NY</span>
        </div>
      </div>
    </header>
  );
}
