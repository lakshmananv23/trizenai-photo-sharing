import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-6">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-lg text-center">

        <div className="text-5xl mb-4">
          📸
        </div>

        <h1 className="text-3xl font-bold text-gray-800">
          TrizenAI Photo Sharing
        </h1>

        <p className="text-gray-500 mt-3">
          Securely share and access your event photos.
        </p>

        <div className="mt-8 space-y-4">

          <button
            onClick={() => navigate("/login")}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
          >
            👤 Admin / Team Login
          </button>

          <button
            onClick={() => navigate("/gallery")}
            className="w-full bg-gray-800 text-white py-3 rounded-lg hover:bg-gray-900"
          >
            📷 Customer Gallery
          </button>

        </div>

        <p className="text-sm text-gray-400 mt-6">
          Customers can access their photos using their Event PIN.
        </p>

      </div>
    </div>
  );
}

export default Home;