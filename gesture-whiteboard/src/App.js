import React, { useState } from 'react';
import HandTracker from './components/HandTracker';
import WhiteBoard from './components/WhiteBoard';
import RoomManager from './components/RoomManager';

function App() {
  const [roomCode, setRoomCode] = useState(null);
  const [userId, setUserId] = useState(null);
  const [handData, setHandData] = useState(null);

  const handleJoinRoom = (code, id) => {
    setRoomCode(code);
    setUserId(id);
  };

  const handleLeaveRoom = () => {
    setRoomCode(null);
    setUserId(null);
  };

  const handleHandData = (data) => {
    setHandData(data);
  };

  return (
    <div className="App" style={{
      fontFamily: 'Arial, sans-serif',
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '20px',
      textAlign: 'center'
    }}>
      <h1 style={{ 
        color: '#333',
        marginBottom: '20px'
      }}>
        Gesture-Based Virtual Whiteboard
      </h1>
      
      {!roomCode ? (
        <RoomManager onJoinRoom={handleJoinRoom} />
      ) : (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2>Room Code: {roomCode}</h2>
            <button 
              onClick={handleLeaveRoom}
              style={{
                padding: '8px 15px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Leave Room
            </button>
          </div>
          
          <HandTracker onHandData={handleHandData} />
          
        </div>
      )}
    </div>
  );
}

export default App;