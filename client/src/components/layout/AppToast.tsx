import type { ToastAction, ToastValue } from '../../types';

type AppToastProps = {
  toast: ToastValue;
  onAction: (action: ToastAction) => void;
};

function AppToast({ toast, onAction }: AppToastProps) {
  if (!toast) return null;

  const actions = toast.actions || [];

  return (
    <div className="pointer-events-auto fixed bottom-3 inset-x-3 sm:inset-x-auto sm:right-6 sm:bottom-6 z-50 max-w-sm border-2 border-black bg-white px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-bold text-black shadow-[3px_3px_0px_0px_#000] sm:shadow-[5px_5px_0px_0px_#000] pb-[calc(0.625rem+env(safe-area-inset-bottom))] sm:pb-3">
      <div className="flex items-start gap-2.5 sm:gap-3">
        <span className="mt-0.5 inline-block h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0 border-2 border-black bg-[#FFDE59]" />
        <div className="flex-1 min-w-0 space-y-2 sm:space-y-3">
          <span className="block leading-snug">{toast.message}</span>
          {actions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-0.5">
              {actions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => onAction(action)}
                  className="border-2 border-black bg-[#A3E636] px-2.5 py-0.5 sm:px-3 sm:py-1 font-mono text-[10px] sm:text-xs font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000] sm:shadow-[2px_2px_0px_0px_#000] hover:bg-[#b5eb5b] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AppToast;
