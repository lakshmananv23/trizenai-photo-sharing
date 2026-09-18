import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { createEvent } from "../services/eventService";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";

function CreateEvent() {
  const navigate = useNavigate();

  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [pin, setPin] = useState("");

  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedTeamMember, setSelectedTeamMember] = useState("");

  const [message, setMessage] = useState("");

  // Load team members
  useEffect(() => {
    const loadTeamMembers = async () => {
      try {
        const snapshot = await getDocs(collection(db, "users"));

        const members = snapshot.docs
          .map((document) => ({
            id: document.id,
            ...document.data(),
          }))
          .filter((user) => user.role === "TEAM_MEMBER");

        setTeamMembers(members);

      } catch (error) {
        console.error("Error loading team members:", error);
      }
    };

    loadTeamMembers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const selectedMember = teamMembers.find(
        (member) => member.id === selectedTeamMember
      );

      await createEvent({
        eventName,
        eventDate,
        customerName,
        pin,

        teamMemberId: selectedTeamMember,

        teamMemberName: selectedMember
          ? selectedMember.name
          : "",

        teamMemberEmail: selectedMember
          ? selectedMember.email
          : "",
      });

      setMessage("Event created successfully!");

      setEventName("");
      setEventDate("");
      setCustomerName("");
      setPin("");
      setSelectedTeamMember("");

    } catch (error) {
      console.error(error);
      setMessage("Failed to create event.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      <div className="max-w-2xl mx-auto">

        <button
          onClick={() => navigate("/admin")}
          className="mb-6 text-blue-600 hover:underline"
        >
          ← Back to Dashboard
        </button>

        <div className="bg-white p-8 rounded-2xl shadow">

          <h1 className="text-3xl font-bold text-gray-800">
            Create New Event
          </h1>

          <p className="text-gray-500 mt-2">
            Create an event and assign a team member.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >

            {/* Event Name */}
            <div>
              <label className="block mb-2 font-medium">
                Event Name
              </label>

              <input
                type="text"
                placeholder="Example: Wedding"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg"
                required
              />
            </div>

            {/* Event Date */}
            <div>
              <label className="block mb-2 font-medium">
                Event Date
              </label>

              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg"
                required
              />
            </div>

            {/* Customer */}
            <div>
              <label className="block mb-2 font-medium">
                Customer Name
              </label>

              <input
                type="text"
                placeholder="Customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg"
                required
              />
            </div>

            {/* PIN */}
            <div>
              <label className="block mb-2 font-medium">
                Gallery PIN
              </label>

              <input
                type="text"
                inputMode="numeric"
                maxLength="6"
                placeholder="6-digit PIN"
                value={pin}
                onChange={(e) =>
                  setPin(e.target.value.replace(/\D/g, ""))
                }
                className="w-full border border-gray-300 p-3 rounded-lg"
                required
              />
            </div>

            {/* Team Member */}
            <div>
              <label className="block mb-2 font-medium">
                Assign Team Member
              </label>

              <select
                value={selectedTeamMember}
                onChange={(e) =>
                  setSelectedTeamMember(e.target.value)
                }
                className="w-full border border-gray-300 p-3 rounded-lg"
                required
              >
                <option value="">
                  Select a team member
                </option>

                {teamMembers.map((member) => (
                  <option
                    key={member.id}
                    value={member.id}
                  >
                    {member.name} — {member.email}
                  </option>
                ))}
              </select>

              {teamMembers.length === 0 && (
                <p className="text-sm text-red-500 mt-2">
                  No team members found.
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700"
            >
              Create Event
            </button>

          </form>

          {message && (
            <p className="mt-5 text-center text-green-600 font-medium">
              {message}
            </p>
          )}

        </div>

      </div>

    </div>
  );
}

export default CreateEvent;