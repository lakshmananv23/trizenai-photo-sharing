import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { auth, db } from "../firebase/config";

import {
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

// Register user
export const registerUser = async (name, email, password, role) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  const user = userCredential.user;

  // Save user information in Firestore
  await setDoc(doc(db, "users", user.uid), {
    name: name,
    email: email,
    role: role,
    createdAt: serverTimestamp(),
  });

  return user;
};

// Login user
export const loginUser = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  return userCredential.user;
};

// Logout user
export const logoutUser = async () => {
  await signOut(auth);
};