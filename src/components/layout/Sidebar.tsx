import { LayoutDashboard, Wallet, Activity, Box, Network, Settings } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const menuItems = [
    { id: 'HUD', label: 'Conglomerate HUD', icon: LayoutDashboard },
    { id: 'TREASURY', label: 'Internal Treasury', icon: Wallet },
    { id: 'ACOUSTIC', label: 'Acoustic Simulator', icon: Activity },
    { id: 'TWIN', label: 'Digital Twin', icon: Box },
    { id: 'NOC', label: 'Swarm & NOC', icon: Network },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-[#0a0a0a] border-r border-gray-200 dark:border-gray-800/50 flex flex-col h-screen transition-colors duration-200">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800/50 transition-colors duration-200">
        <h1 className="text-xl font-black tracking-widest text-emerald-600 dark:text-emerald-500 font-mono flex items-center gap-2">
          <Settings className="w-6 h-6 animate-spin-slow" />
          TITAN OS
        </h1>
        <div className="text-[10px] text-gray-500 font-mono mt-1 tracking-widest">
          MASTER COMMAND CENTER
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-mono text-sm transition-all duration-200 ${
                isActive 
                  ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/30 hover:text-gray-900 dark:hover:text-gray-200 border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-800/50 transition-colors duration-200">
        <div className="bg-gray-50 dark:bg-black/40 p-3 rounded border border-gray-200 dark:border-gray-800/50 transition-colors duration-200">
          <div className="text-[10px] text-gray-500 font-mono mb-1">SYSTEM STATUS</div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 font-mono text-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            SECURE & SEALED
          </div>
        </div>
      </div>
    </aside>
  );
}
