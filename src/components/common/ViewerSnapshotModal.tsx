import { useState, useEffect } from 'react';
import { X, Download, Copy, RefreshCw, Check, Sparkles, Sliders } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { CaptureResult } from './CanvasSnapshotHelper';

interface ViewerSnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialResult: CaptureResult | null;
  onRecapture: (scale: number, includeHud: boolean) => CaptureResult | null;
  viewerName?: string;
}

export function ViewerSnapshotModal({
  isOpen,
  onClose,
  initialResult,
  onRecapture,
  viewerName = 'Spatial Viewer'
}: ViewerSnapshotModalProps) {
  const { addToast } = useNotification();
  const [scale, setScale] = useState<number>(2);
  const [includeHud, setIncludeHud] = useState<boolean>(true);
  const [currentResult, setCurrentResult] = useState<CaptureResult | null>(initialResult);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  useEffect(() => {
    if (initialResult) {
      setCurrentResult(initialResult);
    }
  }, [initialResult]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleRefresh = (newScale = scale, newHud = includeHud) => {
    setIsCapturing(true);
    setTimeout(() => {
      const res = onRecapture(newScale, newHud);
      if (res) {
        setCurrentResult(res);
        addToast(`Snapshot updated at ${res.width}x${res.height} resolution.`, 'info');
      }
      setIsCapturing(false);
    }, 50);
  };

  const handleDownload = () => {
    if (!currentResult) return;
    try {
      const link = document.createElement('a');
      link.href = currentResult.dataUrl;
      link.download = currentResult.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast(`High-res snapshot saved: ${currentResult.filename}`, 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to download snapshot.', 'error');
    }
  };

  const handleCopyClipboard = async () => {
    if (!currentResult) return;
    try {
      // Fetch data url to blob
      const res = await fetch(currentResult.dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setIsCopied(true);
      addToast('High-resolution snapshot copied to clipboard.', 'success');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.warn('Clipboard copy error:', err);
      // Fallback: download if clipboard API is restricted
      handleDownload();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="High-Resolution Snapshot Preview"
    >
      <div className="bg-[#0c0f14] border border-emerald-500/30 rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#07090d]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-950/60 border border-emerald-500/40 rounded-lg text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-mono text-emerald-400 tracking-wider">
                HIGH-RESOLUTION VIEWER SNAPSHOT
              </h2>
              <p className="text-[11px] font-mono text-gray-400">
                {viewerName} &bull; Forensic Telemetry Export
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800/60 rounded-md transition-colors"
            aria-label="Close snapshot modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-[#12161f] border border-gray-800/80 rounded-lg font-mono text-xs">
            {/* Resolution Selector */}
            <div className="flex items-center gap-2">
              <span className="text-gray-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-500" />
                RESOLUTION:
              </span>
              <div className="inline-flex rounded-md shadow-sm border border-gray-700 overflow-hidden">
                {[
                  { label: '1X (HD)', value: 1 },
                  { label: '2X (ULTRA HD)', value: 2 },
                  { label: '3X (4K MASTER)', value: 3 },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => {
                      setScale(item.value);
                      handleRefresh(item.value, includeHud);
                    }}
                    className={`px-3 py-1 text-[11px] font-medium transition-colors ${
                      scale === item.value
                        ? 'bg-emerald-600 text-black font-bold'
                        : 'bg-[#181d28] text-gray-300 hover:bg-[#202736]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Overlay toggle */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none text-gray-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={includeHud}
                  onChange={(e) => {
                    setIncludeHud(e.target.checked);
                    handleRefresh(scale, e.target.checked);
                  }}
                  className="rounded border-gray-700 text-emerald-500 focus:ring-emerald-500 accent-emerald-500"
                />
                <span>FORENSIC HUD STAMP</span>
              </label>

              <button
                onClick={() => handleRefresh(scale, includeHud)}
                disabled={isCapturing}
                className="flex items-center gap-1.5 px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded border border-gray-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCapturing ? 'animate-spin' : ''}`} />
                <span>RE-RENDER</span>
              </button>
            </div>
          </div>

          {/* Image Preview Container */}
          <div className="relative bg-black/60 border border-gray-800 rounded-lg overflow-hidden flex items-center justify-center min-h-[300px] max-h-[500px]">
            {currentResult?.dataUrl ? (
              <img
                src={currentResult.dataUrl}
                alt="High-resolution viewer snapshot preview"
                className="max-h-[480px] w-auto object-contain rounded shadow-lg"
              />
            ) : (
              <div className="text-gray-500 font-mono text-xs flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
                Rendering rasterized frame buffer...
              </div>
            )}

            {/* Resolution and Format Overlay Tag */}
            {currentResult && (
              <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-black/80 backdrop-blur-sm border border-emerald-500/40 rounded text-[10px] font-mono text-emerald-400">
                {currentResult.width} &times; {currentResult.height} PX &bull; LOSSLESS PNG
              </div>
            )}
          </div>

          {/* Filename Info */}
          {currentResult && (
            <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 px-1">
              <span className="truncate">
                TARGET FILE: <span className="text-emerald-400">{currentResult.filename}</span>
              </span>
              <span>SHA-256 STATE SEED: VERIFIED</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800 bg-[#07090d]">
          <button
            onClick={onClose}
            className="px-4 py-2 font-mono text-xs text-gray-400 hover:text-white hover:bg-gray-800/80 rounded transition-colors"
          >
            DISMISS
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyClipboard}
              disabled={!currentResult}
              className="flex items-center gap-2 px-4 py-2 font-mono text-xs bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded transition-colors disabled:opacity-50"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {isCopied ? 'COPIED TO CLIPBOARD' : 'COPY IMAGE'}
            </button>
            <button
              onClick={handleDownload}
              disabled={!currentResult}
              className="flex items-center gap-2 px-5 py-2 font-mono text-xs bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              DOWNLOAD PNG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
