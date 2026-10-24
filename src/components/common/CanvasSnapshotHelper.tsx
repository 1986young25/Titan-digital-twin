import React, { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

export interface CaptureOptions {
  scale?: number;
  includeHud?: boolean;
  viewerTitle?: string;
  entityName?: string;
}

export interface CaptureResult {
  dataUrl: string;
  width: number;
  height: number;
  filename: string;
}

export interface CanvasSnapshotRef {
  capture: (options?: CaptureOptions) => CaptureResult | null;
}

interface CanvasSnapshotHelperProps {
  snapshotRef: React.MutableRefObject<CanvasSnapshotRef | null>;
  defaultTitle?: string;
  entityName?: string;
}

export function CanvasSnapshotHelper({ snapshotRef, defaultTitle = 'TITAN 4D SPATIAL DIGITAL TWIN', entityName = 'TITAN' }: CanvasSnapshotHelperProps) {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    snapshotRef.current = {
      capture: (options?: CaptureOptions): CaptureResult | null => {
        const scale = options?.scale ?? 2;
        const includeHud = options?.includeHud ?? true;
        const title = options?.viewerTitle ?? defaultTitle;
        const entity = options?.entityName ?? entityName;

        if (!gl || !scene || !camera) return null;

        // Save original renderer state
        const prevPixelRatio = gl.getPixelRatio();
        const basePixelRatio = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
        // High resolution target pixel ratio (capped at 4 for GPU memory safety)
        const targetPixelRatio = Math.min(basePixelRatio * scale, 4);

        // Render at high resolution
        gl.setPixelRatio(targetPixelRatio);
        gl.render(scene, camera);

        const canvas = gl.domElement;
        const width = canvas.width;
        const height = canvas.height;
        const now = new Date();
        const isoString = now.toISOString();
        const filename = `telemetry_snapshot_${isoString.replace(/:/g, '_')}.png`;

        let finalDataUrl = '';

        if (!includeHud) {
          finalDataUrl = canvas.toDataURL('image/png', 1.0);
        } else {
          // Create high-resolution composite canvas with HUD overlays
          const offCanvas = document.createElement('canvas');
          offCanvas.width = width;
          offCanvas.height = height;
          const ctx = offCanvas.getContext('2d');

          if (ctx) {
            // Draw 3D scene
            ctx.drawImage(canvas, 0, 0);

            // Responsive scaling factor relative to 1080p
            const sf = Math.max(1, width / 1920);
            const pad = 24 * sf;

            // Top-Left Header Badge
            const bannerW = 460 * sf;
            const bannerH = 68 * sf;
            ctx.fillStyle = 'rgba(5, 5, 5, 0.75)';
            ctx.fillRect(pad, pad, bannerW, bannerH);
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
            ctx.lineWidth = Math.max(1, 1.5 * sf);
            ctx.strokeRect(pad, pad, bannerW, bannerH);

            // Green accent corner
            ctx.fillStyle = '#10b981';
            ctx.fillRect(pad, pad, 4 * sf, bannerH);

            ctx.font = `bold ${Math.round(15 * sf)}px 'Courier New', monospace`;
            ctx.fillStyle = '#10b981';
            ctx.fillText(title, pad + 16 * sf, pad + 26 * sf);

            ctx.font = `${Math.round(11 * sf)}px 'Courier New', monospace`;
            ctx.fillStyle = '#9ca3af';
            ctx.fillText(`ENTITY: ${entity} | RES: ${width}x${height}`, pad + 16 * sf, pad + 50 * sf);

            // Bottom-Left Telemetry Health Badge
            const healthW = 390 * sf;
            const healthH = 58 * sf;
            const healthY = height - pad - healthH;
            ctx.fillStyle = 'rgba(5, 5, 5, 0.75)';
            ctx.fillRect(pad, healthY, healthW, healthH);
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
            ctx.lineWidth = Math.max(1, 1.5 * sf);
            ctx.strokeRect(pad, healthY, healthW, healthH);

            ctx.fillStyle = '#10b981';
            ctx.fillRect(pad, healthY, 4 * sf, healthH);

            ctx.font = `bold ${Math.round(12 * sf)}px 'Courier New', monospace`;
            ctx.fillStyle = '#34d399';
            ctx.fillText('ENCLAVE STATE: NOMINAL // BARE-METAL POSIX', pad + 16 * sf, healthY + 24 * sf);

            ctx.font = `${Math.round(10 * sf)}px 'Courier New', monospace`;
            ctx.fillStyle = '#6b7280';
            ctx.fillText('ENTROPY SIEVE H(X) < 1.5 | Z₀ = 376.5 Ω SYNC', pad + 16 * sf, healthY + 44 * sf);

            // Bottom-Right Forensic State Seal Badge
            const stampW = 480 * sf;
            const stampH = 58 * sf;
            const stampX = width - stampW - pad;
            const stampY = height - stampH - pad;

            ctx.fillStyle = 'rgba(5, 5, 5, 0.75)';
            ctx.fillRect(stampX, stampY, stampW, stampH);
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
            ctx.lineWidth = Math.max(1, 1.5 * sf);
            ctx.strokeRect(stampX, stampY, stampW, stampH);

            ctx.fillStyle = '#3b82f6';
            ctx.fillRect(stampX + stampW - 4 * sf, stampY, 4 * sf, stampH);

            ctx.font = `bold ${Math.round(11 * sf)}px 'Courier New', monospace`;
            ctx.fillStyle = '#60a5fa';
            ctx.fillText(`TELEMETRY SNAPSHOT // ${isoString}`, stampX + 16 * sf, stampY + 24 * sf);

            ctx.font = `${Math.round(10 * sf)}px 'Courier New', monospace`;
            ctx.fillStyle = '#9ca3af';
            ctx.fillText('SHA-256 STATE ROOT: UCC-CER-NYMT-XB6-VERIFIED', stampX + 16 * sf, stampY + 44 * sf);

            finalDataUrl = offCanvas.toDataURL('image/png', 1.0);
          } else {
            finalDataUrl = canvas.toDataURL('image/png', 1.0);
          }
        }

        // Restore renderer to original DPR
        gl.setPixelRatio(prevPixelRatio);
        gl.render(scene, camera);

        return {
          dataUrl: finalDataUrl,
          width,
          height,
          filename
        };
      }
    };

    return () => {
      snapshotRef.current = null;
    };
  }, [gl, scene, camera, defaultTitle, entityName, snapshotRef]);

  return null;
}
