#!/usr/bin/env node
// Oversætter en minificeret stacktrace fra admin → Fejl til oprindelige filer, funktioner og linjer UDEN server: genopbygger den commit, som build-id'et
// peger på, med source maps og slår rammerne op. Brug:
//   node scripts/symbolicate.mjs <build-id> <stack-fil>      (eller "-" for stdin; kopiér stacken fra Tekniske oplysninger)
// En placering vises KUN, hvis kodefilens navn (med hash) findes i genopbygningen; ellers står rammen som "ikke oversat". Der opdigtes intet.
// Kendt begrænsning: hovedfilen main-*.js indeholder byggetidspunktet, så dens navn matcher normalt ikke; react-, AuthContext- og de fleste
// skærmfiler matcher. (Serverversionen, symbolicate-error, bruger kortene fra selve Vercel-buildet og har ikke den begrænsning.)
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { SourceMapConsumer } from "source-map-js";
import { symbolicateStack, formatResolved } from "../supabase/functions/_shared/symbolicate.js";

const repo = resolve(import.meta.dirname, "..");
const sh = (cmd, args, opts = {}) => execFileSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8", ...opts });

const [build, stackArg] = process.argv.slice(2);
if (!/^[0-9a-f]{7,40}$/i.test(build || "") || !stackArg) {
  console.error("Brug: node scripts/symbolicate.mjs <build-id> <stack-fil|->");
  process.exit(2);
}
const stack = stackArg === "-" ? readFileSync(0, "utf8") : readFileSync(stackArg, "utf8");

let sha;
try { sha = sh("git", ["rev-parse", "--verify", `${build}^{commit}`], { cwd: repo }).trim(); } catch {
  try { sh("git", ["fetch", "origin", build], { cwd: repo }); sha = sh("git", ["rev-parse", "--verify", "FETCH_HEAD"], { cwd: repo }).trim(); } catch {
    console.error(`Build-id ${build} findes ikke som commit i dette repo (prøv: git fetch origin).`);
    process.exit(1);
  }
}

const dir = mkdtempSync(join(tmpdir(), "eatsafe-sym-"));
const wt = join(dir, "wt");
try {
  console.error(`Genopbygger ${sha.slice(0, 7)} med source maps…`);
  sh("git", ["worktree", "add", "--detach", wt, sha], { cwd: repo });
  const sameLock = (() => { try { return readFileSync(join(wt, "package-lock.json"), "utf8") === readFileSync(join(repo, "package-lock.json"), "utf8"); } catch { return false; } })();
  if (sameLock && existsSync(join(repo, "node_modules"))) symlinkSync(join(repo, "node_modules"), join(wt, "node_modules"), "dir");
  else sh("npm", ["ci", "--no-audit", "--no-fund"], { cwd: wt, stdio: "inherit" });
  sh("npx", ["vite", "build", "--sourcemap", "hidden"], { cwd: wt, env: { ...process.env, VERCEL_GIT_COMMIT_SHA: sha } });
  const frames = await symbolicateStack({ stack }, async (file) => {
    const p = join(wt, "dist", "assets", `${file}.map`);
    return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null;
  }, SourceMapConsumer);
  for (const f of frames) {
    console.log(f.resolved
      ? `✔ ${f.name || f.fn || "(anonym)"}  ${f.source}:${f.origLine}:${f.origCol}   ← ${f.file}:${f.line}:${f.col}`
      : `✖ ikke oversat (${f.reason}): ${f.raw}`);
  }
  console.log(`\n${frames.filter((f) => f.resolved).length} af ${frames.length} rammer oversat til oprindelig kode (verificeret mod genopbygningen af ${sha.slice(0, 7)}).`);
  if (formatResolved(frames) === "") process.exitCode = 3;
} finally {
  try { sh("git", ["worktree", "remove", "--force", wt], { cwd: repo }); } catch { /* ryddes nedenfor */ }
  try { sh("git", ["worktree", "prune"], { cwd: repo }); } catch { /* ignoreres */ }
  rmSync(dir, { recursive: true, force: true });
}
