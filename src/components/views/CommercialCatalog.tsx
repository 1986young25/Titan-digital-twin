import { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Layers, 
  Cpu, 
  Radio, 
  Database, 
  Cloud, 
  HeartHandshake, 
  Calculator, 
  CheckCircle2, 
  Download, 
  FileText, 
  DollarSign, 
  ExternalLink,
  Lock,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNotification } from '../../context/NotificationContext';
import { useEntityContext } from '../../context/EntityContext';

export function CommercialCatalog() {
  const { addToast } = useNotification();
  const { activeEntity } = useEntityContext();

  const [selectedTier, setSelectedTier] = useState<'TIER_0' | 'TIER_1' | 'TIER_2' | 'TIER_3'>('TIER_1');
  const [activeCatalogSection, setActiveCatalogSection] = useState<number>(1);
  
  // Professional Services Calculator State
  const [nodesCount, setNodesCount] = useState<number>(2);
  const [includeCanTuning, setIncludeCanTuning] = useState<boolean>(true);
  const [ledgerRecordsM, setLedgerRecordsM] = useState<number>(2);
  const [includeAirGappedDr, setIncludeAirGappedDr] = useState<boolean>(false);
  const [includeTrustConsult, setIncludeTrustConsult] = useState<boolean>(false);
  const [advisoryHours, setAdvisoryHours] = useState<number>(8);
  const [isAnnual, setIsAnnual] = useState<boolean>(true);

  // Compute pricing
  const calculateTotal = () => {
    let baseTierCost = 0;
    let setupFee = 0;

    if (selectedTier === 'TIER_0') {
      baseTierCost = 0; // $0 upfront, 30% gross above $2k
      setupFee = 0;
    } else if (selectedTier === 'TIER_1') {
      // $4,500/mo/node, or $48,000/yr (11% discount), onboarding $7,500
      baseTierCost = isAnnual ? 48000 * nodesCount : 4500 * nodesCount * 12;
      setupFee = 7500 * nodesCount;
    } else if (selectedTier === 'TIER_2') {
      // $195,000/yr cluster (up to 5 master + 20 edge), or $18,500/mo ($222,000/yr)
      baseTierCost = isAnnual ? 195000 : 18500 * 12;
      setupFee = 15000;
    } else if (selectedTier === 'TIER_3') {
      // Defense / SBIR baseline $250,000 firm
      baseTierCost = 250000;
      setupFee = 25000;
    }

    // Add-ons
    const nodeProvisioningCost = nodesCount * 3500;
    const canTuningCost = includeCanTuning ? 15000 : 0;
    const ledgerMigrationCost = ledgerRecordsM * 5000;
    const drCost = includeAirGappedDr ? 25000 : 0;
    const trustConsultCost = includeTrustConsult ? 10000 : 0;
    const advisoryCost = advisoryHours * 500;

    const addOnsTotal = nodeProvisioningCost + canTuningCost + ledgerMigrationCost + drCost + trustConsultCost + advisoryCost;
    const totalContract = baseTierCost + setupFee + addOnsTotal;

    return {
      baseTierCost,
      setupFee,
      addOnsTotal,
      totalContract
    };
  };

  const pricing = calculateTotal();

  const handleExportQuote = () => {
    window.print();
    addToast('COMMERCIAL SOW GENERATED: Ready for printing / PDF export', 'success');
  };

  return (
    <div className="p-6 h-[calc(100vh-4rem)] overflow-y-auto space-y-6 print:p-0 print:h-auto print:overflow-visible">
      
      {/* Statutory Header & Clearances Matrix */}
      <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm print:border-gray-400">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                CAGE: ACTIVE
              </span>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-400 border border-blue-300 dark:border-blue-800">
                SAM.GOV: REGISTERED
              </span>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-400 border border-purple-300 dark:border-purple-800">
                D-U-N-S: 145054895
              </span>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                DARPAConnect / ARI #21270632
              </span>
            </div>
            
            <h1 className="text-2xl font-black font-mono tracking-tight text-gray-900 dark:text-gray-100">
              TITAN GAMES SECURITY L.L.C.
            </h1>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold tracking-widest mt-0.5">
              COMMERCIAL SERVICES CATALOG & DEPLOYMENT TIERS PRICING MATRIX
            </div>
          </div>

          <div className="flex items-center gap-3 print:hidden">
            <button
              onClick={handleExportQuote}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-mono text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              PRINT / EXPORT SOW QUOTE
            </button>
          </div>
        </div>

        {/* Corporate Trust & Operating Arm Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 font-mono text-xs">
          <div className="p-3 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-800/80 rounded-lg">
            <div className="text-[10px] text-gray-500 font-bold uppercase">HOLDING TRUST</div>
            <div className="text-gray-900 dark:text-gray-100 font-bold mt-0.5">The Nicholas Young Master Trust</div>
            <div className="text-gray-500 text-[11px]">EIN: 41-6820289</div>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-800/80 rounded-lg">
            <div className="text-[10px] text-gray-500 font-bold uppercase">OPERATING ARM</div>
            <div className="text-gray-900 dark:text-gray-100 font-bold mt-0.5">Titan Games Security L.L.C.</div>
            <div className="text-gray-500 text-[11px]">EIN: 42-4264313 | LARA ID: 28678008</div>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-800/80 rounded-lg">
            <div className="text-[10px] text-gray-500 font-bold uppercase">PROCUREMENT VEHICLES</div>
            <div className="text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">Direct PO / Corporate ACH</div>
            <div className="text-gray-500 text-[11px]">Google Cloud Marketplace (cloudcommerce)</div>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-800/80 rounded-lg">
            <div className="text-[10px] text-gray-500 font-bold uppercase">PATENT & IP ANCHOR</div>
            <div className="text-gray-900 dark:text-gray-100 font-bold mt-0.5">Formalities Verification</div>
            <div className="text-gray-500 text-[11px]">USPTO App #64/014,873</div>
          </div>
        </div>
      </div>

      {/* Part 2: Deployment Tiers & Pricing Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-500" />
            <h2 className="font-mono text-base font-bold text-gray-900 dark:text-gray-100 tracking-wide uppercase">
              Part 2: Commercial Deployment Tiers Architecture
            </h2>
          </div>
          <span className="text-xs font-mono text-gray-500">
            Sovereign Bare-Metal to Federal Prime
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          
          {/* Tier 0 */}
          <div 
            onClick={() => setSelectedTier('TIER_0')}
            className={`cursor-pointer rounded-xl p-5 border transition-all ${
              selectedTier === 'TIER_0' 
                ? 'bg-purple-50 dark:bg-purple-950/20 border-purple-500 ring-2 ring-purple-500/30' 
                : 'bg-white dark:bg-black/40 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-700 dark:text-purple-400 border border-purple-500/30">
                HUMANITARIAN PIPELINE
              </span>
              <span className="font-mono text-xs text-gray-400">TIER 0</span>
            </div>
            
            <h3 className="font-mono font-bold text-sm text-gray-900 dark:text-gray-100">
              The Second Chance Sovereign Forge
            </h3>
            
            <div className="mt-3 pb-3 border-b border-gray-200 dark:border-gray-800">
              <div className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400">$0.00</div>
              <div className="text-xs text-gray-500 font-mono">Upfront Acquisition Cost</div>
            </div>

            <div className="mt-3 space-y-2 text-xs font-mono text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                <span>30% Gross Revenue Covenant</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                <span>First $2,000/mo 100% Exempt</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                <span>Exactly 60-Month (5-Yr) Term</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                <span>100% Royalty Expiration Post-Term</span>
              </div>
            </div>
          </div>

          {/* Tier 1 */}
          <div 
            onClick={() => setSelectedTier('TIER_1')}
            className={`cursor-pointer rounded-xl p-5 border transition-all ${
              selectedTier === 'TIER_1' 
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 ring-2 ring-emerald-500/30' 
                : 'bg-white dark:bg-black/40 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                COMMERCIAL / INDUSTRIAL
              </span>
              <span className="font-mono text-xs text-gray-400">TIER 1</span>
            </div>
            
            <h3 className="font-mono font-bold text-sm text-gray-900 dark:text-gray-100">
              Sovereign Edge Appliance
            </h3>
            
            <div className="mt-3 pb-3 border-b border-gray-200 dark:border-gray-800">
              <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">$4,500 <span className="text-xs font-normal text-gray-500">/ mo / node</span></div>
              <div className="text-xs text-gray-500 font-mono">Annual Committed: $48,000 / yr</div>
            </div>

            <div className="mt-3 space-y-2 text-xs font-mono text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Native x86/ARM64 Bare-Metal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Shannon Entropy Gate H(X) &lt; 1.5</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>MAVLink/CAN EMA (α=0.2) Filter</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Local SQLite Nanosecond Seals</span>
              </div>
            </div>
          </div>

          {/* Tier 2 */}
          <div 
            onClick={() => setSelectedTier('TIER_2')}
            className={`cursor-pointer rounded-xl p-5 border transition-all ${
              selectedTier === 'TIER_2' 
                ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-500 ring-2 ring-blue-500/30' 
                : 'bg-white dark:bg-black/40 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/30">
                ENTERPRISE MARKETPLACE
              </span>
              <span className="font-mono text-xs text-gray-400">TIER 2</span>
            </div>
            
            <h3 className="font-mono font-bold text-sm text-gray-900 dark:text-gray-100">
              Enterprise Hyperscale Mesh
            </h3>
            
            <div className="mt-3 pb-3 border-b border-gray-200 dark:border-gray-800">
              <div className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400">$195,000 <span className="text-xs font-normal text-gray-500">/ yr</span></div>
              <div className="text-xs text-gray-500 font-mono">5 Master + 20 Edge Satellites</div>
            </div>

            <div className="mt-3 space-y-2 text-xs font-mono text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>Google Cloud Marketplace Draw</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>Vertex AI (Gemini 2.5 Flash) Bridge</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>CDC Persistence UCC-CER-NYMT</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>24/7/365 Sub-Hour Response SLA</span>
              </div>
            </div>
          </div>

          {/* Tier 3 */}
          <div 
            onClick={() => setSelectedTier('TIER_3')}
            className={`cursor-pointer rounded-xl p-5 border transition-all ${
              selectedTier === 'TIER_3' 
                ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-500 ring-2 ring-amber-500/30' 
                : 'bg-white dark:bg-black/40 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                DEFENSE / SBIR PRIME
              </span>
              <span className="font-mono text-xs text-gray-400">TIER 3</span>
            </div>
            
            <h3 className="font-mono font-bold text-sm text-gray-900 dark:text-gray-100">
              Federal Defense & Critical Infra
            </h3>
            
            <div className="mt-3 pb-3 border-b border-gray-200 dark:border-gray-800">
              <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">$150k - $750k+</div>
              <div className="text-xs text-gray-500 font-mono">Fixed-Price / Milestone SOW</div>
            </div>

            <div className="mt-3 space-y-2 text-xs font-mono text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>CAGE / SAM / DARPAConnect #21270632</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Air-Gapped Zero-Cloud Hardware</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Wave Impedance Invariant Z₀=376.5 Ω</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>USPTO App #64/014,873 Letters</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Part 1: Comprehensive Catalog of Services Accordion / Detail View */}
      <div className="bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800 mb-6">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-500" />
            <h2 className="font-mono text-base font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
              Part 1: Comprehensive Catalog of Core Services
            </h2>
          </div>
          <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
            5 Sovereign Engineering Domains
          </span>
        </div>

        {/* Section Selectors */}
        <div className="flex flex-wrap gap-2 mb-6 font-mono text-xs">
          {[
            { id: 1, label: '1. Sovereign Edge & Cyber-Physical Hardening', icon: Lock },
            { id: 2, label: '2. Kinetic Telemetry & Autonomous Conditioning', icon: Radio },
            { id: 3, label: '3. Fiduciary Cryptographic Auditing & UCC Ledgers', icon: Database },
            { id: 4, label: '4. Auxiliary Hyperscale AI & Cloud Commerce', icon: Cloud },
            { id: 5, label: '5. Sovereign Incubator & Reentry Workflows', icon: HeartHandshake }
          ].map(sec => {
            const Icon = sec.icon;
            const active = activeCatalogSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveCatalogSection(sec.id)}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  active 
                    ? 'bg-emerald-600 text-white font-bold shadow-sm' 
                    : 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {sec.label}
              </button>
            );
          })}
        </div>

        {/* Active Domain Content */}
        <div className="p-5 bg-gray-50 dark:bg-black/60 border border-gray-200 dark:border-gray-800 rounded-xl">
          {activeCatalogSection === 1 && (
            <div className="space-y-4">
              <h3 className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                1. Sovereign Edge & Cyber-Physical Hardening (Core Appliance)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                <div className="p-4 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg space-y-2">
                  <div className="font-bold text-gray-900 dark:text-gray-100">Bare-Metal POSIX Runtime</div>
                  <p className="text-gray-600 dark:text-gray-400 text-[11px] leading-relaxed">
                    Hardening physical client server racks, field laptops, and industrial nodes into zero-cloud-rent POSIX enclaves that process compute and state operations independently of hyperscaler uptime.
                  </p>
                </div>

                <div className="p-4 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg space-y-2">
                  <div className="font-bold text-gray-900 dark:text-gray-100">Shannon Entropy Defense Gates</div>
                  <p className="text-gray-600 dark:text-gray-400 text-[11px] leading-relaxed">
                    Integration of mathematical payload sieves (H(X) &lt; 1.5) that intercept and neutralize code-injection, memory buffer exploits, and hostile scripts at line rate via bitwise inversion before CPU parsing.
                  </p>
                </div>

                <div className="p-4 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg space-y-2">
                  <div className="font-bold text-gray-900 dark:text-gray-100">Modulo-9 Plane Separation</div>
                  <p className="text-gray-600 dark:text-gray-400 text-[11px] leading-relaxed">
                    Architectural decoupling of inbound telemetry buses to guarantee that raw data streams can never bridge into control registers or privileged operating system daemon shells.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeCatalogSection === 2 && (
            <div className="space-y-4">
              <h3 className="font-mono font-bold text-sm text-cyan-600 dark:text-cyan-400">
                2. Kinetic Telemetry, Robotics & Autonomous Vehicle Conditioning
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                <div className="p-4 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg space-y-2">
                  <div className="font-bold text-gray-900 dark:text-gray-100">MAVLink & CAN Bus Signal Conditioning</div>
                  <p className="text-gray-600 dark:text-gray-400 text-[11px] leading-relaxed">
                    Real-time physical filtering of vehicle sensors using Exponential Moving Average (α=0.2) smoothing and 10-cycle persistence debounce logic, eliminating mechanical false alarms caused by road shock, ballistic vibration, or acoustic noise.
                  </p>
                </div>

                <div className="p-4 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg space-y-2">
                  <div className="font-bold text-gray-900 dark:text-gray-100">Dynamic Wave-Impedance Tuning</div>
                  <p className="text-gray-600 dark:text-gray-400 text-[11px] leading-relaxed">
                    Synchronizing communication transmission timing with free-space wave impedance invariants (Z₀ = 376.5 Ω) and harmonic metronomic cadences (3.69 Hz) for secure, resonant mesh routing.
                  </p>
                </div>

                <div className="p-4 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg space-y-2">
                  <div className="font-bold text-gray-900 dark:text-gray-100">4D Geospatial Digital Twin Ingress</div>
                  <p className="text-gray-600 dark:text-gray-400 text-[11px] leading-relaxed">
                    High-velocity binding of physical mobile field units (e.g., Pixel 8a, ruggedized field hardware) to central coordinate command anchors with sub-second GIS rasterization and live AI anomaly detection.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeCatalogSection === 3 && (
            <div className="space-y-4">
              <h3 className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                3. Fiduciary Cryptographic Auditing & Title Ledger Engineering
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                <div className="p-4 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg space-y-2">
                  <div className="font-bold text-gray-900 dark:text-gray-100">Nanosecond State-Sealing Integration</div>
                  <p className="text-gray-600 dark:text-gray-400 text-[11px] leading-relaxed">
                    Replacing vulnerable, human-editable application logs with local, line-rate SQLite and plaintext audit ledgers anchored by SHA-256 state roots.
                  </p>
                </div>

                <div className="p-4 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg space-y-2">
                  <div className="font-bold text-gray-900 dark:text-gray-100">UCC Proof-of-Reserve Engines</div>
                  <p className="text-gray-600 dark:text-gray-400 text-[11px] leading-relaxed">
                    Generating automated, tamper-proof state hashes prefixed with UCC-CER-NYMT-XB6-... that deterministically link software runtime performance directly to balance-sheet assets and statutory title filings.
                  </p>
                </div>

                <div className="p-4 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg space-y-2">
                  <div className="font-bold text-gray-900 dark:text-gray-100">CDC Persistence Daemons</div>
                  <p className="text-gray-600 dark:text-gray-400 text-[11px] leading-relaxed">
                    Autonomous background logging daemons (cdc_feedback.py) that track every database delta with nanosecond timestamps, providing indisputable proof of solvency.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeCatalogSection === 4 && (
            <div className="space-y-4">
              <h3 className="font-mono font-bold text-sm text-purple-600 dark:text-purple-400">
                4. Auxiliary Hyperscale AI & Cloud Commerce Dispatch
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                <div className="p-4 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg space-y-2">
                  <div className="font-bold text-gray-900 dark:text-gray-100">Inverted Hyperscale AI Bridging</div>
                  <p className="text-gray-600 dark:text-gray-400 text-[11px] leading-relaxed">
                    Configuring Google Cloud (Vertex AI, Gemini 2.5 Flash/Pro) as an external auxiliary reasoning tool, allowing enterprise customers to perform semantic analysis without ceding root execution authority.
                  </p>
                </div>

                <div className="p-4 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg space-y-2">
                  <div className="font-bold text-gray-900 dark:text-gray-100">Actions API Dispatch</div>
                  <p className="text-gray-600 dark:text-gray-400 text-[11px] leading-relaxed">
                    Automated routing of bare-metal triggers to cloud actions, notifications, and webhooks via actions.googleapis.com while maintaining strict zero-trust boundary seals.
                  </p>
                </div>

                <div className="p-4 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg space-y-2">
                  <div className="font-bold text-gray-900 dark:text-gray-100">Marketplace Procurement</div>
                  <p className="text-gray-600 dark:text-gray-400 text-[11px] leading-relaxed">
                    Assisting corporate clients in routing software acquisition through Google Cloud Marketplace billing to draw down existing corporate cloud spend commitments.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeCatalogSection === 5 && (
            <div className="space-y-4">
              <h3 className="font-mono font-bold text-sm text-amber-600 dark:text-amber-400">
                5. Sovereign Incubator & Reentry Workflows (Humanitarian Pipeline)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                <div className="p-4 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg space-y-2">
                  <div className="font-bold text-gray-900 dark:text-gray-100">The Second Chance Sovereign Forge</div>
                  <p className="text-gray-600 dark:text-gray-400 text-[11px] leading-relaxed">
                    Distribution of functional edge software engines to returning citizens and formerly incarcerated programmers with $0 upfront costs, providing pre-configured POSIX daemon templates and in-memory Shannon threat filters.
                  </p>
                </div>

                <div className="p-4 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg space-y-2">
                  <div className="font-bold text-gray-900 dark:text-gray-100">Income Share & Royalty Agreement (ISRA)</div>
                  <p className="text-gray-600 dark:text-gray-400 text-[11px] leading-relaxed">
                    Automated tracking of commercial covenants via sovereign cryptographic ledgers, ensuring fair, capped 5-year royalty collection above the $2,000/mo living expense floor, with 100% royalty expiration thereafter.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Part 3: Specialized Professional Services Pricing Calculator */}
      <div className="bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800 mb-6">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-purple-500" />
            <h2 className="font-mono text-base font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
              Part 3: Professional Services & Implementation Add-Ons Calculator
            </h2>
          </div>
          <span className="text-xs font-mono text-purple-600 dark:text-purple-400">
            Interactive Cost Model
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono text-xs">
          
          {/* Add-ons Checklist */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Bare-Metal Hardware Nodes */}
            <div className="p-4 bg-gray-50 dark:bg-black/60 border border-gray-200 dark:border-gray-800 rounded-lg flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-900 dark:text-gray-100">Bare-Metal Hardware Node Provisioning & Benchmarking</div>
                <div className="text-[11px] text-gray-500">$3,500 / node + hardware</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-400">{nodesCount} Nodes:</span>
                <input 
                  type="number" 
                  min="1" 
                  max="20" 
                  value={nodesCount} 
                  onChange={(e) => setNodesCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 p-1.5 rounded bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-center text-xs"
                />
              </div>
            </div>

            {/* Custom CAN / MAVLink Signal Tuning */}
            <div className="p-4 bg-gray-50 dark:bg-black/60 border border-gray-200 dark:border-gray-800 rounded-lg flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-900 dark:text-gray-100">Custom Vehicle CAN / MAVLink Physical Signal Tuning</div>
                <div className="text-[11px] text-gray-500">Fixed 2-week sprint | $15,000</div>
              </div>
              <input 
                type="checkbox" 
                checked={includeCanTuning} 
                onChange={(e) => setIncludeCanTuning(e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Fiduciary Ledger Migration */}
            <div className="p-4 bg-gray-50 dark:bg-black/60 border border-gray-200 dark:border-gray-800 rounded-lg flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-900 dark:text-gray-100">Enterprise Fiduciary Ledger Migration (CSV/SQL -&gt; UCC Seals)</div>
                <div className="text-[11px] text-gray-500">$5,000 per 1M Records</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-400">{ledgerRecordsM}M Records:</span>
                <input 
                  type="number" 
                  min="0" 
                  max="50" 
                  value={ledgerRecordsM} 
                  onChange={(e) => setLedgerRecordsM(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-16 p-1.5 rounded bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-center text-xs"
                />
              </div>
            </div>

            {/* Air-gapped DR */}
            <div className="p-4 bg-gray-50 dark:bg-black/60 border border-gray-200 dark:border-gray-800 rounded-lg flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-900 dark:text-gray-100">On-Premises Air-Gapped Disaster Recovery Deployment</div>
                <div className="text-[11px] text-gray-500">Fixed Fee | $25,000</div>
              </div>
              <input 
                type="checkbox" 
                checked={includeAirGappedDr} 
                onChange={(e) => setIncludeAirGappedDr(e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Statutory Trust Consultation */}
            <div className="p-4 bg-gray-50 dark:bg-black/60 border border-gray-200 dark:border-gray-800 rounded-lg flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-900 dark:text-gray-100">Statutory Trust & IP Titling Architectural Consultation</div>
                <div className="text-[11px] text-gray-500">Retainer | $10,000 / engagement</div>
              </div>
              <input 
                type="checkbox" 
                checked={includeTrustConsult} 
                onChange={(e) => setIncludeTrustConsult(e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Nicholas Lee Young Advisory */}
            <div className="p-4 bg-gray-50 dark:bg-black/60 border border-gray-200 dark:border-gray-800 rounded-lg flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-900 dark:text-gray-100">Executive Systems Architecture Advisory (Nicholas Lee Young)</div>
                <div className="text-[11px] text-gray-500">$500 / hour (4 hr min)</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-400">{advisoryHours} Hours:</span>
                <input 
                  type="number" 
                  min="4" 
                  max="100" 
                  step="2" 
                  value={advisoryHours} 
                  onChange={(e) => setAdvisoryHours(Math.max(4, parseInt(e.target.value) || 4))}
                  className="w-16 p-1.5 rounded bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-center text-xs"
                />
              </div>
            </div>
          </div>

          {/* Pricing Summary Card */}
          <div className="bg-gray-50 dark:bg-black/80 border border-gray-200 dark:border-gray-800 rounded-xl p-6 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
                <span className="font-bold text-gray-900 dark:text-gray-100">CONTRACT SUMMARY</span>
                <span className="text-emerald-500 font-bold">{selectedTier}</span>
              </div>

              <div className="mt-4 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Base Tier Commitment:</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">${pricing.baseTierCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Calibration / Setup Fee:</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">${pricing.setupFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Add-On Modules Total:</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">${pricing.addOnsTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
                <div className="text-[10px] text-gray-500 font-bold">ESTIMATED CONTRACT VALUE (SOW)</div>
                <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  ${pricing.totalContract.toLocaleString()}
                </div>
                <div className="text-[10px] text-gray-400 mt-1">
                  Settles via Corporate ACH or Google Cloud Marketplace spend
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
              <button
                onClick={handleExportQuote}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                GENERATE SOW / PROPOSAL
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Part 4: Commercial Terms & Settlement Channels */}
      <div className="bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-800 rounded-xl p-6 font-mono text-xs">
        <div className="pb-3 border-b border-gray-200 dark:border-gray-800 mb-4">
          <h2 className="font-bold text-sm text-gray-900 dark:text-gray-100 uppercase tracking-wide">
            Part 4: Commercial Terms & Settlement Channels
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-black/60 border border-gray-200 dark:border-gray-800 rounded-lg space-y-1.5">
            <div className="font-bold text-emerald-500">Standard Corporate Invoicing</div>
            <p className="text-gray-600 dark:text-gray-400 text-[11px] leading-relaxed">
              Net-30 terms available for verified corporate accounts holding D-U-N-S Paydex scores of 75+ or active commercial credit lines (Mercury IO, Ramp, Stripe Issuing).
            </p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-black/60 border border-gray-200 dark:border-gray-800 rounded-lg space-y-1.5">
            <div className="font-bold text-blue-500">Pre-Committed Cloud Spend</div>
            <p className="text-gray-600 dark:text-gray-400 text-[11px] leading-relaxed">
              Enterprise customers can settle Tier 2 contracts directly through their existing Google Cloud Billing account (cloudcommerceprocurement.googleapis.com), applying platform credits toward licenses.
            </p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-black/60 border border-gray-200 dark:border-gray-800 rounded-lg space-y-1.5">
            <div className="font-bold text-purple-500">Internal Trust Accounting</div>
            <p className="text-gray-600 dark:text-gray-400 text-[11px] leading-relaxed">
              All licensing fees, royalties, and disbursements settle directly into Titan Games Security L.L.C., with net retained earnings transferring to The Nicholas Young Master Trust (EIN 41-6820289).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
