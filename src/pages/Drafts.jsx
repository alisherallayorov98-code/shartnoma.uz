import { useEffect, useState } from "react";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function Drafts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState([]);

  useEffect(() => {
    loadDrafts();
  }, []);

  async function loadDrafts() {
    const q = query(
      collection(db, "contracts"),
      where("userId", "==", user.uid),
      where("status", "==", "draft")
    );

    const snap = await getDocs(q);
    setDrafts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  async function removeDraft(id) {
    await deleteDoc(doc(db, "contracts", id));
    loadDrafts();
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0A0715" }}>
      <Sidebar />
      <main style={{ marginLeft: 260, flex: 1, padding: 40, color: "#F0EDFF" }}>
        <h2>Qoralamalar</h2>

        {drafts.length === 0 && <p>Qoralamalar mavjud emas</p>}

        {drafts.map(d => (
          <div key={d.id} style={{
            background: "rgba(255,255,255,0.05)",
            padding: 20,
            borderRadius: 12,
            marginBottom: 12
          }}>
            <h4>{d.contractNumber || "Raqamsiz shartnoma"}</h4>
            <p>{d.type}</p>

            <button onClick={() => navigate(`/create?draftId=${d.id}`)}>
              Ochish
            </button>

            <button
              onClick={() => removeDraft(d.id)}
              style={{ marginLeft: 10, color: "red" }}
            >
              O‘chirish
            </button>
          </div>
        ))}
      </main>
    </div>
  );
}
