import type { ToastValue } from '../../types';

type AppToastProps = {
  toast: ToastValue | null;
  onAction?: (action: NonNullable<ToastValue>['actions'][number]) => void;
};

export default function AppToast({ toast, onAction }: AppToastProps) {
  if (!toast) return null;

  const isErrorOrWarning = toast.type === 'error' || toast.type === 'warning';
  const isSuccess = toast.type === 'success';

  const bgClass = isErrorOrWarning
    ? 'bg-[#FF6B6B] text-black'
    : isSuccess
      ? 'bg-[#A3E636] text-black'
      : 'bg-[#1f2637] text-white'; // Neutral styling for invites/requests

  const dotClass = isErrorOrWarning || isSuccess ? 'bg-black' : 'bg-[#70CFF8]';

  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-none max-w-md w-full px-4">
      <div className={`pointer-events-auto flex items-center justify-between gap-4 border-2 border-black ${bgClass} px-4 py-3 shadow-[4px_4px_0px_0px_#000]`}>
        <div className="flex items-center gap-2.5 font-mono text-xs sm:text-sm font-black uppercase">
          <span className={`inline-block h-2.5 w-2.5 border border-black ${dotClass}`} />
          <span>{toast.message}</span>
        </div>

        {toast.actions && toast.actions.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            {toast.actions.map((action, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onAction?.(action)}
                className="cursor-pointer border-2 border-black bg-white px-2.5 py-1 font-mono text-[10px] font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[0.5px_0.5px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}