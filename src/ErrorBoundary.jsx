// @ts-nocheck
import React from "react";

// ── ErrorBoundary ─────────────────────────────────────────────────────────────
// Wrap enhver skærm for at fange crashes og vise en brugervenlig fejlside
// i stedet for en blank/hvid skærm.
//
// Brug:
//   <ErrorBoundary screen="Scanner">
//     <ScannerScreen ... />
//   </ErrorBoundary>

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
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const screen = this.props.screen || "denne skærm";
    const onRetry = this.props.onRetry;

    return (
      <div className="screen" style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"60vh", padding:"40px 24px", textAlign:"center" }}>
        <div style={{ fontSize:56, marginBottom:16 }}>⚠️</div>
        <div style={{ fontSize:18, fontWeight:800, color:"var(--ink)", marginBottom:8 }}>
          Noget gik galt
        </div>
        <div style={{ fontSize:13, color:"var(--muted2)", lineHeight:1.6, marginBottom:24, maxWidth:300 }}>
          {screen} stødte på en uventet fejl. Dine data er ikke påvirket.
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:8, width:"100%", maxWidth:280 }}>
          <button
            className="btn btn-outline"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              onRetry?.();
            }}>
            🔄 Prøv igen
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
  }
}

export default ErrorBoundary;
