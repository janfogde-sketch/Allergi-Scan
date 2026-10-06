// @ts-nocheck
import React from "react";
import { Icon } from "./SharedComponents.jsx";
import { reportError } from "./errorReporter.js";
import { appCss } from "./theme.jsx";

// ── ErrorBoundary ─────────────────────────────────────────────────────────────
// Wrap enhver skærm for at fange crashes og vise en brugervenlig fejlside
// i stedet for en blank/hvid skærm.
//
// Brug:
//   <ErrorBoundary screen="Scanner">
//     <ScannerScreen ... />
//   </ErrorBoundary>
//
// F2-5 (6. okt. 2026): `silent` til små dele (header, menu, feedback-vindue): fejlen
// rapporteres, og kun den del forsvinder, så resten af appen kan bruges. `withStyles`
// til grænsen om hele appen i main.tsx, hvor appens CSS ellers ikke er indlæst.

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error(`[ErrorBoundary:${this.props.screen || "?"}]`, error, info);
    reportError(error, {
      screen: this.props.screen,
      source: "react",
      context: info?.componentStack ? { componentStack: info.componentStack.slice(0, 1500) } : null,
    });
    this.props.onError?.(error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.silent) return null;

    const screen = this.props.screen || "denne skærm";
    const onRetry = this.props.onRetry;

    const page = (
      <div className="screen" role="alert" style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"60vh", padding:"40px 24px", textAlign:"center" }}>
        <div style={{ marginBottom:16, display:"flex", justifyContent:"center" }}><Icon name="warning" size={48} color="var(--red)" /></div>
        <div style={{ fontSize:18, fontWeight:800, color:"var(--ink)", marginBottom:8 }}>
          Noget gik galt
        </div>
        <div style={{ fontSize:13, color:"var(--muted)", lineHeight:1.6, marginBottom:24, maxWidth:300 }}>
          {screen} stødte på en uventet fejl. Dine data er ikke påvirket.
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:8, width:"100%", maxWidth:280 }}>
          <button
            className="btn btn-outline"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              onRetry?.();
            }}
            style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            <Icon name="refresh" size={14} color="var(--ink)" /> Prøv igen
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => window.location.reload()}>
            Genindlæs app
          </button>
        </div>

        {process.env.NODE_ENV === "development" && this.state.error && (
          <div style={{ marginTop:24, padding:"12px 14px", background:"var(--red-lt)", border:"1px solid var(--red-md)", borderRadius:10, fontSize:11, color:"var(--red)", textAlign:"left", wordBreak:"break-all", maxWidth:340 }}>
            <div style={{ fontWeight:700, marginBottom:4 }}>Dev-fejl:</div>
            {this.state.error.toString()}
          </div>
        )}
      </div>
    );
    if (!this.props.withStyles) return page;
    return (
      <>
        <style>{appCss}</style>
        <div className="app">{page}</div>
      </>
    );
  }
}

export default ErrorBoundary;
