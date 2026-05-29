// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// useFamily.js
// Håndterer familiemedlemmer — hent, tilføj, slet.
// Nyt-medlem-state bor her og nulstilles automatisk efter tilføjelse.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { SUPABASE_URL, AVATAR_COLORS, uid } from "./constants.jsx";
import { makeHeaders, apiCall } from "./helpers.js";

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
  };

  const loadFamily = async () => {
    try {
      const data = await apiCall(
        `${SUPABASE_URL}/rest/v1/family_members?user_id=eq.${userId}&select=id,name,color,birth_year,gender`,
        { headers: { ...makeHeaders(accessToken), "Accept": "application/json" } }
      );
      if (Array.isArray(data)) {
        setFamily(data.map(m => ({
          id: m.id,
          name: m.name,
          color: m.color || AVATAR_COLORS[0],
          birth_year: m.birth_year || null,
          gender: m.gender || "",
          allergens: [],
          custom: [],
          diets: [],
          eNumbers: [],
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
    } catch { /* silent */ }
  };

  const removeMember = async (id) => {
    setFamily(f => f.filter(m => m.id !== id));
    setActiveProfiles(a => a.filter(x => x !== id));
    try {
      await apiCall(`${SUPABASE_URL}/rest/v1/family_members?id=eq.${id}`, {
        method: "DELETE",
        headers: makeHeaders(accessToken),
      });
    } catch { /* silent */ }
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
    loadFamily,
    addMember,
    removeMember,
  };
}
