// src/context/AuthContext.js
import { createContext, useContext, useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  deleteUser
} from "firebase/auth";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists()) setUserProfile(snap.data());
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // Ro'yxatdan o'tish
  async function register(email, password, profileData) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(cred.user);
    await setDoc(doc(db, "users", cred.user.uid), {
      ...profileData,
      email,
      createdAt: new Date().toISOString(),
      plan: "free",
      contractsUsed: 0,
      contractsLimit: 10
    });
    return cred;
  }

  // Kirish
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Chiqish
  function logout() {
    return signOut(auth);
  }

  // Parolni tiklash
  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  // Profilni yangilash
  async function updateProfile(data) {
    if (!user) return;
    await setDoc(doc(db, "users", user.uid), data, { merge: true });
    setUserProfile(prev => ({ ...prev, ...data }));
  }

  // Hisobni o'chirish
  async function deleteAccount() {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid));
    await deleteUser(user);
  }

  return (
    <AuthContext.Provider value={{
      user, userProfile, loading,
      register, login, logout,
      resetPassword, updateProfile, deleteAccount
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
