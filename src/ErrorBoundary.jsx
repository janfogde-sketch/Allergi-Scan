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

    const onRetry = this.props.onRetry;

    // En fejl i visningen ændrer ikke data, der allerede er gemt på serveren, så sætningen om gemte data holder.
    const page = (
      <div className="screen state-page" role="alert">
        <div className="state-page-icon"><Icon name="warning" size={24} color="var(--red)" /></div>
        <div className="state-page-title">Noget gik galt</div>
        <div className="state-page-text">Der opstod en uventet fejl. Dine gemte data er ikke påvirket.</div>
        <div className="state-page-actions">
          <button className="btn btn-primary btn-full"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              onRetry?.();
            }}>
            Prøv igen
          </button>
          {/* Genindlæser hele appen fra serveren, dvs. en reel genstart. */}
          <button className="btn btn-ghost btn-full" onClick={() => window.location.reload()}>
            Genstart appen
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
