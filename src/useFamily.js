// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// useFamily.js
// Håndterer familiemedlemmer — hent, tilføj, slet.
// Nyt-medlem-state bor her og nulstilles automatisk efter tilføjelse.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { SUPABASE_URL, AVATAR_COLORS, uid } from "./constants.jsx";
import { makeHeaders, apiCall } from "./helpers.js";
import { showToast } from "./SharedComponents.jsx";

export function useFamily({ accessToken, userId, setActiveProfiles }) {
  const [family, setFamily]                         = useState([]);

  // Nyt-medlem form-state
  const [newMemberName, setNewMemberName]           = useState("");
  const [newMemberBirthYear, setNewMemberBirthYear] = useState("");
  const [newMemberGender, setNewMemberGender]       = useState("");
  const [newMemberAllerg, setNewMemberAllerg]       = useState([]);
  const [newMemberCustomAllerg, setNewMemberCustomAllerg] = useState([]);
  const [newMemberDiets, setNewMemberDiets]         = useState([]);
  const [newMemberENumbers, setNewMemberENumbers]   = useState([]);
  const [newMemberSubtypes, setNewMemberSubtypes]   = useState({});
  const [newMemberCustomInput, setNewMemberCustomInput] = useState("");
  // Sat til et medlems id, mens formularen ovenfor redigerer det medlem i
  // stedet for at oprette et nyt (25. sept. 2026, brugerfeedback: "Rediger"
  // på et allerede-tilføjet familiemedlem) — null betyder "tilføj nyt".
  const [editingMemberId, setEditingMemberId] = useState(null);

  const resetNewMember = () => {
    setNewMemberName("");
    setNewMemberBirthYear("");
    setNewMemberGender("");
    setNewMemberAllerg([]);
    setNewMemberCustomAllerg([]);
    setNewMemberDiets([]);
    setNewMemberENumbers([]);
    setNewMemberSubtypes({});
    setNewMemberCustomInput("");
    setEditingMemberId(null);
  };

  // Fylder formularen ovenfor med et allerede-gemt medlems data, så
  // "Rediger" kan genbruge nøjagtig samme MemberForm som "Tilføj nyt" i
  // stedet for en separat redigerings-dialog.
  const startEditMember = (member) => {
    setNewMemberName(member.name || "");
    setNewMemberBirthYear(member.birth_year ? String(member.birth_year) : "");
    setNewMemberGender(member.gender || "");
    setNewMemberAllerg(member.allergens || []);
    setNewMemberCustomAllerg(member.custom || []);
    setNewMemberDiets(member.diets || []);
    setNewMemberENumbers(member.eNumbers || []);
    setNewMemberSubtypes({});
    setNewMemberCustomInput("");
    setEditingMemberId(member.id);
  };

  const cancelEditMember = () => resetNewMember();

  const loadFamily = async () => {
    try {
      const data = await apiCall(
        `${SUPABASE_URL}/rest/v1/family_members?user_id=eq.${userId}&select=id,name,color,birth_year,gender,allergens,custom_allergens,diets,e_numbers`,
        { headers: { ...makeHeaders(accessToken), "Accept": "application/json" } }
      );
      if (Array.isArray(data)) {
        setFamily(data.map(m => ({
          id: m.id,
          name: m.name,
          color: m.color || AVATAR_COLORS[0],
          birth_year: m.birth_year || null,
          gender: m.gender || "",
          allergens: m.allergens || [],
          custom: m.custom_allergens || [],
          diets: m.diets || [],
          eNumbers: m.e_numbers || [],
        })));
      }
    } catch { /* silent */ }
  };

  const addMember = async () => {
    if (!newMemberName.trim() || !newMemberBirthYear || !newMemberGender) return;
    const color = AVATAR_COLORS[family.length % AVATAR_COLORS.length];
    const tempMember = {
      id: uid(),
      name: newMemberName.trim(),
      birth_year: parseInt(newMemberBirthYear) || null,
      gender: newMemberGender,
      allergens: newMemberAllerg,
      custom: newMemberCustomAllerg,
      diets: newMemberDiets,
      eNumbers: newMemberENumbers,
      color,
    };
    setFamily(f => [...f, tempMember]);
    resetNewMember();
    // Ekstra bekræftelse ud over selve listen der viser medlemmet — uden
    // den kunne brugeren være usikker på, om trykket reelt gjorde noget
    // (25. sept. 2026, brugerfeedback: "hvad sker der, når man trykker
    // + Tilføj familiemedlem?").
    showToast(`${tempMember.name} er tilføjet`);
    try {
      const data = await apiCall(`${SUPABASE_URL}/rest/v1/family_members`, {
        method: "POST",
        headers: { ...makeHeaders(accessToken), "Prefer": "return=representation" },
        body: JSON.stringify({
          user_id: userId,
          name: tempMember.name,
          birth_year: tempMember.birth_year,
          gender: tempMember.gender,
          color,
          allergens: newMemberAllerg,
          custom_allergens: newMemberCustomAllerg,
          diets: newMemberDiets,
          e_numbers: newMemberENumbers,
        }),
      });
      const saved = Array.isArray(data) ? data[0] : data;
      if (saved?.id) setFamily(f => f.map(m => m.id === tempMember.id ? { ...m, id: saved.id } : m));
    } catch {
      // Gemning fejlede — fjern det optimistiske medlem igen, ellers står
      // brugeren med et familiemedlem i UI'et der aldrig blev gemt i databasen
      setFamily(f => f.filter(m => m.id !== tempMember.id));
    }
  };

  const updateMember = async () => {
    if (!editingMemberId || !newMemberName.trim() || !newMemberBirthYear || !newMemberGender) return;
    const id = editingMemberId;
    const before = family.find(m => m.id === id);
    const patch = {
      name: newMemberName.trim(),
      birth_year: parseInt(newMemberBirthYear) || null,
      gender: newMemberGender,
      allergens: newMemberAllerg,
      custom: newMemberCustomAllerg,
      diets: newMemberDiets,
      eNumbers: newMemberENumbers,
    };
    setFamily(f => f.map(m => m.id === id ? { ...m, ...patch } : m));
    resetNewMember();
    showToast(`${patch.name} er opdateret`);
    try {
      await apiCall(`${SUPABASE_URL}/rest/v1/family_members?id=eq.${id}`, {
        method: "PATCH",
        headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
        body: JSON.stringify({
          name: patch.name,
          birth_year: patch.birth_year,
          gender: patch.gender,
          allergens: newMemberAllerg,
          custom_allergens: newMemberCustomAllerg,
          diets: newMemberDiets,
          e_numbers: newMemberENumbers,
        }),
      });
    } catch {
      // Opdatering fejlede — læg det oprindelige medlem tilbage, ellers
      // viser UI'et ændringer der aldrig blev gemt i databasen
      if (before) setFamily(f => f.map(m => m.id === id ? before : m));
    }
  };

  const removeMember = async (id) => {
    const removed = family.find(m => m.id === id);
    setFamily(f => f.filter(m => m.id !== id));
    // Fjern det slettede medlem fra det gemte scannerudvalg — hvis det var
    // den eneste valgte profil, falder vi tilbage til brugerens egen ("me")
    // i stedet for at efterlade et tomt udvalg (25. sept. 2026, opfølgning).
    setActiveProfiles(a => {
      const next = a.filter(x => x !== id);
      return next.length > 0 ? next : ["me"];
    });
    if (editingMemberId === id) resetNewMember();
    try {
      await apiCall(`${SUPABASE_URL}/rest/v1/family_members?id=eq.${id}`, {
        method: "DELETE",
        headers: makeHeaders(accessToken),
      });
    } catch {
      // Sletning fejlede — læg medlemmet tilbage, ellers forsvinder det fra UI'et
      // uden at faktisk være slettet i databasen
      if (removed) setFamily(f => [...f, removed]);
    }
  };

  return {
    family, setFamily,
    newMemberName, setNewMemberName,
    newMemberBirthYear, setNewMemberBirthYear,
    newMemberGender, setNewMemberGender,
    newMemberAllerg, setNewMemberAllerg,
    newMemberCustomAllerg, setNewMemberCustomAllerg,
    newMemberDiets, setNewMemberDiets,
    newMemberENumbers, setNewMemberENumbers,
    newMemberSubtypes, setNewMemberSubtypes,
    newMemberCustomInput, setNewMemberCustomInput,
    editingMemberId,
    loadFamily,
    addMember,
    updateMember,
    removeMember,
    startEditMember,
    cancelEditMember,
  };
}
