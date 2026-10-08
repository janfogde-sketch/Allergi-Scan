import React from "react";
import { SCREENS } from "./constants.jsx";
import { Icon } from "./SharedComponents.jsx";

// Bundnavigationen (flyttet ud af App.jsx, ren omflytning).
export default function BottomNav({ screen, setScreen }) {
  return (
        <nav className={`bottom-nav${screen === SCREENS.ADMIN ? " nav-muted" : ""}`} role="navigation" aria-label="Hovednavigation">
          {[
            [SCREENS.LIST,    "cart",     "Indkøbsliste"],
            [SCREENS.HOME,    "scanframe","Scan"],
            [SCREENS.HISTORY, "clock",    "Historik"],
          ].map(([s,icon,lbl]) => (
            <div key={s} className={`nav-item${(
              screen===s ||
              (screen===SCREENS.RESULT && s===SCREENS.HOME) ||
              (screen===SCREENS.NOTFOUND && s===SCREENS.HOME) ||
              (screen===SCREENS.SUBMITTED && s===SCREENS.HOME)
            )?" active":""}`}
              onClick={() => setScreen(s)}
              role="button"
              aria-label={lbl}
              aria-current={screen===s ? "page" : undefined}
              tabIndex={0}
              onKeyDown={e => e.key === "Enter" && setScreen(s)}>
              <div className="nav-icon"><Icon name={icon} size={22} /></div>
              <div className="nav-lbl">{lbl}</div>
            </div>
          ))}
        </nav>
  );
}
