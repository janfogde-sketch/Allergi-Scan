import { handleAuthReturn } from "./_authReturnLogic.js";

export default function handler(req, res) {
  const out = handleAuthReturn(req);
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Location", out.location);
  res.status(out.status).end();
}
