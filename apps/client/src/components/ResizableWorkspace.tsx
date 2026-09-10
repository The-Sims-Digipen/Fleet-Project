import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

export function ResizableWorkspace({ children }: { children: ReactNode }) {
  const container = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointerId: number; offset: number } | null>(null);
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 900px)").matches);
  const [width, setWidth] = useState(420);
  const [height, setHeight] = useState(42);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 900px)");
    const update = () => { drag.current = null; setMobile(query.matches); };
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  function resize(value: number) {
    if (mobile) setHeight(Math.min(70, Math.max(25, value)));
    else setWidth(Math.min((container.current?.clientWidth || 1000) * 0.6, Math.max(280, value)));
  }

  return <div ref={container} className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_6px_clamp(280px,var(--sidebar-width),60%)] grid-rows-[minmax(0,1fr)] overflow-hidden max-[900px]:grid-cols-1 max-[900px]:grid-rows-[minmax(0,1fr)_10px_var(--sidebar-height)]" style={{ "--sidebar-width": `${width}px`, "--sidebar-height": `${height}%` } as CSSProperties}>
    {children}
    <div className="group relative col-start-2 row-start-1 cursor-col-resize touch-none border-x border-line bg-panel select-none focus-visible:outline-none max-[900px]:col-start-1 max-[900px]:row-start-2 max-[900px]:cursor-row-resize max-[900px]:border-x-0 max-[900px]:border-y" role="separator" tabIndex={0} aria-label="Resize sidebar" aria-controls="controls"
      aria-orientation={mobile ? "horizontal" : "vertical"} aria-valuemin={mobile ? 25 : 0} aria-valuemax={mobile ? 70 : 100}
      aria-valuenow={mobile ? height : Math.round(width / (container.current?.clientWidth || 1000) * 100)}
      aria-valuetext={mobile ? `${Math.round(height)}% sidebar height` : `${Math.round(width)} pixel sidebar width`}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        const rect = event.currentTarget.getBoundingClientRect();
        drag.current = { pointerId: event.pointerId, offset: mobile ? event.clientY - rect.bottom : event.clientX - rect.right };
        event.currentTarget.setPointerCapture(event.pointerId);
        event.preventDefault();
        event.currentTarget.focus();
      }}
      onPointerMove={(event) => {
        if (drag.current?.pointerId !== event.pointerId || !container.current) return;
        const rect = container.current.getBoundingClientRect();
        resize(mobile ? (rect.bottom - event.clientY + drag.current.offset) / rect.height * 100 : rect.right - event.clientX + drag.current.offset);
      }}
      onPointerUp={(event) => { drag.current = null; event.currentTarget.releasePointerCapture(event.pointerId); }}
      onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}
      onKeyDown={(event) => {
        const increase = mobile ? "ArrowUp" : "ArrowLeft";
        const decrease = mobile ? "ArrowDown" : "ArrowRight";
        if (![increase, decrease, "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        resize(event.key === "Home" ? (mobile ? 25 : 280) : event.key === "End" ? (mobile ? 70 : Infinity) : (mobile ? height : width) + (event.key === increase ? 1 : -1) * (mobile ? 2 : 20));
      }}
    ><span className="pointer-events-none absolute top-1/2 left-1/2 h-9 w-[2px] -translate-x-1/2 -translate-y-1/2 rounded-[2px] bg-line-strong group-hover:bg-accent group-focus-visible:bg-accent max-[900px]:h-[2px] max-[900px]:w-9" aria-hidden="true" /></div>
  </div>;
}
