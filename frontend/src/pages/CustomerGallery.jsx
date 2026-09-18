import { useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../firebase/config";
import { getPhotosByEvent } from "../services/photoService";

function CustomerGallery() {
  const [pin, setPin] = useState("");
  const [event, setEvent] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!pin.trim()) {
      setMessage("Please enter your event PIN.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setEvent(null);
      setPhotos([]);

      // Find event using PIN
      const eventsQuery = query(
        collection(db, "events"),
        where("pin", "==", pin.trim())
      );

      const snapshot = await getDocs(eventsQuery);

      if (snapshot.empty) {
        setMessage("Invalid Event PIN ❌");
        return;
      }

      const eventDocument = snapshot.docs[0];

      const eventData = {
        id: eventDocument.id,
        ...eventDocument.data(),
      };

      setEvent(eventData);

      // Get photos for this event
      const eventPhotos = await getPhotosByEvent(eventDocument.id);

      setPhotos(eventPhotos);

      if (eventPhotos.length === 0) {
        setMessage("No photos have been uploaded yet.");
      }
    } catch (error) {
      console.error("Gallery error:", error);
      setMessage("Unable to load gallery ❌");
    } finally {
      setLoading(false);
    }
  };

  // Download photo
  const handleDownload = async (photo) => {
    try {
      setMessage("");

      const response = await fetch(photo.imageUrl);

      if (!response.ok) {
        throw new Error("Failed to download image");
      }

      const blob = await response.blob();

      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = photo.fileName || "photo.jpg";

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download error:", error);
      setMessage("Photo download failed ❌");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-800">
            TrizenAI Photo Sharing
          </h1>

          <p className="text-sm text-gray-500">
            Customer Photo Gallery
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">

        {/* PIN Search */}
        {!event && (
          <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow">

            <h2 className="text-2xl font-bold text-gray-800 text-center">
              📸 Access Your Photos
            </h2>

            <p className="text-gray-500 text-center mt-2">
              Enter the Event PIN provided by your photographer.
            </p>

            <form onSubmit={handleSearch} className="mt-6">

              <input
                type="text"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter Event PIN"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Loading..." : "View My Photos"}
              </button>

            </form>

            {message && (
              <p className="text-center text-red-500 mt-4">
                {message}
              </p>
            )}

          </div>
        )}

        {/* Gallery */}
        {event && (
          <div>

            {/* Event Information */}
            <div className="bg-white p-6 rounded-xl shadow">

              <h2 className="text-3xl font-bold text-gray-800">
                {event.eventName}
              </h2>

              <p className="text-gray-600 mt-2">
                Customer: {event.customerName}
              </p>

              <p className="text-gray-600">
                Event Date: {event.eventDate}
              </p>

            </div>

            {/* Photos */}
            <div className="mt-8">

              <h3 className="text-2xl font-bold text-gray-800 mb-5">
                📸 Your Photos
              </h3>

              {photos.length === 0 ? (

                <div className="bg-white p-8 rounded-xl shadow text-center">
                  <p className="text-gray-500">
                    No photos uploaded yet.
                  </p>
                </div>

              ) : (

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">

                  {photos.map((photo) => (

                    <div
                      key={photo.id}
                      className="bg-white rounded-xl shadow overflow-hidden"
                    >

                      {/* Photo */}
                      <img
                        src={photo.imageUrl}
                        alt={photo.fileName}
                        className="w-full h-64 object-cover"
                      />

                      {/* Download Button */}
                      <div className="p-3">

                        <button
                          onClick={() => handleDownload(photo)}
                          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                        >
                          📥 Download Photo
                        </button>

                      </div>

                    </div>

                  ))}

                </div>

              )}

              {/* Search Another Event */}
              <button
                onClick={() => {
                  setEvent(null);
                  setPhotos([]);
                  setPin("");
                  setMessage("");
                }}
                className="mt-8 bg-gray-700 text-white px-5 py-2 rounded-lg hover:bg-gray-800"
              >
                ← Search Another Event
              </button>

            </div>

          </div>
        )}

      </main>

    </div>
  );
}

export default CustomerGallery;