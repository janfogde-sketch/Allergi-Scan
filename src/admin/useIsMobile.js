// @ts-check
// Mobilvisning i admin-panelet (samme grænse som CSS-mediaquery i adminTheme.js: højst 820 px). Uden matchMedia (fx tests) er svaret "ikke mobil".
import { useEffect, useState } from "react";

export const MOBILE_QUERY = "(max-width: 820px)";
const read = () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(MOBILE_QUERY).matches;

export function useIsMobile() {
  const [mobile, setMobile] = useState(read);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
    const mq = window.matchMedia(MOBILE_QUERY);
    const on = () => setMobile(mq.matches);
    on();
    if (mq.addEventListener) mq.addEventListener("change", on); else mq.addListener(on);
    return () => { if (mq.removeEventListener) mq.removeEventListener("change", on); else mq.removeListener(on); };
  }, []);
  return mobile;
}
