import { useEffect, useId, useRef, type ReactNode } from "react";

export type ModalProps = {
  title: string;
  description?: string;
  onDismiss: () => void;
  children: ReactNode;
  /** Width class override, defaults to max-w-md */
  maxWidth?: string;
};

/**
 * Brand-styled modal dialog built on the native `<dialog>` element.
 * Accessible: traps focus, supports Escape to dismiss, labelled by title.
 */
export function Modal({ title, description, onDismiss, children, maxWidth = "max-w-md" }: ModalProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const element = dialog.current!;
    element.showModal();
    return () => {
      if (element.open) element.close();
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onDismiss();
      }}
      onClose={(event) => {
        if (!event.currentTarget.open) onDismiss();
      }}
      className={[
        "fixed inset-0 m-auto w-[calc(100%-2rem)] overflow-y-auto rounded-[10px]",
        "border border-chargedup-night/10 bg-chargedup-white p-6 text-chargedup-night",
        "shadow-[0_20px_25px_-5px_rgba(2,1,67,0.14),0_8px_10px_-6px_rgba(2,1,67,0.08)]",
        "max-h-[calc(100dvh-2rem)] backdrop:bg-chargedup-night/40 backdrop:backdrop-blur-[2px]",
        maxWidth,
      ].join(" ")}
    >
      <div className="grid gap-5">
        <div>
          <h2 id={titleId} className="font-heading text-lg font-bold text-chargedup-night">
            {title}
          </h2>
          {description && (
            <p className="mt-1.5 font-body text-sm leading-relaxed text-chargedup-night/60">
              {description}
            </p>
          )}
        </div>
        {children}
      </div>
    </dialog>
  );
}
