import React from 'react';
import { Card, Avatar, Badge } from '../components/ui';

const MessagesPage: React.FC = () => {
  // Placeholder data for messages
  const messages = [
    { id: 1, name: 'Alice', lastMessage: 'Salut, comment ça va ?', time: 'Il y a 2h', unread: true, avatar: 'https://randomuser.me/api/portraits/women/1.jpg' },
    { id: 2, name: 'Bob', lastMessage: 'On se voit demain.', time: 'Hier', unread: false, avatar: 'https://randomuser.me/api/portraits/men/2.jpg' },
    { id: 3, name: 'Sophie', lastMessage: 'Merci pour le café !', time: 'Lun', unread: false, avatar: 'https://randomuser.me/api/portraits/women/3.jpg' },
  ];

  return (
    <div>
      <div className="space-y-3">
        {messages.map((message) => (
          <Card
            key={message.id}
            variant="bordered"
            className="p-4 cursor-pointer hover:bg-purple-50 hover:border-purple-300 transition duration-200"
            onClick={() => alert(`Ouverture du chat avec ${message.name}`)}
          >
            <div className="flex items-center">
              <Avatar
                src={message.avatar}
                alt={message.name}
                size="md"
                className="mr-4"
              />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h2 className="text-lg font-semibold text-gray-800">{message.name}</h2>
                  <Badge variant="secondary" className="text-xs">
                    {message.time}
                  </Badge>
                </div>
                <p className={`text-sm mt-1 ${message.unread ? 'text-gray-800 font-medium' : 'text-gray-600'}`}>
                  {message.lastMessage}
                </p>
              </div>
              {message.unread && (
                <div
                  className="w-2 h-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full ml-2"
                  aria-label="Unread"
                />
              )}
            </div>
          </Card>
        ))}
      </div>
      {messages.length === 0 && (
        <Card variant="bordered" className="text-center py-8 bg-gray-50">
          <p className="text-gray-600">Aucun message pour le moment</p>
          <p className="text-sm text-gray-500 mt-2">Commencez à matcher pour démarrer des conversations !</p>
        </Card>
      )}
    </div>
  );
};

export default MessagesPage;
