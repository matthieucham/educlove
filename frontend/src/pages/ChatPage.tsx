import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { Card, Avatar, Badge } from '../components/ui';

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
          <Link to="/profiles" className="text-gray-600 hover:text-purple-600 font-semibold text-sm">
            ← Retour
          </Link>
        </div>
      </div>

      <Card className="max-w-2xl w-full p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Conversations</h1>
        <div className="space-y-3">
          {chats.map((chat) => (
            <Card
              key={chat.id}
              variant="bordered"
              className="p-4 cursor-pointer hover:bg-purple-50 hover:border-purple-300 transition duration-200"
              onClick={() => alert(`Opening chat with ${chat.name}`)}
            >
              <div className="flex items-center">
                <div className="relative">
                  <Avatar
                    src={chat.avatar}
                    alt={chat.name}
                    size="lg"
                    className="mr-4"
                  />
                  {chat.unread > 0 && (
                    <Badge
                      variant="primary"
                      className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs rounded-full"
                    >
                      {chat.unread}
                    </Badge>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h2 className="text-lg font-semibold text-gray-800">{chat.name}</h2>
                    <Badge variant="secondary" className="text-xs">
                      {chat.time}
                    </Badge>
                  </div>
                  <p className={`text-sm mt-1 ${chat.unread > 0 ? 'text-gray-800 font-medium' : 'text-gray-600'}`}>
                    {chat.lastMessage}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
        {chats.length === 0 && (
          <Card variant="bordered" className="text-center py-12 bg-gray-50">
            <p className="text-gray-600">Aucune conversation pour le moment</p>
            <p className="text-sm text-gray-500 mt-2">Commencez à matcher pour démarrer des conversations !</p>
          </Card>
        )}
      </Card>
    </div>
  );
};

export default ChatPage;
