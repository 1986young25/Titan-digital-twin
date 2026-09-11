import { ENTITIES } from '../../data/mockTitanData';
import { motion } from 'motion/react';
import { Database, Coins, Building } from 'lucide-react';
import { useEntityContext } from '../../context/EntityContext';

export function ConglomerateHUD() {
  const { activeEntityId } = useEntityContext();
  const totalReserves = ENTITIES.reduce((acc, entity) => acc + entity.ledgerReserves, 0);
  const totalTokens = ENTITIES.reduce((acc, entity) => acc + entity.tokenAllotment, 0);

  return (
    <div className="p-6 space-y-6 print:block print:p-0">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3 print:gap-4 print:mb-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-black/40 print:bg-white border border-gray-200 dark:border-gray-800/50 print:border-gray-300 p-6 rounded-xl relative overflow-hidden transition-colors duration-200 shadow-sm dark:shadow-none print:shadow-none print:break-inside-avoid"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-100 dark:bg-emerald-500/10 rounded-full blur-2xl transition-colors duration-200 print:hidden" />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-500 print:text-black" />
            <h3 className="text-sm font-mono text-gray-500 dark:text-gray-400 print:text-gray-600">UNIFIED TRIAL BALANCE</h3>
          </div>
          <div className="text-3xl font-mono font-bold text-gray-900 dark:text-gray-100 print:text-black relative z-10">
            ${(totalReserves / 1e9).toFixed(2)}B
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-black/40 print:bg-white border border-gray-200 dark:border-gray-800/50 print:border-gray-300 p-6 rounded-xl relative overflow-hidden transition-colors duration-200 shadow-sm dark:shadow-none print:shadow-none print:break-inside-avoid"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-100 dark:bg-blue-500/10 rounded-full blur-2xl transition-colors duration-200 print:hidden" />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <Coins className="w-5 h-5 text-blue-600 dark:text-blue-500 print:text-black" />
            <h3 className="text-sm font-mono text-gray-500 dark:text-gray-400 print:text-gray-600">TOTAL ALLOTTED TOKENS</h3>
          </div>
          <div className="text-3xl font-mono font-bold text-gray-900 dark:text-gray-100 print:text-black relative z-10">
            {(totalTokens / 1e6).toFixed(1)}M
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-black/40 print:bg-white border border-gray-200 dark:border-gray-800/50 print:border-gray-300 p-6 rounded-xl relative overflow-hidden transition-colors duration-200 shadow-sm dark:shadow-none print:shadow-none print:break-inside-avoid"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-100 dark:bg-purple-500/10 rounded-full blur-2xl transition-colors duration-200 print:hidden" />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <Building className="w-5 h-5 text-purple-600 dark:text-purple-500 print:text-black" />
            <h3 className="text-sm font-mono text-gray-500 dark:text-gray-400 print:text-gray-600">ACTIVE SUBSIDIARIES</h3>
          </div>
          <div className="text-3xl font-mono font-bold text-gray-900 dark:text-gray-100 print:text-black relative z-10">
            {ENTITIES.length}
          </div>
        </motion.div>
      </div>

      <div className="bg-white dark:bg-black/40 print:bg-white border border-gray-200 dark:border-gray-800/50 print:border-gray-300 rounded-xl overflow-hidden transition-colors duration-200 shadow-sm dark:shadow-none print:shadow-none">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800/50 print:border-gray-300 bg-gray-50 dark:bg-[#0a0a0a] print:bg-transparent transition-colors duration-200">
          <h2 className="text-sm font-mono font-bold tracking-widest text-gray-700 dark:text-gray-300 print:text-black">CONGLOMERATE SILOS</h2>
        </div>
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-left border-collapse print:table">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800/50 print:border-gray-300 bg-gray-100/50 dark:bg-black/60 print:bg-transparent transition-colors duration-200">
                <th className="p-4 text-xs font-mono text-gray-500 print:text-black font-normal">ENTITY NAME</th>
                <th className="p-4 text-xs font-mono text-gray-500 print:text-black font-normal">EIN / ID</th>
                <th className="p-4 text-xs font-mono text-gray-500 print:text-black font-normal">JURISDICTION</th>
                <th className="p-4 text-xs font-mono text-gray-500 print:text-black font-normal text-right">RESERVES</th>
                <th className="p-4 text-xs font-mono text-gray-500 print:text-black font-normal text-right">TOKENS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800/30 print:divide-gray-300 transition-colors duration-200">
              {ENTITIES.map((entity, i) => (
                <motion.tr 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={entity.id} 
                  className={`transition-colors print:break-inside-avoid ${entity.id === activeEntityId ? 'bg-emerald-50 dark:bg-emerald-900/20 print:bg-transparent border-l-2 border-emerald-500 print:border-l-0 print:font-bold' : 'hover:bg-gray-50 dark:hover:bg-gray-900/30'}`}
                >
                  <td className="p-4 text-sm font-mono text-gray-800 dark:text-gray-200 print:text-black">{entity.name}</td>
                  <td className="p-4 text-xs font-mono text-emerald-600 dark:text-emerald-400/80 print:text-gray-700">{entity.ein}</td>
                  <td className="p-4 text-xs font-mono text-gray-600 dark:text-gray-400 print:text-gray-700">{entity.jurisdiction}</td>
                  <td className="p-4 text-sm font-mono text-gray-700 dark:text-gray-300 print:text-black text-right">
                    ${(entity.ledgerReserves / 1e6).toFixed(2)}M
                  </td>
                  <td className="p-4 text-sm font-mono text-gray-700 dark:text-gray-300 print:text-black text-right">
                    {(entity.tokenAllotment / 1e6).toFixed(2)}M
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
