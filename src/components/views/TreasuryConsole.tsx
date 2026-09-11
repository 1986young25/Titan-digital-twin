import { useState, useEffect } from 'react';
import { ENTITIES } from '../../data/mockTitanData';
import { LedgerTransaction } from '../../types/titan';
import { ArrowRightLeft, Shield, Banknote, History, Download } from 'lucide-react';
import { motion } from 'motion/react';
import { useEntityContext } from '../../context/EntityContext';
import { useNotification } from '../../context/NotificationContext';

export function TreasuryConsole() {
  const { activeEntityId, activeEntity } = useEntityContext();
  const { addToast } = useNotification();
  const [amount, setAmount] = useState<string>('');
  const [fromEntity, setFromEntity] = useState(activeEntityId);
  const [toEntity, setToEntity] = useState(ENTITIES.find(e => e.id !== activeEntityId)?.id || ENTITIES[1].id);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setFromEntity(activeEntityId);
    if (toEntity === activeEntityId) {
      setToEntity(ENTITIES.find(e => e.id !== activeEntityId)?.id || ENTITIES[1].id);
    }
  }, [activeEntityId]);

  const handleTransfer = () => {
    if (!amount || isNaN(Number(amount))) return;
    setIsProcessing(true);
    
    setTimeout(() => {
      const newTx: LedgerTransaction = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        fromEntityId: fromEntity,
        toEntityId: toEntity,
        amount: Number(amount),
        currency: 'USD',
        signature: `Ed25519:${crypto.randomUUID().split('-')[0]}...`,
        type: 'CREDIT'
      };
      
      const destinationEntityName = ENTITIES.find(e => e.id === toEntity)?.name || 'Unknown Entity';
      
      setTransactions([newTx, ...transactions]);
      setIsProcessing(false);
      setAmount('');
      
      addToast(`ROUTING SECURED: $${Number(amount).toLocaleString()} TO ${destinationEntityName}`, 'success');
    }, 600);
  };

  return (
    <div className="p-6 grid grid-cols-1 xl:grid-cols-3 print:block print:p-0 gap-6">
      
      {/* Left Column: Controls & Banking Status */}
      <div className="xl:col-span-1 space-y-6 print:mb-6">
        {/* Banking API Telemetry */}
        <div className="bg-white dark:bg-black/40 print:bg-white border border-gray-200 dark:border-gray-800/50 print:border-gray-300 p-6 rounded-xl transition-colors duration-200 shadow-sm dark:shadow-none print:shadow-none print:break-inside-avoid">
          <div className="flex items-center gap-2 mb-6 border-b border-gray-200 dark:border-gray-800/50 print:border-gray-300 pb-4 justify-between transition-colors duration-200">
            <div className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-blue-600 dark:text-blue-400 print:text-blue-700" />
              <h2 className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200 print:text-black tracking-widest">EXTERNAL BANKING API</h2>
            </div>
            <div className="text-[10px] text-gray-500 font-mono bg-gray-100 dark:bg-gray-900/50 print:bg-transparent px-2 py-1 rounded transition-colors duration-200">
              CONTEXT: <span className="text-emerald-600 dark:text-emerald-400 print:text-black">{activeEntity.ein}</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-[#0a0a0a] print:bg-white rounded border border-gray-200 dark:border-gray-800/50 print:border-gray-300 transition-colors duration-200">
              <div>
                <div className="text-[10px] text-gray-500 font-mono mb-1 print:text-gray-600">MERCURY CHECKING (••2247)</div>
                <div className="font-mono text-lg text-gray-900 dark:text-gray-200 print:text-black">$16.14</div>
              </div>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-500 bg-emerald-100 dark:bg-emerald-900/20 print:bg-transparent px-2 py-1 rounded font-mono border border-emerald-200 dark:border-emerald-800/50 print:border-emerald-600 transition-colors duration-200">SYNCED</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-[#0a0a0a] print:bg-white rounded border border-gray-200 dark:border-gray-800/50 print:border-gray-300 transition-colors duration-200">
              <div>
                <div className="text-[10px] text-gray-500 font-mono mb-1 print:text-gray-600">CUSTOMER INVOICES (5)</div>
                <div className="font-mono text-lg text-emerald-600 dark:text-emerald-400 print:text-black">$25,000.00</div>
              </div>
              <span className="text-[10px] text-blue-700 dark:text-blue-500 bg-blue-100 dark:bg-blue-900/20 print:bg-transparent px-2 py-1 rounded font-mono border border-blue-200 dark:border-blue-800/50 print:border-blue-600 transition-colors duration-200">PENDING SETTLEMENT</span>
            </div>
          </div>
        </div>

        {/* Transfer Console - Hide during print as it's an interactive form */}
        <div className="bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-800/50 p-6 rounded-xl transition-colors duration-200 shadow-sm dark:shadow-none print:hidden">
          <div className="flex items-center gap-2 mb-6 border-b border-gray-200 dark:border-gray-800/50 pb-4 transition-colors duration-200">
            <ArrowRightLeft className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h2 className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200 tracking-widest">CAPITAL ROUTING</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] text-gray-500 font-mono mb-1">SOURCE ENTITY (DEBIT)</label>
              <select 
                value={fromEntity} onChange={e => setFromEntity(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-300 font-mono text-sm rounded p-2 focus:border-emerald-500 outline-none transition-colors duration-200"
              >
                {ENTITIES.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-[10px] text-gray-500 font-mono mb-1">DESTINATION ENTITY (CREDIT)</label>
              <select 
                value={toEntity} onChange={e => setToEntity(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-300 font-mono text-sm rounded p-2 focus:border-emerald-500 outline-none transition-colors duration-200"
              >
                {ENTITIES.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-gray-500 font-mono mb-1">AMOUNT (USD)</label>
              <input 
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-700 text-emerald-600 dark:text-emerald-400 font-mono text-lg rounded p-2 focus:border-emerald-500 outline-none placeholder-gray-400 dark:placeholder-gray-700 transition-colors duration-200"
              />
            </div>

            <button 
              onClick={handleTransfer}
              disabled={isProcessing || !amount || fromEntity === toEntity}
              className="w-full mt-4 bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 dark:hover:bg-emerald-800/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/50 font-mono text-sm py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? 'SIGNING TRANSACTION...' : 'EXECUTE ROUTING & SEAL'}
              {!isProcessing && <Shield className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Ledger View */}
      <div className="xl:col-span-2 bg-white dark:bg-black/40 print:bg-white border border-gray-200 dark:border-gray-800/50 print:border-gray-300 rounded-xl flex flex-col h-[calc(100vh-8rem)] print:h-auto transition-colors duration-200 shadow-sm dark:shadow-none print:shadow-none">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800/50 print:border-gray-300 flex items-center justify-between bg-gray-50 dark:bg-[#0a0a0a] print:bg-transparent transition-colors duration-200">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-gray-500 dark:text-gray-400 print:text-black" />
            <h2 className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200 print:text-black tracking-widest">DOUBLE-ENTRY JOURNAL (Ed25519 SEALED)</h2>
          </div>
          <button 
            onClick={() => window.print()}
            className="print:hidden flex items-center gap-2 px-3 py-1.5 text-xs font-mono bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            DOWNLOAD REPORT
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto print:overflow-visible p-4 space-y-3">
          {transactions.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-600 print:text-gray-500 font-mono text-sm">
              NO RECENT TRANSACTIONS IN LOCAL VIEW
            </div>
          ) : (
            transactions.map((tx) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                key={tx.id} 
                className="bg-gray-50 dark:bg-[#0a0a0a] print:bg-white border border-gray-200 dark:border-gray-800/50 print:border-gray-300 p-4 rounded-lg font-mono text-sm transition-colors duration-200 print:break-inside-avoid"
              >
                <div className="flex justify-between items-start mb-3 border-b border-gray-200 dark:border-gray-800/50 print:border-gray-300 pb-2 transition-colors duration-200">
                  <span className="text-gray-500 text-xs print:text-gray-600">{tx.timestamp}</span>
                  <span className="text-emerald-600 dark:text-emerald-500 print:text-emerald-700 text-xs flex items-center gap-1">
                    <Shield className="w-3 h-3" /> {tx.signature}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] text-red-600 dark:text-red-400 print:text-gray-600 mb-1">DEBIT FROM</div>
                    <div className="text-gray-800 dark:text-gray-300 print:text-black font-bold">{ENTITIES.find(e => e.id === tx.fromEntityId)?.name}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 print:text-gray-600 mb-1">CREDIT TO</div>
                    <div className="text-gray-800 dark:text-gray-300 print:text-black font-bold">{ENTITIES.find(e => e.id === tx.toEntityId)?.name}</div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-800/50 print:border-gray-300 flex justify-between items-center transition-colors duration-200">
                  <span className="text-gray-500 text-xs print:text-gray-600">AMOUNT TRANSFER</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-200 print:text-black">
                    ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {tx.currency}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
      
    </div>
  );
}
