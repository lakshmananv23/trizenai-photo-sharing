import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { logoutUser } from "../services/authService";
import { getEvents } from "../services/eventService";
import {
  uploadPhoto,
  getPhotosByEvent,
} from "../services/photoService";

function TeamDashboard() {
  const { user } = useAuth();

  const [events, setEvents] = useState([]);
  const [photos, setPhotos] = useState({});
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const allEvents = await getEvents();

        const assignedEvents = allEvents.filter(
          (event) => event.teamMemberId === user?.uid
        );

        setEvents(assignedEvents);

        // Load photos for each event
        const photoData = {};

        for (const event of assignedEvents) {
          const eventPhotos = await getPhotosByEvent(event.id);
          photoData[event.id] = eventPhotos;
        }

        setPhotos(photoData);
      } catch (error) {
        console.error("Error loading events:", error);
      }
    };

    if (user) {
      loadEvents();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      window.location.href = "/login";
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpload = async (eventId, file) => {
    if (!file) return;

    try {
      setUploading(true);
      setMessage("");

      await uploadPhoto(file, eventId, user.uid);

      // Reload photos for this event
      const updatedPhotos = await getPhotosByEvent(eventId);

      setPhotos((previous) => ({
        ...previous,
        [eventId]: updatedPhotos,
      }));

      setMessage("Photo uploaded successfully! ✅");
    } catch (error) {
      console.error("Upload error:", error);
      setMessage("Photo upload failed ❌");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              TrizenAI Photo Sharing
            </h1>

            <p className="text-sm text-gray-500">
              Team Member Dashboard
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-5 py-2 rounded-lg hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-3xl font-bold text-gray-800">
          Welcome, {user?.email} 👋
        </h2>

        <p className="text-gray-500 mt-2">
          Here are the events assigned to you.
        </p>

        {message && (
          <div className="mt-5 bg-white p-4 rounded-lg shadow text-gray-700">
            {message}
          </div>
        )}

        <div className="mt-8">
          <h3 className="text-2xl font-semibold text-gray-800">
            My Assigned Events
          </h3>

          {events.length === 0 ? (
            <div className="bg-white mt-5 p-6 rounded-xl shadow">
              <p className="text-gray-500">
                No events assigned to you.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="bg-white p-6 rounded-xl shadow"
                >
                  <h4 className="text-xl font-bold text-gray-800">
                    {event.eventName}
                  </h4>

                  <p className="text-gray-600 mt-2">
                    Customer: {event.customerName}
                  </p>

                  <p className="text-gray-600 mt-1">
                    Date: {event.eventDate}
                  </p>

                  {/* Upload */}
                  <div className="mt-5">
                    <label
                      htmlFor={`photo-${event.id}`}
                      className={`inline-block bg-blue-600 text-white px-5 py-2 rounded-lg cursor-pointer hover:bg-blue-700 ${
                        uploading
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      {uploading
                        ? "Uploading..."
                        : "📷 Upload Photo"}
                    </label>

                    <input
                      id={`photo-${event.id}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) =>
                        handleUpload(
                          event.id,
                          e.target.files[0]
                        )
                      }
                    />
                  </div>

                  {/* Photo Gallery */}
                  <div className="mt-6">
                    <h5 className="text-lg font-semibold text-gray-800 mb-3">
                      📸 Photo Gallery
                    </h5>

                    {!photos[event.id] ||
                    photos[event.id].length === 0 ? (
                      <p className="text-gray-500 text-sm">
                        No photos uploaded yet.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {photos[event.id].map((photo) => (
                          <img
                            key={photo.id}
                            src={photo.imageUrl}
                            alt={photo.fileName}
                            className="w-full h-40 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default TeamDashboard;