import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db, auth } from "../firebase/config";
import { logoutUser } from "../services/authService";
import {
  getEvents,
  deleteEvent,
} from "../services/eventService";

function AdminDashboard() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");

  const [totalEvents, setTotalEvents] = useState(0);
  const [teamMembers, setTeamMembers] = useState(0);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [events, setEvents] = useState([]);
  const [teamMemberList, setTeamMemberList] = useState([]);

  // Add Team Member form
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberPassword, setMemberPassword] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [memberMessage, setMemberMessage] = useState("");

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Get events
        const allEvents = await getEvents();

        setTotalEvents(allEvents.length);
        setEvents(allEvents);

        // Get team members
        const usersSnapshot = await getDocs(
          collection(db, "users")
        );

        const members = usersSnapshot.docs
          .map((document) => ({
            id: document.id,
            ...document.data(),
          }))
          .filter(
            (user) => user.role === "TEAM_MEMBER"
          );

        setTeamMembers(members.length);
        setTeamMemberList(members);

        // Get photos
        const photosSnapshot = await getDocs(
          collection(db, "photos")
        );

        setTotalPhotos(photosSnapshot.size);
      } catch (error) {
        console.error(
          "Error loading dashboard data:",
          error
        );
      }
    };

    loadDashboardData();
  }, []);

  // Delete Event
  const handleDeleteEvent = async (eventId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this event?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteEvent(eventId);

      setEvents((previousEvents) =>
        previousEvents.filter(
          (event) => event.id !== eventId
        )
      );

      setTotalEvents(
        (previousTotal) => previousTotal - 1
      );
    } catch (error) {
      console.error(
        "Delete event error:",
        error
      );

      alert("Failed to delete event ❌");
    }
  };

  // Add Team Member
  const handleAddTeamMember = async (e) => {
    e.preventDefault();

    if (
      !memberName.trim() ||
      !memberEmail.trim() ||
      !memberPassword.trim()
    ) {
      setMemberMessage(
        "Please fill in all fields."
      );
      return;
    }

    if (memberPassword.length < 6) {
      setMemberMessage(
        "Password must contain at least 6 characters."
      );
      return;
    }

    try {
      setAddingMember(true);
      setMemberMessage("");

      // Get Firebase API key
      const apiKey = auth.app.options.apiKey;

      // Create Firebase Authentication account
      // without changing the Admin login session
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: memberEmail.trim(),
            password: memberPassword,
            returnSecureToken: true,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (
          data.error?.message ===
          "EMAIL_EXISTS"
        ) {
          throw new Error(
            "This email is already registered."
          );
        }

        if (
          data.error?.message ===
          "INVALID_EMAIL"
        ) {
          throw new Error(
            "Please enter a valid email address."
          );
        }

        throw new Error(
          data.error?.message ||
            "Failed to create account."
        );
      }

      const userId = data.localId;

      // Create Firestore user document
      await setDoc(
        doc(db, "users", userId),
        {
          name: memberName.trim(),
          email: memberEmail.trim(),
          role: "TEAM_MEMBER",
          createdAt: serverTimestamp(),
        }
      );

      // Add member to screen immediately
      const newMember = {
        id: userId,
        name: memberName.trim(),
        email: memberEmail.trim(),
        role: "TEAM_MEMBER",
      };

      setTeamMemberList((previousMembers) => [
        ...previousMembers,
        newMember,
      ]);

      setTeamMembers(
        (previousTotal) => previousTotal + 1
      );

      // Clear form
      setMemberName("");
      setMemberEmail("");
      setMemberPassword("");

      setMemberMessage(
        "Team member created successfully! ✅"
      );

    } catch (error) {
      console.error(
        "Add team member error:",
        error
      );

      setMemberMessage(
        error.message ||
          "Failed to create team member ❌"
      );
    } finally {
      setAddingMember(false);
    }
  };

  // Remove Team Member
  const handleRemoveTeamMember = async (
    memberId,
    memberName
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove ${
        memberName || "this team member"
      }?`
    );

    if (!confirmed) {
      return;
    }

    try {
      // Remove user from Firestore
      await deleteDoc(
        doc(db, "users", memberId)
      );

      // Remove member from screen
      setTeamMemberList((previousMembers) =>
        previousMembers.filter(
          (member) => member.id !== memberId
        )
      );

      // Update team member count
      setTeamMembers(
        (previousTotal) => previousTotal - 1
      );

      alert(
        "Team member removed successfully! ✅"
      );

    } catch (error) {
      console.error(
        "Remove team member error:",
        error
      );

      alert(
        "Failed to remove team member ❌"
      );
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await logoutUser();
      window.location.href = "/login";
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              TrizenAI Photo Sharing
            </h1>

            <p className="text-sm text-gray-500">
              Admin Dashboard
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

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-8">

        <h2 className="text-3xl font-bold text-gray-800">
          Welcome, Admin 👋
        </h2>

        <p className="text-gray-500 mt-2">
          Manage events, team members and photo galleries.
        </p>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">

          {/* Total Events */}
          <div className="bg-white p-6 rounded-xl shadow">
            <p className="text-gray-500">
              Total Events
            </p>

            <h3 className="text-3xl font-bold mt-2 text-blue-600">
              {totalEvents}
            </h3>
          </div>

          {/* Team Members */}
          <div className="bg-white p-6 rounded-xl shadow">
            <p className="text-gray-500">
              Team Members
            </p>

            <h3 className="text-3xl font-bold mt-2 text-green-600">
              {teamMembers}
            </h3>
          </div>

          {/* Photos */}
          <div className="bg-white p-6 rounded-xl shadow">
            <p className="text-gray-500">
              Photos
            </p>

            <h3 className="text-3xl font-bold mt-2 text-purple-600">
              {totalPhotos}
            </h3>
          </div>

        </div>

        {/* Tabs */}
        <div className="bg-white mt-8 rounded-xl shadow">

          <div className="border-b flex flex-wrap">

            {/* Overview */}
            <button
              onClick={() =>
                setActiveTab("overview")
              }
              className={`px-6 py-4 ${
                activeTab === "overview"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500"
              }`}
            >
              Overview
            </button>

            {/* Events */}
            <button
              onClick={() =>
                setActiveTab("events")
              }
              className={`px-6 py-4 ${
                activeTab === "events"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500"
              }`}
            >
              Events
            </button>

            {/* Team */}
            <button
              onClick={() =>
                setActiveTab("team")
              }
              className={`px-6 py-4 ${
                activeTab === "team"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500"
              }`}
            >
              Team
            </button>

          </div>

          <div className="p-8">

            {/* Overview */}
            {activeTab === "overview" && (
              <div>

                <h3 className="text-xl font-semibold">
                  Dashboard Overview
                </h3>

                <p className="text-gray-500 mt-2">
                  You currently have{" "}
                  <strong>{totalEvents}</strong>{" "}
                  events,{" "}
                  <strong>{teamMembers}</strong>{" "}
                  team members and{" "}
                  <strong>{totalPhotos}</strong>{" "}
                  photos.
                </p>

              </div>
            )}

            {/* Events */}
            {activeTab === "events" && (
              <div>

                <div className="flex justify-between items-center">

                  <div>
                    <h3 className="text-xl font-semibold">
                      Event Management
                    </h3>

                    <p className="text-gray-500 mt-1">
                      Create and manage photography events.
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      navigate(
                        "/admin/create-event"
                      )
                    }
                    className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
                  >
                    + Create Event
                  </button>

                </div>

                {/* Event List */}
                <div className="mt-6 space-y-4">

                  {events.length === 0 ? (

                    <div className="bg-gray-50 p-6 rounded-lg">
                      <p className="text-gray-500">
                        No events found.
                      </p>
                    </div>

                  ) : (

                    events.map((event) => (

                      <div
                        key={event.id}
                        className="border rounded-lg p-5"
                      >

                        <h4 className="text-lg font-bold text-gray-800">
                          {event.eventName}
                        </h4>

                        <p className="text-gray-600 mt-1">
                          Customer:{" "}
                          {event.customerName}
                        </p>

                        <p className="text-gray-600">
                          Date: {event.eventDate}
                        </p>

                        <p className="text-gray-600">
                          Team Member:{" "}
                          {event.teamMemberName ||
                            "Not assigned"}
                        </p>

                        <p className="text-gray-600">
                          PIN: {event.pin}
                        </p>

                        <div className="mt-4">

                          <button
                            onClick={() =>
                              handleDeleteEvent(
                                event.id
                              )
                            }
                            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                          >
                            🗑️ Delete Event
                          </button>

                        </div>

                      </div>

                    ))

                  )}

                </div>

              </div>
            )}

            {/* Team */}
            {activeTab === "team" && (
              <div>

                {/* Team Header */}
                <div className="flex justify-between items-center">

                  <div>
                    <h3 className="text-xl font-semibold">
                      Team Management
                    </h3>

                    <p className="text-gray-500 mt-2">
                      Manage your registered team members and
                      their assigned events.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setShowAddMember(
                        !showAddMember
                      );
                      setMemberMessage("");
                    }}
                    className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
                  >
                    {showAddMember
                      ? "✕ Cancel"
                      : "+ Add Team Member"}
                  </button>

                </div>

                {/* Add Team Member Form */}
                {showAddMember && (
                  <div className="mt-6 bg-gray-50 border rounded-xl p-6">

                    <h4 className="text-xl font-semibold text-gray-800">
                      Add New Team Member
                    </h4>

                    <p className="text-gray-500 mt-1">
                      Create a login account for a new team member.
                    </p>

                    <form
                      onSubmit={handleAddTeamMember}
                      className="mt-5 space-y-4"
                    >

                      {/* Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name
                        </label>

                        <input
                          type="text"
                          value={memberName}
                          onChange={(e) =>
                            setMemberName(
                              e.target.value
                            )
                          }
                          placeholder="Enter team member name"
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>

                        <input
                          type="email"
                          value={memberEmail}
                          onChange={(e) =>
                            setMemberEmail(
                              e.target.value
                            )
                          }
                          placeholder="Enter email address"
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Password */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Password
                        </label>

                        <input
                          type="password"
                          value={memberPassword}
                          onChange={(e) =>
                            setMemberPassword(
                              e.target.value
                            )
                          }
                          placeholder="Minimum 6 characters"
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Message */}
                      {memberMessage && (
                        <div
                          className={`p-3 rounded-lg ${
                            memberMessage.includes(
                              "successfully"
                            )
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {memberMessage}
                        </div>
                      )}

                      {/* Submit */}
                      <button
                        type="submit"
                        disabled={addingMember}
                        className="bg-green-600 text-white px-5 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        {addingMember
                          ? "Creating..."
                          : "➕ Create Team Member"}
                      </button>

                    </form>

                  </div>
                )}

                {/* Team Members */}
                <div className="mt-6 space-y-4">

                  {teamMemberList.length === 0 ? (

                    <div className="bg-gray-50 p-6 rounded-lg">
                      <p className="text-gray-500">
                        No team members found.
                      </p>
                    </div>

                  ) : (

                    teamMemberList.map((member) => {

                      const assignedEvents =
                        events.filter(
                          (event) =>
                            event.teamMemberId ===
                            member.id
                        );

                      return (
                        <div
                          key={member.id}
                          className="border rounded-xl p-5 bg-white"
                        >

                          {/* Member Details */}
                          <div className="flex justify-between items-start">

                            <div>

                              <h4 className="text-lg font-bold text-gray-800">
                                👤{" "}
                                {member.name ||
                                  "Team Member"}
                              </h4>

                              <p className="text-gray-600 mt-1">
                                📧 {member.email}
                              </p>

                              <p className="text-gray-500 mt-1">
                                🏷️ {member.role}
                              </p>

                            </div>

                            {/* Assigned Event Count */}
                            <div className="text-right">

                              <p className="text-sm text-gray-500">
                                Assigned Events
                              </p>

                              <p className="text-2xl font-bold text-blue-600">
                                {assignedEvents.length}
                              </p>

                            </div>

                          </div>

                          {/* Assigned Events */}
                          {assignedEvents.length > 0 && (
                            <div className="mt-5">

                              <h5 className="font-semibold text-gray-700 mb-2">
                                📅 Events
                              </h5>

                              <div className="space-y-2">

                                {assignedEvents.map(
                                  (event) => (
                                    <div
                                      key={event.id}
                                      className="bg-gray-50 p-3 rounded-lg"
                                    >

                                      <p className="font-medium text-gray-800">
                                        {event.eventName}
                                      </p>

                                      <p className="text-sm text-gray-500">
                                        {event.eventDate}{" "}
                                        •{" "}
                                        {
                                          event.customerName
                                        }
                                      </p>

                                    </div>
                                  )
                                )}

                              </div>

                            </div>
                          )}

                          {/* No Events */}
                          {assignedEvents.length === 0 && (
                            <p className="mt-5 text-sm text-gray-400">
                              No events assigned.
                            </p>
                          )}

                          {/* Remove Team Member */}
                          <div className="mt-5 pt-4 border-t">

                            <button
                              onClick={() =>
                                handleRemoveTeamMember(
                                  member.id,
                                  member.name
                                )
                              }
                              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                            >
                              🗑️ Remove Team Member
                            </button>

                          </div>

                        </div>
                      );
                    })

                  )}

                </div>

              </div>
            )}

          </div>

        </div>

      </main>

    </div>
  );
}

export default AdminDashboard;