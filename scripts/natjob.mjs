// Kommandolinje til natjob-workflowene (.github/scripts/natjob.sh). Se docs/natjob-routine.md.
//   node scripts/natjob.mjs queue <kø.json>                   → motorens resultat pr. vare (JSON på stdout)
//   node scripts/natjob.mjs ids <input.json>                  → id'er på allergenvarer (én pr. linje)
//   node scripts/natjob.mjs build <input.json> <tekster.json> → input til routine_apply (JSON på stdout)
import { readFileSync } from "node:fs";
import { buildApplyPayload, isUuid, prepareQueue } from "./natjob-core.mjs";

const [cmd, a, b] = process.argv.slice(2);
const read = (f) => JSON.parse(readFileSync(f, "utf8"));

if (cmd === "queue") {
  process.stdout.write(JSON.stringify(prepareQueue(read(a)), null, 1));
} else if (cmd === "ids") {
  const ids = (read(a).allergen || []).map((x) => x?.id);
  for (const id of ids) {
    if (!isUuid(id)) { console.error(`Ugyldigt id: ${id}`); process.exit(1); }
    console.log(id);
  }
} else if (cmd === "build") {
  const rows = read(b);
  const texts = Object.fromEntries((Array.isArray(rows) ? rows : []).map((r) => [r.id, r.ingredients_text]));
  process.stdout.write(JSON.stringify(buildApplyPayload(read(a), texts)));
} else {
  console.error("Brug: queue|ids|build");
  process.exit(1);
}
