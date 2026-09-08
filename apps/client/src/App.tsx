import { lazy, Suspense, useState, type CSSProperties } from "react";

const LazyWorldScene = lazy(() =>
  import("./components/WorldScene").then((module) => ({ default: module.WorldScene })),
);

type Tool = "select" | "move" | "rotate";
type Material = "matte" | "glossy" | "metal";

const defaults = {
  tool: "select" as Tool,
  size: 8,
  rotation: 0,
  light: 65,
  color: "#55d6be",
  material: "matte" as Material,
  wireframe: false,
};

export default function App() {
  const [tool, setTool] = useState(defaults.tool);
  const [size, setSize] = useState(defaults.size);
  const [rotation, setRotation] = useState(defaults.rotation);
  const [light, setLight] = useState(defaults.light);
  const [color, setColor] = useState(defaults.color);
  const [material, setMaterial] = useState<Material>(defaults.material);
  const [wireframe, setWireframe] = useState(defaults.wireframe);
  const [sceneKey, setSceneKey] = useState(0);
  const [status, setStatus] = useState("Ready");

  function resetControls() {
    setTool(defaults.tool);
    setSize(defaults.size);
    setRotation(defaults.rotation);
    setLight(defaults.light);
    setColor(defaults.color);
    setMaterial(defaults.material);
    setWireframe(defaults.wireframe);
    setSceneKey((value) => value + 1);
    setStatus("Controls reset");
  }

  return (
    <main className="app-shell">
      <a className="skip-link" href="#controls">Skip to controls</a>

      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="m4 8 8-4 8 4-8 4-8-4Z" />
              <path d="m4 12 8 4 8-4M4 16l8 4 8-4" />
            </svg>
          </span>
          <div>
            <p>Starter</p>
            <h1>3D Playground</h1>
          </div>
        </div>

        <span className="status-badge"><i aria-hidden="true" />Local scene</span>
      </header>

      <div className="workspace">
        <section className="scene-panel" aria-labelledby="scene-title">
          <Suspense fallback={<div className="scene-fallback">Loading 3D world…</div>}>
            <LazyWorldScene
              key={sceneKey}
              size={size}
              rotation={rotation}
              light={light}
              color={color}
              material={material}
              wireframe={wireframe}
            />
          </Suspense>

          <div className="scene-heading">
            <span>3D viewport</span>
            <h2 id="scene-title">Plane</h2>
          </div>

          <div className="scene-hint" aria-hidden="true">Drag to orbit · Scroll to zoom</div>
        </section>

        <aside className="control-panel" id="controls" aria-labelledby="controls-title">
          <div className="control-intro">
            <span className="eyebrow">Example UI</span>
            <h2 id="controls-title">Controls</h2>
            <p>A few basic controls for testing layout, state, and the 3D scene.</p>
          </div>

          <section className="control-section" aria-labelledby="tools-title">
            <div className="section-heading">
              <h3 id="tools-title">Tool</h3>
              <small>Button group</small>
            </div>
            <div className="segmented-control" aria-label="Active tool">
              {(["select", "move", "rotate"] as Tool[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={tool === item ? "is-active" : undefined}
                  aria-pressed={tool === item}
                  onClick={() => setTool(item)}
                >
                  {item[0].toUpperCase() + item.slice(1)}
                </button>
              ))}
            </div>
          </section>

          <section className="control-section" aria-labelledby="values-title">
            <div className="section-heading">
              <h3 id="values-title">Values</h3>
              <small>Range inputs</small>
            </div>
            <div className="range-stack">
              <RangeControl id="size" label="Plane size" value={size} min={2} max={14} unit="m" onChange={setSize} />
              <RangeControl id="rotation" label="Rotation" value={rotation} min={0} max={360} unit="°" onChange={setRotation} />
              <RangeControl id="light" label="Light intensity" value={light} min={10} max={100} unit="%" onChange={setLight} />
            </div>
          </section>

          <section className="control-section field-grid" aria-labelledby="options-title">
            <div className="section-heading full-row">
              <h3 id="options-title">Options</h3>
              <small>Form fields</small>
            </div>

            <label className="field">
              <span>Material</span>
              <select value={material} onChange={(event) => setMaterial(event.target.value as Material)}>
                <option value="matte">Matte</option>
                <option value="glossy">Glossy</option>
                <option value="metal">Metal</option>
              </select>
            </label>

            <label className="field color-field">
              <span>Color</span>
              <span className="color-input">
                <input aria-label="Plane color" type="color" value={color} onChange={(event) => setColor(event.target.value)} />
                <output>{color.toUpperCase()}</output>
              </span>
            </label>

            <label className="checkbox-row full-row">
              <input type="checkbox" checked={wireframe} onChange={(event) => setWireframe(event.target.checked)} />
              <span>
                <strong>Wireframe</strong>
                <small>Show the plane geometry edges.</small>
              </span>
            </label>
          </section>

          <div className="action-row">
            <button className="secondary-button" type="button" onClick={resetControls}>Reset</button>
            <button className="primary-button" type="button" onClick={() => setStatus("Settings applied")}>Apply settings</button>
          </div>
          <p className="status-line" aria-live="polite"><span aria-hidden="true" />{status}</p>
        </aside>
      </div>
    </main>
  );
}

function RangeControl({
  id,
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  const fill = ((value - min) / (max - min)) * 100;

  return (
    <div className="range-control">
      <span className="range-label">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id}>{value}{unit}</output>
      </span>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        style={{ "--range-fill": `${fill}%` } as CSSProperties}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="range-bounds" aria-hidden="true"><span>{min}</span><span>{max}{unit}</span></span>
    </div>
  );
}
