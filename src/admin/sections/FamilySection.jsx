// @ts-nocheck
import React from "react";

const INVITE_STATUS_LABELS = { pending: "Afventer", accepted: "Accepteret", expired: "Udløbet", revoked: "Tilbagekaldt" };
const INVITE_STATUS_PILL = { pending: "admin-pill-amber", accepted: "admin-pill-green", expired: "admin-pill-neutral", revoked: "admin-pill-red" };

function userLabel(u) {
  if (!u) return <span style={{ color: "var(--muted)" }}>Ukendt bruger</span>;
  return u.name || u.email || "Ukendt bruger";
}

export default function FamilySection({ familyMembers, familyInvites, familyLoading, familyActionLoading, adminRemoveFamilyMember, adminCancelInvite }) {
  // Grupperer family_members pr. ejer, så admin ser hele husstanden samlet
  // i stedet for en flad liste af enkeltmedlemmer uden kontekst.
  const groups = {};
  for (const m of familyMembers) {
    const key = m.family_owner_id || "ukendt";
    if (!groups[key]) groups[key] = { owner: m.owner, ownerId: m.family_owner_id, members: [] };
    groups[key].members.push(m);
  }
  const groupList = Object.values(groups);

  if (familyLoading) {
    return <div className="admin-loading-row"><div className="admin-spinner" /> Henter familie-overblik…</div>;
  }

  const handleRemoveMember = (m) => {
    if (!window.confirm(`Fjern familiemedlemmet "${m.name}" permanent? Dette kan ikke fortrydes.`)) return;
    adminRemoveFamilyMember(m.id);
  };

  const handleCancelInvite = (i) => {
    if (!window.confirm("Annullér denne invitation permanent?")) return;
    adminCancelInvite(i.id);
  };

  return (
    <>
      <div className="admin-card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>Familier ({groupList.length})</div>
        {groupList.length === 0 ? (
          <div className="admin-table-empty">Ingen familiemedlemmer oprettet endnu</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Ejer</th><th>Medlemmer</th><th>Antal</th></tr></thead>
              <tbody>
                {groupList.map(g => (
                  <tr key={g.ownerId}>
                    <td>
                      {userLabel(g.owner)}
                      <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--mono)" }}>{g.ownerId}</div>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {g.members.map(m => (
                          <span key={m.id} className="admin-pill admin-pill-neutral" title={`Fødselsår: ${m.birth_year || "–"} · ${(m.allergens || []).length} allergener`}
                            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            {m.name}{m.birth_year ? ` (${new Date().getFullYear() - m.birth_year} år)` : ""}
                            <button type="button" title="Fjern medlem" disabled={familyActionLoading} onClick={() => handleRemoveMember(m)}
                              style={{ border: "none", background: "none", cursor: "pointer", color: "var(--red)", fontWeight: 800, fontSize: 13, lineHeight: 1, padding: 0 }}>
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>{g.members.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-card">
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>Invitationer ({familyInvites.length})</div>
        {familyInvites.length === 0 ? (
          <div className="admin-table-empty">Ingen invitationer endnu</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Status</th><th>Inviteret af</th><th>Accepteret af</th><th>Oprettet</th><th>Udløber/accepteret</th><th></th></tr></thead>
              <tbody>
                {familyInvites.map(i => (
                  <tr key={i.id}>
                    <td><span className={`admin-pill ${INVITE_STATUS_PILL[i.status] || "admin-pill-neutral"}`}>{INVITE_STATUS_LABELS[i.status] || i.status}</span></td>
                    <td>{userLabel(i.inviter)}</td>
                    <td>{i.accepted_by ? userLabel(i.accepter) : <span style={{ color: "var(--muted)" }}>–</span>}</td>
                    <td>{new Date(i.created_at).toLocaleDateString("da-DK")}</td>
                    <td>{i.accepted_at ? new Date(i.accepted_at).toLocaleDateString("da-DK") : i.expires_at ? new Date(i.expires_at).toLocaleDateString("da-DK") : "–"}</td>
                    <td>
                      {i.status === "pending" && (
                        <button className="admin-btn admin-btn-danger admin-btn-sm" disabled={familyActionLoading} onClick={() => handleCancelInvite(i)}>
                          Annullér
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
