import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

const ChatPage: React.FC = () => {
  // Placeholder data for chats
  const chats = [
    { id: 1, name: 'Alice', lastMessage: 'Hey, how are you?', time: 'Il y a 5 min', unread: 2, avatar: 'https://randomuser.me/api/portraits/women/1.jpg' },
    { id: 2, name: 'Bob', lastMessage: 'Let\'s catch up tomorrow.', time: 'Il y a 1h', unread: 0, avatar: 'https://randomuser.me/api/portraits/men/2.jpg' },
    { id: 3, name: 'Sophie', lastMessage: 'À bientôt !', time: 'Hier', unread: 0, avatar: 'https://randomuser.me/api/portraits/women/3.jpg' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex flex-col items-center p-4">
      {/* Header with Logo */}
      <div className="w-full max-w-2xl mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full p-2">
              <Logo size="medium" className="text-white" />
            </div>
            <h1 className="text-2xl font-bold ml-3 text-gray-800">EducLove</h1>
          </div>
          <Link to="/dashboard" className="text-gray-600 hover:text-purple-600 font-semibold text-sm">
            ← Retour
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-2xl w-full">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Conversations</h1>
        <div className="space-y-3">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-purple-50 hover:border-purple-300 transition duration-200 flex items-center"
              onClick={() => alert(`Opening chat with ${chat.name}`)}
            >
              <div className="relative">
                <img 
                  src={chat.avatar} 
                  alt={chat.name}
                  className="w-14 h-14 rounded-full mr-4 object-cover"
                />
                {chat.unread > 0 && (
                  <div className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {chat.unread}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h2 className="text-lg font-semibold text-gray-800">{chat.name}</h2>
                  <span className="text-xs text-gray-500">{chat.time}</span>
                </div>
                <p className={`text-sm mt-1 ${chat.unread > 0 ? 'text-gray-800 font-medium' : 'text-gray-600'}`}>
                  {chat.lastMessage}
                </p>
              </div>
            </div>
          ))}
        </div>
        {chats.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">Aucune conversation pour le moment</p>
            <p className="text-sm text-gray-500 mt-2">Commencez à matcher pour démarrer des conversations !</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
