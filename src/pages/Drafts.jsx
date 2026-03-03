import React, { useEffect, useState } from "react";
import { getDrafts, deleteDraft } from "../utils/draftStorage";
import { useNavigate } from "react-router-dom";

export default function Drafts() {
  const [drafts, setDrafts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    setDrafts(getDrafts());
  }, []);

  const handleDelete = (id) => {
    deleteDraft(id);
    setDrafts(getDrafts());
  };

  const handleOpen = (draft) => {
    navigate("/create", { state: { draft } });
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Qoralamalar</h2>

      {drafts.length === 0 && <p>Saqlangan qoralamalar yo‘q.</p>}

      {drafts.map((draft) => (
        <div
          key={draft.id}
          style={{
            border: "1px solid #ddd",
            padding: 15,
            marginBottom: 10,
            borderRadius: 8
          }}
        >
          <strong>{draft.title || "Nomsiz shartnoma"}</strong>
          <p>
            Sana: {new Date(draft.createdAt).toLocaleString()}
          </p>

          <button onClick={() => handleOpen(draft)}>
            Ochish
          </button>

          <button
            onClick={() => handleDelete(draft.id)}
            style={{ marginLeft: 10, color: "red" }}
          >
            O‘chirish
          </button>
        </div>
      ))}
    </div>
  );
}
