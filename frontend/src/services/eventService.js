import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/config";

export const createEvent = async (eventData) => {
  const eventRef = await addDoc(collection(db, "events"), {
    ...eventData,
    createdAt: serverTimestamp(),
  });

  return eventRef.id;
};

export const getEvents = async () => {
  const snapshot = await getDocs(collection(db, "events"));

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));
};

export const updateEvent = async (eventId, eventData) => {
  await updateDoc(
    doc(db, "events", eventId),
    eventData
  );
};

export const deleteEvent = async (eventId) => {
  await deleteDoc(doc(db, "events", eventId));
};