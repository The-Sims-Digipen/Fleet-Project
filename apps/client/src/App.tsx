import { Component, lazy, Suspense, useState, type ReactNode } from "react";
import { Sidebar } from "./components/Sidebar";

const LazyWorldScene = lazy(() => import("./components/WorldScene").then((module) => ({ default: module.WorldScene })));

class ViewportBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <div className="scene-fallback" role="alert">The 3D viewport could not load. You can still edit the scene in the sidebar.</div> : this.props.children;
  }
}

export default function App() {
  const [cameraReset, setCameraReset] = useState(0);
  return <main className="app-shell">
    <a className="skip-link" href="#controls">Skip to controls</a>
    <header className="app-header">
      <div className="brand"><span className="brand-mark" aria-hidden="true">◇</span><div><p>Starter</p><h1>3D Playground</h1></div></div>
      <span className="status-badge"><i aria-hidden="true" />Local scene</span>
    </header>
    <div className="workspace">
      <section className="scene-panel" aria-labelledby="scene-title">
        <ViewportBoundary><Suspense fallback={<div className="scene-fallback">Loading 3D world…</div>}><LazyWorldScene cameraReset={cameraReset} /></Suspense></ViewportBoundary>
        <div className="scene-heading"><span>3D viewport</span><h2 id="scene-title">Plane & cube</h2></div>
        <div className="scene-hint">Click to select · Drag to orbit · Scroll to zoom</div>
      </section>
      <Sidebar onResetCamera={() => setCameraReset((value) => value + 1)} />
    </div>
  </main>;
}
