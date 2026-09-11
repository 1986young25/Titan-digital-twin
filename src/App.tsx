import { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { CommandPalette } from './components/layout/CommandPalette';
import { ToastContainer } from './components/layout/ToastContainer';
import { ConglomerateHUD } from './components/views/ConglomerateHUD';
import { TreasuryConsole } from './components/views/TreasuryConsole';
import { AcousticSimulator } from './components/views/AcousticSimulator';
import { DigitalTwinViewer } from './components/views/DigitalTwinViewer';
import { NocDashboard } from './components/views/NocDashboard';
import { EntityProvider } from './context/EntityContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('HUD');

  const renderView = () => {
    switch (currentView) {
      case 'HUD':
        return <ConglomerateHUD />;
      case 'TREASURY':
        return <TreasuryConsole />;
      case 'ACOUSTIC':
        return <AcousticSimulator />;
      case 'TWIN':
        return <DigitalTwinViewer />;
      case 'NOC':
        return <NocDashboard />;
      default:
        return <ConglomerateHUD />;
    }
  };

  return (
    <ThemeProvider>
      <NotificationProvider>
        <EntityProvider>
          <div className="flex h-screen print:h-auto print:min-h-0 bg-gray-50 dark:bg-[#050505] print:bg-white text-gray-900 dark:text-gray-200 print:text-black overflow-hidden print:overflow-visible selection:bg-emerald-200 dark:selection:bg-emerald-900/50 transition-colors duration-200">
            <div className="print:hidden h-full">
              <Sidebar currentView={currentView} onViewChange={setCurrentView} />
            </div>
            
            <main className="flex-1 flex flex-col h-screen print:h-auto print:min-h-0 relative print:overflow-visible">
              <div className="print:hidden">
                <TopBar />
              </div>
              
              <div className="flex-1 overflow-hidden print:overflow-visible print:h-auto">
                {renderView()}
              </div>
            </main>

            <div className="print:hidden">
              <CommandPalette onViewChange={setCurrentView} />
              <ToastContainer />
            </div>
          </div>
        </EntityProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}
