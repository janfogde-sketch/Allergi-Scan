import { fetchOffImage, checkOffImageAccess } from "./_offImageLogic.js";

export default async function handler(req, res) {
  if (req.method !== "GET") { res.setHeader("Allow", "GET"); return res.status(405).end(); }
  const blocked = checkOffImageAccess(req.headers);
  if (blocked) {
    res.setHeader("Cache-Control", "no-store");
    if (blocked.retryAfter) res.setHeader("Retry-After", String(blocked.retryAfter));
    return res.status(blocked.status).json({ error: blocked.error });
  }
  const out = await fetchOffImage(req.query?.p);
  if (out.status !== 200) {
    res.setHeader("Cache-Control", out.status === 404 ? "public, s-maxage=3600" : "no-store");
    return res.status(out.status).json({ error: out.error });
  }
  for (const [k, v] of Object.entries(out.headers)) res.setHeader(k, v);
  res.status(200).send(out.body);
}
