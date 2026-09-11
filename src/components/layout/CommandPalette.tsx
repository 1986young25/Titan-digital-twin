import { useState, useEffect, useRef } from 'react';
import { Search, Building, LayoutDashboard, Wallet, Activity, Box, Network, ChevronRight } from 'lucide-react';
import { useEntityContext } from '../../context/EntityContext';
import { ENTITIES } from '../../data/mockTitanData';
import { motion, AnimatePresence } from 'motion/react';

interface CommandPaletteProps {
  onViewChange: (view: string) => void;
}

const VIEWS = [
  { id: 'HUD', label: 'Conglomerate HUD', icon: LayoutDashboard },
  { id: 'TREASURY', label: 'Internal Treasury', icon: Wallet },
  { id: 'ACOUSTIC', label: 'Acoustic Simulator', icon: Activity },
  { id: 'TWIN', label: 'Digital Twin', icon: Box },
  { id: 'NOC', label: 'Swarm & NOC', icon: Network },
];

export function CommandPalette({ onViewChange }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { setActiveEntityId } = useEntityContext();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
    }
  }, [isOpen]);

  const filteredViews = VIEWS.filter(v => v.label.toLowerCase().includes(query.toLowerCase()));
  const filteredEntities = ENTITIES.filter(e => e.name.toLowerCase().includes(query.toLowerCase()) || e.ein.includes(query));

  const handleSelectView = (id: string) => {
    onViewChange(id);
    setIsOpen(false);
  };

  const handleSelectEntity = (id: string) => {
    setActiveEntityId(id);
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-sm transition-colors duration-200"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-2xl bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800/80 shadow-2xl rounded-xl overflow-hidden flex flex-col mx-4 transition-colors duration-200"
          >
            <div className="flex items-center px-4 py-4 border-b border-gray-200 dark:border-gray-800/80 transition-colors duration-200">
              <Search className="w-5 h-5 text-emerald-600 dark:text-emerald-500 mr-3" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 font-mono text-sm outline-none transition-colors duration-200"
                placeholder="Type a command or search entities... (Esc to close)"
              />
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-hide">
              {filteredViews.length > 0 && (
                <div className="mb-4">
                  <div className="px-3 py-2 text-[10px] font-mono text-gray-500 tracking-widest">SYSTEM VIEWS</div>
                  {filteredViews.map((view) => {
                    const Icon = view.icon;
                    return (
                      <button
                        key={view.id}
                        onClick={() => handleSelectView(view.id)}
                        className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900/50 text-left transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-gray-50 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800/50 flex items-center justify-center group-hover:border-emerald-300 dark:group-hover:border-emerald-800/50 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/20 transition-colors">
                            <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
                          </div>
                          <span className="font-mono text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">{view.label}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 dark:text-gray-600 font-mono opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          JUMP TO VIEW <ChevronRight className="w-3 h-3" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {filteredEntities.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-[10px] font-mono text-gray-500 tracking-widest">CONGLOMERATE ENTITIES</div>
                  {filteredEntities.map((entity) => (
                    <button
                      key={entity.id}
                      onClick={() => handleSelectEntity(entity.id)}
                      className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900/50 text-left transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gray-50 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800/50 flex items-center justify-center group-hover:border-purple-300 dark:group-hover:border-purple-800/50 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/20 transition-colors">
                          <Building className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-mono text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">{entity.name}</span>
                          <span className="font-mono text-[10px] text-gray-500 dark:text-gray-600 group-hover:text-purple-600 dark:group-hover:text-purple-400/80 transition-colors">EIN: {entity.ein}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400 dark:text-gray-600 font-mono opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        SWITCH CONTEXT <ChevronRight className="w-3 h-3" />
                      </span>
                    </button>
                  ))}
                </div>
              )}
              
              {filteredViews.length === 0 && filteredEntities.length === 0 && (
                <div className="p-8 text-center text-gray-500 font-mono text-sm">
                  NO DIRECTIVES FOUND FOR "{query}"
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
