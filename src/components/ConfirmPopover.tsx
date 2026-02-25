import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./ConfirmPopover.css";

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
};

type ConfirmContextValue = {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within <ConfirmProvider />");
  return ctx.confirm;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const resolverRef = useRef<((v: boolean) => void) | null>(null);

  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<ConfirmOptions>({
    title: "Are you sure?",
    message: "",
    confirmText: "Continue",
    cancelText: "Cancel",
    danger: false,
  });

  const close = useCallback((result: boolean) => {
    setOpen(false);
    const r = resolverRef.current;
    resolverRef.current = null;
    if (r) r(result);
  }, []);

  const confirm = useCallback((next: ConfirmOptions) => {
    setOpts({
      title: next.title ?? "Are you sure?",
      message: next.message,
      confirmText: next.confirmText ?? "Continue",
      cancelText: next.cancelText ?? "Cancel",
      danger: Boolean(next.danger),
    });
    setOpen(true);

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}

      {open &&
        createPortal(
          <div
            className="confirm-overlay"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              // click outside => treat as cancel
              if (e.target === e.currentTarget) close(false);
            }}
          >
            <div className="confirm-card" onMouseDown={(e) => e.stopPropagation()}>
              {opts.title && <div className="confirm-title">{opts.title}</div>}
              <div className="confirm-message">{opts.message}</div>

              <div className="confirm-actions">
                <button type="button" className="confirm-btn cancel" onClick={() => close(false)}>
                  {opts.cancelText}
                </button>
                <button
                  type="button"
                  className={`confirm-btn ok ${opts.danger ? "is-danger" : ""}`}
                  onClick={() => close(true)}
                >
                  {opts.confirmText}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </ConfirmContext.Provider>
  );
}