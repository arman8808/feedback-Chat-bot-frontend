import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import { useState } from 'react';
import ChatInterface from '../components/ChatInterface';


export default function Home() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const [showChat, setShowChat] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-6 bg-gray-100">
      <header className="w-full max-w-2xl flex justify-between items-center mb-8">
        <h2 className="text-xl">Welcome, {user?.name}</h2>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Logout
        </button>
      </header>

      {!showChat ? (
        <button
          onClick={() => setShowChat(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Start Chat
        </button>
      ) : (
        <div className="w-full max-w-2xl">
          <ChatInterface />
        </div>
      )}
    </div>
  );
}
