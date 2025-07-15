// Add to imports
import { io } from 'socket.io-client';
import { useEffect, useState } from 'react';
import './App.css';

// ✅ LIVE backend (not localhost)
const socket = io('https://chat-backend-vacz.onrender.com');

function App() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [activeChat, setActiveChat] = useState('Global');
  const [messages, setMessages] = useState({ Global: [] });
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const [file, setFile] = useState(null);

  useEffect(() => {
    const name = prompt('Enter your username:');
    setUsername(name || 'Anonymous');
    socket.emit('setUsername', name || 'Anonymous');

    socket.on('receiveMessage', (msg) => {
      setMessages((prev) => ({
        ...prev,
        Global: [...(prev.Global || []), msg],
      }));
    });

    socket.on('privateMessage', (msg) => {
      const sender = msg.sender;
      setMessages((prev) => ({
        ...prev,
        [sender]: [...(prev[sender] || []), msg],
      }));
    });

    socket.on('userTyping', (name) => {
      setTypingUser(name);
      setTimeout(() => setTypingUser(null), 2000);
    });

    socket.on('updateUsers', (users) => {
      const filtered = users.filter((u) => u !== name);
      setOnlineUsers(filtered);
    });

    return () => {
      socket.off('receiveMessage');
      socket.off('privateMessage');
      socket.off('userTyping');
      socket.off('updateUsers');
    };
  }, []);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFile({
          name: selected.name,
          type: selected.type,
          data: reader.result, // base64
        });
      };
      reader.readAsDataURL(selected);
    }
  };

  const sendMessage = () => {
    if (!message.trim() && !file) return;

    const newMsg = {
      sender: username,
      text: message || '',
      timestamp: new Date().toLocaleTimeString(),
      file: file || null,
    };

    if (activeChat === 'Global') {
      socket.emit('sendMessage', newMsg);
      setMessages((prev) => ({
        ...prev,
        Global: [...(prev.Global || []), newMsg],
      }));
    } else {
      socket.emit('sendPrivateMessage', {
        recipient: activeChat,
        message: newMsg,
      });
      setMessages((prev) => ({
        ...prev,
        [activeChat]: [...(prev[activeChat] || []), newMsg],
      }));
    }

    setMessage('');
    setFile(null);
  };

  return (
    <div className="chat-container">
      <h1>💬 Real-Time Chat</h1>
      <p className="logged-in">Logged in as: <strong>{username}</strong></p>

      <div className="sidebar">
        <h4>Chats</h4>
        <div
          className={`chat-tab ${activeChat === 'Global' ? 'active' : ''}`}
          onClick={() => setActiveChat('Global')}
        >
          🌐 Global
        </div>
        {onlineUsers.map((user, idx) => (
          <div
            key={idx}
            className={`chat-tab ${activeChat === user ? 'active' : ''}`}
            onClick={() => setActiveChat(user)}
          >
            👤 {user}
          </div>
        ))}
      </div>

      <div className="chat-area">
        <div className="chat-box">
          {(messages[activeChat] || []).map((msg, idx) => (
            <div className="message" key={idx}>
              <strong>[{msg.sender}]</strong>: {msg.text}
              <em> ({msg.timestamp})</em>
              {msg.file && (
                <div style={{ marginTop: '5px' }}>
                  {msg.file.type.startsWith('image') ? (
                    <img
                      src={msg.file.data}
                      alt="shared"
                      style={{ maxWidth: '200px', borderRadius: '6px' }}
                    />
                  ) : (
                    <a href={msg.file.data} download={msg.file.name}>
                      📎 {msg.file.name}
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {typingUser && activeChat === 'Global' && (
          <p className="typing-indicator">💬 {typingUser} is typing...</p>
        )}

        <div className="input-area">
          <input
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (activeChat === 'Global') {
                socket.emit('typing', username);
              }
            }}
            placeholder={`Message ${activeChat}...`}
          />
          <input type="file" onChange={handleFileChange} />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default App;
