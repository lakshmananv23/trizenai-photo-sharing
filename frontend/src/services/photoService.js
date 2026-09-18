import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";

import { db } from "../firebase/config";

const CLOUD_NAME = "r5rl0zrj";
const UPLOAD_PRESET = "trizenai_photos";

export const uploadPhoto = async (file, eventId, userId) => {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Cloudinary upload failed");
  }

  const data = await response.json();

  const photoRef = await addDoc(collection(db, "photos"), {
    eventId: eventId,
    fileName: file.name,
    imageUrl: data.secure_url,
    publicId: data.public_id,
    uploadedBy: userId,
    createdAt: serverTimestamp(),
  });

  return {
    id: photoRef.id,
    imageUrl: data.secure_url,
  };
};

export const getPhotosByEvent = async (eventId) => {
  const photosQuery = query(
    collection(db, "photos"),
    where("eventId", "==", eventId)
  );

  const snapshot = await getDocs(photosQuery);

  const photos = snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));

  // Sort newest photos first
  photos.sort((a, b) => {
    const timeA = a.createdAt?.seconds || 0;
    const timeB = b.createdAt?.seconds || 0;

    return timeB - timeA;
  });

  return photos;
};