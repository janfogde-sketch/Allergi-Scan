import { handleSession } from "./_sessionLogic.js";

export default async function handler(req, res) {
  const out = await handleSession(req);
  res.setHeader("Cache-Control", "no-store");
  if (out.setCookie) res.setHeader("Set-Cookie", out.setCookie);
  res.status(out.status).json(out.body);
}
