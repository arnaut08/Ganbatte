import { useState } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../../config/supabase';

type UpdatePasswordPageProps = {
  onSuccess: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'neutral') => void;
};

export default function UpdatePasswordPage({ onSuccess, showToast }: UpdatePasswordPageProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpdate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      setMessage('Access cipher must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setMessage('');

    if (!supabase) {
      setLoading(false);
      setMessage('Authentication service not connected.');
      showToast('Authentication service not connected.', 'error');
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);
    if (error) {
      setMessage(error.message);
      showToast(error.message, 'error');
    } else {
      showToast('Password updated successfully! Welcome back.', 'success');
      window.history.replaceState(null, '', window.location.pathname);
      onSuccess();
    }
  };

  return (
    <main className="flex min-h-[calc(100dvh-80px)] items-center justify-center p-3 pb-20 sm:p-6 sm:pb-28">
      {/* Physical Passport / ID Card Shell */}
      <div className="relative w-full max-w-2xl border-3 border-black bg-[#F8F7F4] p-5 shadow-[6px_6px_0px_0px_#000] sm:p-8 sm:shadow-[10px_10px_0px_0px_#000] overflow-hidden">

        {/* Background Kanji Watermark */}
        <div className="pointer-events-none absolute -bottom-6 -left-4 select-none font-mono text-7xl sm:text-9xl font-black text-black/[0.04]">
          頑張って
        </div>

        {/* Top ID Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black pb-4">
          <div className="flex items-center gap-2">
            <span className="border-2 border-black bg-[#FFDE59] px-2 py-0.5 font-mono text-[9px] sm:text-[10px] font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000]">
              RECOVERY ID
            </span>
            <h1 className="font-mono text-lg sm:text-2xl font-black uppercase tracking-tight text-black">
              SECURE CREDENTIAL UPDATE
            </h1>
          </div>

          <div className="font-mono text-[9px] sm:text-[10px] font-bold text-neutral-600 text-left sm:text-right">
            <div>ID: <span className="text-black font-black">頑張って-RECOVERY-2026</span></div>
            <div>STATUS: <span className="text-[#DC2626] font-black uppercase">PENDING_UPDATE</span></div>
          </div>
        </div>

        {/* Main ID Body */}
        <div className="mt-5 grid gap-5 sm:grid-cols-12 sm:gap-6">
          {/* Left Badge */}
          <div className="flex flex-col items-center sm:col-span-4">
            <div className="relative flex h-36 w-32 sm:h-44 sm:w-full flex-col items-center justify-between border-2 border-black bg-[#E7E5E0] p-3 shadow-[3px_3px_0px_0px_#000]">
              <div className="flex w-full items-center justify-between border-b border-black/20 pb-1 font-mono text-[8px] font-black text-neutral-600 uppercase">
                <span>CHIP://SEC</span>
                <span className="h-2 w-2 rounded-full border border-black bg-[#FF6B6B] animate-pulse" />
              </div>

              <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center border-2 border-black bg-[#FF6B6B] font-mono text-3xl sm:text-4xl font-black text-black shadow-[2px_2px_0px_0px_#000]">
                !
              </div>

              <span className="border border-black bg-black px-2 py-0.5 font-mono text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-white">
                RESET_MODE
              </span>
            </div>
            <span className="mt-2 font-mono text-[9px] sm:text-[10px] font-bold tracking-widest text-neutral-500 uppercase text-center">
              PROTOCOL 02
            </span>
          </div>

          {/* Right Form */}
          <div className="sm:col-span-8 space-y-4">
            <div className="border-2 border-black bg-[#E7E5E0] p-2 font-mono text-xs font-bold text-black uppercase">
              // Enter your new secure cipher below to re-enter the system.
            </div>

            <form onSubmit={handleUpdate} className="space-y-3">
              <div className="space-y-1">
                <label
                  htmlFor="new-password"
                  className="font-mono text-[10px] font-black uppercase tracking-wider text-black sm:text-[11px]"
                >
                  NEW ACCESS CIPHER
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters..."
                  minLength={6}
                  required
                  className="h-10 w-full border-2 border-dashed border-black bg-white px-3 font-mono text-xs font-bold text-black shadow-[2px_2px_0px_0px_#000] placeholder:font-mono placeholder:text-neutral-400 focus:border-solid focus:border-black focus:outline-none sm:text-sm"
                />
              </div>

              {message && (
                <div role="alert" className="border-2 border-black bg-[#FFF1F2] p-2.5 shadow-[2px_2px_0px_0px_#000]">
                  <span className="border border-black bg-[#FF6B6B] px-1.5 py-0.2 font-mono text-[9px] font-black uppercase text-black">
                    ✖ NOTICE
                  </span>
                  <p className="mt-1 font-mono text-[11px] font-black leading-relaxed text-[#991b1b]">
                    {message}
                  </p>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full cursor-pointer border-2 border-black bg-[#FFDE59] py-3 font-mono text-xs font-black uppercase tracking-wider text-black shadow-[3px_3px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[#f6d246] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-80"
                >
                  {loading ? 'UPDATING CREDENTIALS...' : 'UPDATE PASSWORD & ACCESS →'}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </main>
  );
}