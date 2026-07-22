import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Copy, ImageDown, X } from 'lucide-react';
import clsx from 'clsx';
import type { EnginePermissions } from '../../../lib/engine/evaluator';
import type { GraphScene } from '../../../lib/graphScene';
import type { GraphFeatures } from '../../../lib/graphDerived';
import {
  downloadCanvas,
  readProfileClasse,
  renderSceneToCanvas,
  type ExportBackground,
} from '../../../lib/graphExport';
import { useToast } from '../../ui/Toast';

interface Props {
  open: boolean;
  onClose: () => void;
  scene: GraphScene;
  permissions: EnginePermissions;
  vars: Record<string, number>;
  features: GraphFeatures;
  /** Dimensioni correnti del piano a schermo (base 1×). */
  plotW: number;
  plotH: number;
  userName: string;
}

/** Dialog di esportazione PNG/JPEG con anteprima live. */
export function ExportDialog({
  open,
  onClose,
  scene,
  permissions,
  vars,
  features,
  plotW,
  plotH,
  userName,
}: Props) {
  const { toast } = useToast();
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [scale, setScale] = useState<1 | 2 | 3>(2);
  const [background, setBackground] = useState<ExportBackground>('light');
  const [withHeader, setWithHeader] = useState(true);
  const [withLegend, setWithLegend] = useState(true);
  const [busy, setBusy] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const classe = readProfileClasse();
  const effBackground = format === 'jpeg' && background === 'transparent' ? 'light' : background;

  // Chiusura con Esc.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Anteprima live (ridisegnata a bassa risoluzione ad ogni cambio opzione).
  useEffect(() => {
    if (!open || !previewRef.current) return;
    const host = previewRef.current;
    try {
      const canvas = renderSceneToCanvas(scene, permissions, vars, features, plotW, plotH, {
        format,
        scale: 1,
        background: effBackground,
        header: withHeader ? { name: userName, classe } : null,
        legend: withLegend,
      });
      canvas.style.width = '100%';
      canvas.style.height = 'auto';
      canvas.style.display = 'block';
      host.replaceChildren(canvas);
    } catch {
      host.replaceChildren();
    }
  }, [open, scene, permissions, vars, features, plotW, plotH, format, effBackground, withHeader, withLegend, userName, classe]);

  if (!open) return null;

  /** Copia negli appunti (sempre PNG): incolli dritto in Word/Docs. */
  const doCopy = async () => {
    setBusy(true);
    try {
      const canvas = renderSceneToCanvas(scene, permissions, vars, features, plotW, plotH, {
        format: 'png',
        scale,
        background: effBackground,
        header: withHeader ? { name: userName, classe } : null,
        legend: withLegend,
      });
      const blob = new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('blob'))), 'image/png')
      );
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      toast('success', 'Immagine copiata negli appunti');
      onClose();
    } catch {
      toast('error', 'Copia non riuscita: il browser non lo permette, usa Scarica');
    } finally {
      setBusy(false);
    }
  };

  const doExport = async () => {
    setBusy(true);
    try {
      const canvas = renderSceneToCanvas(scene, permissions, vars, features, plotW, plotH, {
        format,
        scale,
        background: effBackground,
        header: withHeader ? { name: userName, classe } : null,
        legend: withLegend,
      });
      await downloadCanvas(canvas, format);
      toast('success', 'Immagine scaricata');
      onClose();
    } catch {
      toast('error', 'Esportazione non riuscita');
    } finally {
      setBusy(false);
    }
  };

  const seg = <T extends string | number>(
    value: T,
    options: { v: T; label: string; disabled?: boolean }[],
    onPick: (v: T) => void,
    ariaLabel: string
  ) => (
    <div className="seg" role="radiogroup" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={String(o.v)}
          type="button"
          disabled={o.disabled}
          className={clsx('seg-btn', value === o.v && 'active')}
          onClick={() => onPick(o.v)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );

  return createPortal(
    <div className="gdlg-overlay" onClick={onClose} role="presentation">
      <motion.div
        className="gdlg"
        role="dialog"
        aria-modal="true"
        aria-label="Esporta il grafico come immagine"
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.16 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="gdlg-head">
          <span className="gdlg-title">
            <ImageDown size={16} aria-hidden="true" /> Esporta immagine
          </span>
          <button type="button" className="fn-icon" onClick={onClose} aria-label="Chiudi">
            <X size={15} />
          </button>
        </div>

        <div className="gdlg-preview" ref={previewRef} />

        <div className="gdlg-grid">
          <div className="gdlg-row">
            <span className="fn-detail-label">Formato</span>
            {seg(format, [{ v: 'png', label: 'PNG' }, { v: 'jpeg', label: 'JPEG' }], setFormat, 'Formato')}
          </div>
          <div className="gdlg-row">
            <span className="fn-detail-label">Dimensione</span>
            {seg(
              scale,
              [1, 2, 3].map((s) => ({ v: s as 1 | 2 | 3, label: `${s}× (${plotW * s}px)` })),
              setScale,
              'Dimensione'
            )}
          </div>
          <div className="gdlg-row">
            <span className="fn-detail-label">Sfondo</span>
            {seg(
              effBackground,
              [
                { v: 'light' as const, label: 'Chiaro' },
                { v: 'dark' as const, label: 'Scuro' },
                { v: 'transparent' as const, label: 'Trasparente', disabled: format === 'jpeg' },
              ],
              setBackground,
              'Sfondo'
            )}
          </div>
          <div className="gdlg-row">
            <label className="fn-check">
              <input type="checkbox" checked={withHeader} onChange={(e) => setWithHeader(e.target.checked)} />
              Intestazione: {[userName, classe, new Date().toLocaleDateString('it-IT')].filter(Boolean).join(' · ')}
            </label>
          </div>
          <div className="gdlg-row">
            <label className="fn-check">
              <input type="checkbox" checked={withLegend} onChange={(e) => setWithLegend(e.target.checked)} />
              Legenda delle funzioni
            </label>
          </div>
        </div>

        <div className="gdlg-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Annulla
          </button>
          <span style={{ flex: 1 }} />
          <button
            type="button"
            className="btn btn-secondary btn-inline"
            disabled={busy}
            onClick={doCopy}
            title="Copia il PNG negli appunti"
          >
            <Copy size={15} /> Copia
          </button>
          <button type="button" className="btn btn-inline" disabled={busy} onClick={doExport}>
            <ImageDown size={15} /> Scarica {format.toUpperCase()}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
