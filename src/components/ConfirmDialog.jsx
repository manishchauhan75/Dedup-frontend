import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

// Small reusable modal for destructive/consequential actions. Plain
// Tailwind + fixed overlay, no new dependency.
//
// reasonRequired (optional): renders a required textarea and calls
// onConfirm(reasonText) instead of onConfirm() — used by Dismiss with
// Reason. Existing callers that don't pass it are unaffected; onConfirm()
// still takes no argument for them.
const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
  loading,
  reasonRequired = false,
  reasonLabel = 'Reason',
  reasonPlaceholder = '',
}) => {
  const [reasonText, setReasonText] = useState('');

  // Reset the draft reason each time the dialog is (re)opened, so a
  // previous group's typed reason never leaks into the next one.
  useEffect(() => {
    if (open) setReasonText('');
  }, [open]);

  if (!open) return null;

  const reasonTrimmed = reasonText.trim();
  const confirmDisabled = loading || (reasonRequired && !reasonTrimmed);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-red-500/10 p-2 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <p className="text-gray-400 text-sm mb-4">{message}</p>

        {reasonRequired && (
          <div className="mb-6">
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">{reasonLabel}</label>
            <textarea
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder={reasonPlaceholder}
              rows={3}
              disabled={loading}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => (reasonRequired ? onConfirm(reasonTrimmed) : onConfirm())}
            disabled={confirmDisabled}
            className="bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {loading ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
