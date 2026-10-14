#!/bin/bash
# Vercels ignoreCommand (vercel.json): exit 0 = spring udrulningen over, exit 1 = byg.
# Grænsen i vercel.json er 256 tegn, derfor ligger reglen her.
# Kun main og dev udrulles (dev = dev.eatsafe.dk). Rene to do-/migrations-/dokumentændringer udrulles ikke.
if [ "$VERCEL_GIT_COMMIT_REF" != "main" ] && [ "$VERCEL_GIT_COMMIT_REF" != "dev" ]; then exit 0; fi
git diff --quiet HEAD^ HEAD -- . ':(exclude)supabase/migrations' ':(exclude)supabase/tests' ':(exclude)supabase/todo' ':(exclude)docs' ':(exclude).claude' ':(exclude).github' ':(exclude,glob)**/*.md'
