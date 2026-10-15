// supabase/functions/delete-user/index.ts
// Sletter en bruger komplet — relaterede data, public.users og auth.users.
// En bruger kan altid slette sin egen konto (uid === den kaldende bruger).
// Sletning af en ANDEN bruger kræver admin-rolle på den kaldende bruger.

import { createClient } from "jsr:@supabase/supabase-js@2.117.2";
import { logAdminEvent, logAccessDenied } from "../_shared/adminAudit.ts";
import { TRANSACTIONAL_TEMPLATES, buildMailVariables, sendTemplateMail } from "../_shared/mailSend.ts";
import { formatDanishDateTime } from "../_shared/notifyHelpers.js";
import { PRODUCT_IMAGES_BUCKET, pathsToDelete } from "../_shared/productImages.js";
import { corsFor } from "../_shared/http.ts";

const corsHeaders = corsFor();

const DELETE_FAILED_TEXT = "Kontoen kunne ikke slettes helt. Prøv igen, eller kontakt support@eatsafe.dk.";

// Et sletningstrin fejlede. Beskeden (tabel + databasefejl) logges kun, vises aldrig for brugeren.
class DeleteStepError extends Error {
  constructor(step: string, detail: string) {
    super(`${step}: ${detail}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Til adminloggen ved en mislykket sletning (sættes, når en admin sletter en andens konto)
  let auditActor: string | null = null, auditTarget = "";
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verificer at den kaldende bruger faktisk er logget ind. Undtagelse: vores egen oprydning af inaktive konti (inactive-accounts)
    // kalder med service-role-nøglen og må slette en konto, den selv har fundet (36 måneder uden aktivitet, advaret 30 dage før).
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Ikke autoriseret");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const isSystemCall = serviceKey !== "" && authHeader === `Bearer ${serviceKey}`;

    const { uid } = await req.json();
    if (!uid) throw new Error("uid er påkrævet");
    let adminActorId: string | null = null; // sættes når en admin sletter en andens konto (logges i admin_audit_log)

    if (!isSystemCall) {
      const userClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data: { user: caller } } = await userClient.auth.getUser();
      if (!caller) throw new Error("Ikke autoriseret");

      // En bruger må altid slette sin egen konto. Sletning af ANDRE brugere
      // kræver admin-rolle.
      const isSelfDelete = uid === caller.id;
      if (!isSelfDelete) {
        const { data: callerProfile } = await supabase
          .from("users").select("role").eq("id", caller.id).single();
        if (callerProfile?.role !== "admin") {
          await logAccessDenied(supabase, caller.id, "delete-user");
          throw new Error("Kun admins kan slette andre brugere");
        }
        adminActorId = caller.id;
        auditActor = caller.id;
        auditTarget = String(uid);
      }
    }

    // Hent minimal e-mail/navn FØR sletningen — bruges kun til slettekvitteringen (P4) og gemmes ikke.
    const { data: target, error: targetError } = await supabase.from("users").select("email, name").eq("id", uid).maybeSingle();
    if (targetError) throw new DeleteStepError("users (opslag)", targetError.message);

    // Hvert trin tjekkes. Fejler ét, stopper vi FØR auth.users slettes: så kan brugeren
    // stadig logge ind og prøve igen, i stedet for at efterlade navn/e-mail/allergier uden ejer.
    const step = async (label: string, query: PromiseLike<{ error: { message: string } | null }>) => {
      const { error } = await query;
      if (error) throw new DeleteStepError(label, error.message);
    };

    // Indsendte billeder (privat bøtte og ældre filer i den offentlige) fjernes FØRST, mens indsendelsernes rækker stadig peger på dem,
    // så et nyt forsøg kan finde resten. Billeder, et godkendt produkt i produktdatabasen bruger, bliver (privatlivspolitikken, afsnit 11).
    const { data: subs, error: subsError } = await supabase
      .from("submissions").select("raw_label_image, ai_parsed_data").eq("submitted_by", uid);
    if (subsError) throw new DeleteStepError("submissions (opslag)", subsError.message);
    if (Object.keys(pathsToDelete(subs ?? [], [])).length > 0) {
      const { data: kept, error: keptError } = await supabase.from("products").select("image_url").ilike("image_url", `%/${PRODUCT_IMAGES_BUCKET}/%`);
      if (keptError) throw new DeleteStepError("products (billeder)", keptError.message);
      const toRemove = pathsToDelete(subs ?? [], (kept ?? []).map((r: { image_url: string }) => r.image_url));
      for (const [bucket, paths] of Object.entries(toRemove) as [string, string[]][]) {
        for (let i = 0; i < paths.length; i += 100) {
          await step(`storage ${bucket}`, supabase.storage.from(bucket).remove(paths.slice(i, i + 100)));
        }
      }
    }

    // Slet afhængige data i korrekt rækkefølge.
    //
    // favorites/push_tokens/search_selections er BEVIDST ikke nævnt her —
    // deres user_id-fremmednøgler har ON DELETE CASCADE mod users, så de
    // ryddes automatisk når users-rækken slettes nedenfor (verificeret i
    // databaseskemaet). Den gamle familiemodel (families/family_memberships)
    // nævnes heller ikke: family_memberships.user_id har ON DELETE CASCADE og
    // families.created_by ON DELETE SET NULL, og tabellerne fjernes i S8 trin 2.
    await step("shopping_list_items", supabase.from("shopping_list_items").delete().eq("added_by", uid));
    await step("shopping_lists", supabase.from("shopping_lists").delete().eq("owner_id", uid));
    await step("shopping_list_access", supabase.from("shopping_list_access").delete().eq("user_id", uid));
    await step("scan_history", supabase.from("scan_history").delete().eq("user_id", uid));
    await step("user_allergens", supabase.from("user_allergens").delete().eq("user_id", uid));
    await step("family_members", supabase.from("family_members").delete().eq("user_id", uid));
    await step("feedback_tickets", supabase.from("feedback_tickets").delete().eq("submitted_by", uid));
    await step("submissions", supabase.from("submissions").delete().eq("submitted_by", uid));
    // users slettes sidst før auth.users.
    await step("users", supabase.from("users").delete().eq("id", uid));

    // Slet fra auth.users (kræver service role)
    const { error: authError } = await supabase.auth.admin.deleteUser(uid);
    if (authError) throw new DeleteStepError("auth.users", authError.message);

    // Adminlog: kun handlingen og det slettede bruger-id (ingen e-mail eller navn). Fejl her må ikke få sletningen til at se fejlet ud.
    if (adminActorId) {
      const { error: auditError } = await supabase.from("admin_audit_log")
        .insert({ admin_id: adminActorId, action: "bruger_slettet", target_table: "users", target_id: uid });
      if (auditError) console.error(`delete-user: adminlog fejlede: ${auditError.message}`);
    }

    // P4: slettekvittering — først EFTER en gennemført sletning, og kun når mailkanalen er slået til
    // (notifications_email_enabled, eller brugeren står på testlisten). Fejl her må aldrig få selve sletningen til at se fejlet ud.
    try {
      const { data: flagOn } = await supabase.rpc("notification_flag", { p_key: "notifications_email_enabled", p_user: uid });
      const apiKey = Deno.env.get("RESEND_API_KEY") ?? "";
      if (flagOn === true && target?.email && apiKey) {
        const variables = { ...buildMailVariables({ deletedAt: formatDanishDateTime(new Date().toISOString()) }, target.name) };
        let res = { ok: false, retryable: true, error: "" } as { ok: boolean; retryable: boolean; error?: string };
        for (let attempt = 0; attempt < 3 && !res.ok && res.retryable; attempt++) {
          res = await sendTemplateMail({
            apiKey, to: target.email, templateId: TRANSACTIONAL_TEMPLATES.account_deleted.id,
            subject: TRANSACTIONAL_TEMPLATES.account_deleted.subject, variables, idempotencyKey: `account-deleted-${uid}`,
          });
          if (!res.ok && res.retryable) await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        }
        if (!res.ok) await supabase.rpc("log_client_error", { p_message: `Slettekvittering fejlede: ${res.error}`, p_source: "edge:delete-user" });
      }
    } catch (e) {
      console.error("slettekvittering:", e);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    if (err instanceof DeleteStepError) {
      // Den tekniske årsag logges; brugeren får en kort dansk besked (ingen rå databasefejl).
      console.error(`delete-user: ${err.message}`);
      if (auditActor) {
        const logClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
        await logAdminEvent(logClient, auditActor, "bruger_slettet", "users", auditTarget, { fejl: "sletning_stoppet" }, "mislykket");
      }
      try {
        const logClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
        await logClient.rpc("log_client_error", { p_message: `Kontosletning stoppet: ${err.message}`, p_source: "edge:delete-user" });
      } catch { /* logning må ikke skjule selve fejlen */ }
      return new Response(JSON.stringify({ error: DELETE_FAILED_TEXT }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
