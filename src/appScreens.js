import { SCREENS } from "./constants.jsx";

// Skærme en bruger med ufuldført onboarding ALTID må kunne se/blive på (29.
// sept. 2026, "Onboarding-persistens") — se setScreen-wrapperen i
// EatSafe()-komponenten i App.jsx, som håndhæver dette for enhver anden skærm.
// TERMS/PRIVACY tilføjet 29. sept. 2026 ("Opdater siderne Brugsvilkår og
// Privatlivspolitik") — juridiske sider skal altid kunne ses, uanset
// onboarding-status, præcis samme begrundelse som WELCOME/LOGIN/ONBOARD.
export const ONBOARDING_EXEMPT_SCREENS = [SCREENS.WELCOME, SCREENS.LOGIN, SCREENS.ONBOARD, SCREENS.VERIFYEMAIL, SCREENS.RESETPASSWORD, SCREENS.BOOT, SCREENS.TERMS, SCREENS.PRIVACY];
// Skærme uden AppHeader/bundnavigation (login, bekræftelse, onboarding).
export const AUTH_FLOW_SCREENS = [SCREENS.WELCOME, SCREENS.LOGIN, SCREENS.ONBOARD, SCREENS.VERIFYEMAIL, SCREENS.RESETPASSWORD, SCREENS.BOOT];
