import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('https://chat-backend-vacz.onrender.com');

function App() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    const name = prompt('Enter your username:');
    setUsername(name);
    socket.emit('setUsername', name);

    socket.on('receiveMessage', (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on('userTyping', (name) => {
      setIsTyping(name);
      setTimeout(() => setIsTyping(false), 1000);
    });

    socket.on('updateUsers', (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleSend = () => {
    if (message.trim()) {
      const newMessage = {
        sender: username,
        text: message,
        timestamp: new Date().toLocaleTimeString(),
      };
      socket.emit('sendMessage', newMessage);
      setMessages((prev) => [...prev, newMessage]);
      setMessage('');
    }
  };

  const handleTyping = () => {
    socket.emit('typing', username);
  };

  return (
    <div className="chat-app">
      <h1>🚀 Real-Time Chat App</h1>
      <div className="users-online">
        <strong>Online:</strong> {onlineUsers.join(', ')}
      </div>

      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.sender}:</strong> {msg.text} <small>{msg.timestamp}</small>
          </div>
        ))}
        {isTyping && <p><em>{isTyping} is typing...</em></p>}
      </div>

      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleTyping}
        placeholder="Type a message..."
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}

export default App;
