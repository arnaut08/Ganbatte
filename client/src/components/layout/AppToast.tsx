import type { ToastAction, ToastValue } from '../../hooks/useToast';

type AppToastProps = {
  toast: ToastValue;
  onAction: (action: ToastAction) => void;
};

function AppToast({ toast, onAction }: AppToastProps) {
  if (!toast) return null;

  const actions = toast.actions || [];

  return (
    <div className="pointer-events-auto fixed bottom-6 right-6 z-50 max-w-sm border-2 border-black bg-white px-4 py-3 text-sm font-bold text-black shadow-[5px_5px_0px_0px_#000]">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-block h-3 w-3 shrink-0 border-2 border-black bg-[#FFDE59]" />
        <div className="space-y-3">
          <span className="block">{toast.message}</span>
          {actions.length > 0 && (
            <div className="flex gap-2">
              {actions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => onAction(action)}
                  className="border-2 border-black bg-[#A3E636] px-3 py-1 font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
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
