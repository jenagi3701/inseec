import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { uid } from '../store/state';
import { Modal } from './ui';
import { useToast } from './Toast';

const REASONS = ['Comportement irrespectueux', 'Harcèlement ou drague insistante', 'Contenu inapproprié', 'Faux profil ou arnaque', 'Problème de sécurité pendant une activité', 'Autre'];

export function ReportDialog({ open, onClose, targetType, targetId, targetLabel, allowBlock = false }: {
  open: boolean;
  onClose: () => void;
  targetType: 'user' | 'message' | 'activity';
  targetId: string;
  targetLabel: string;
  allowBlock?: boolean;
}) {
  const { dispatch } = useApp();
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [block, setBlock] = useState(false);
  const [error, setError] = useState('');

  const submit = () => {
    if (!reason) {
      setError('Choisis un motif pour que l’équipe puisse traiter ton signalement.');
      return;
    }
    dispatch({ type: 'report', report: { id: uid('r'), targetType, targetId, reason, details, at: new Date().toISOString() } });
    if (block && targetType === 'user') dispatch({ type: 'block', userId: targetId });
    toast('Signalement envoyé. Merci de prendre soin de la communauté.');
    setReason('');
    setDetails('');
    setBlock(false);
    setError('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={`Signaler ${targetLabel}`}>
      <p className="mb-4 text-sm text-ink-2">Ton signalement est confidentiel : la personne concernée ne saura pas qui l’a envoyé.</p>
      <fieldset className="space-y-2">
        <legend className="label">Motif</legend>
        {REASONS.map((r) => (
          <label key={r} className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-white px-3 py-2.5 text-sm has-[:checked]:border-ink">
            <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => { setReason(r); setError(''); }} className="accent-shu" />
            {r}
          </label>
        ))}
      </fieldset>
      {error && <p className="mt-2 text-sm text-shu-dark" role="alert">{error}</p>}
      <label className="label mt-4" htmlFor="report-details">Détails (facultatif)</label>
      <textarea id="report-details" className="input min-h-24" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Que s’est-il passé ?" maxLength={1000} />
      {allowBlock && targetType === 'user' && (
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={block} onChange={(e) => setBlock(e.target.checked)} className="accent-shu" />
          Bloquer aussi ce membre
        </label>
      )}
      <p className="mt-4 rounded-xl bg-shu-soft p-3 text-xs text-shu-dark">En cas de danger immédiat, appelle le 17 (police) ou le 112.</p>
      <div className="mt-5 flex justify-end gap-2">
        <button className="btn-ghost" onClick={onClose}>Annuler</button>
        <button className="btn-primary" onClick={submit}>Envoyer le signalement</button>
      </div>
      <p className="mt-3 text-xs text-ink-3">Démo : le signalement est enregistré localement, aucune équipe de modération ne le reçoit.</p>
    </Modal>
  );
}
