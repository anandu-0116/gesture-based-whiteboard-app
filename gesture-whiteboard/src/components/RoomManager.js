import React, { useState } from 'react';
import { 
  getDatabase, 
  ref, 
  push, 
  set, 
  get, 
  update,
  serverTimestamp 
} from 'firebase/database';
import { db } from '../firebase';

function RoomManager({ onJoinRoom }) {
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const createRoom = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const roomRef = push(ref(db, 'rooms'));
      
      // Use the auto-generated key as the room code
      const generatedRoomCode = roomRef.key;

      // Create a unique user ID
      const userId = `user_${Math.random().toString(36).substr(2, 9)}`;
      
      await set(roomRef, {
        createdAt: serverTimestamp(),
        drawingData: null, // Initialize as null instead of empty array
        participants: {
          [userId]: {
            joinedAt: serverTimestamp(),
            index: 0 // Add participant index
          }
        },
        lastActive: serverTimestamp(),
        participantCount: 1 // Add participant counter
      });
      
      // Small delay to ensure UI updates
      setTimeout(() => {
        onJoinRoom(generatedRoomCode, userId);
        setIsLoading(false);
      }, 500);
    } catch (err) {
      console.error('Room creation error:', err);
      setError('Failed to create room. Please try again.');
      setIsLoading(false);
    }
  };

  const joinRoom = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!roomCode.trim()) {
        setError('Please enter a room code');
        setIsLoading(false);
        return;
      }

      const roomRef = ref(db, `rooms/${roomCode}`);
      
      // Check if room exists
      const snapshot = await get(roomRef);
      
      if (snapshot.exists()) {
        const roomData = snapshot.val();
        const userId = `user_${Math.random().toString(36).substr(2, 9)}`;
        const newParticipantIndex = roomData.participantCount || 0;
        await update(roomRef, {
            participants: {
              ...roomData.participants,
              [userId]: {
                joinedAt: serverTimestamp(),
                index: newParticipantIndex
              }
            },
            participantCount: newParticipantIndex + 1,
            lastActive: serverTimestamp()
          });
        
        // Small delay to ensure UI updates
        setTimeout(() => {
          onJoinRoom(roomCode, userId);
          setIsLoading(false);
        }, 500);
      } else {
        setError('Room does not exist');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Room join error:', err);
      setError('Failed to join room. Please check the code and try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="room-manager" style={{
      maxWidth: '400px',
      margin: '0 auto',
      padding: '20px',
      textAlign: 'center',
      backgroundColor: '#f0f0f0',
      borderRadius: '10px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <h2>Collaborative Whiteboard</h2>
      
      {error && (
        <div style={{ 
          color: 'red', 
          marginBottom: '15px', 
          padding: '10px', 
          backgroundColor: '#ffeeee',
          borderRadius: '5px'
        }}>
          {error}
        </div>
      )}
      
      {isLoading && (
        <div style={{ 
          color: '#333', 
          marginBottom: '15px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            width: '30px',
            height: '30px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <span style={{ marginLeft: '10px' }}>Loading...</span>
        </div>
      )}
      
      <div className="room-controls" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
      }}>
        <button 
          onClick={createRoom} 
          disabled={isLoading}
          style={{
            padding: '10px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.5 : 1
          }}
        >
          Create New Room
        </button>
        
        <div style={{ 
          display: 'flex', 
          gap: '10px' 
        }}>
          <input 
            type="text" 
            placeholder="Enter Room Code" 
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ddd'
            }}
          />
          <button 
            onClick={joinRoom} 
            disabled={isLoading}
            style={{
              padding: '10px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1
            }}
          >
            Join Room
          </button>
        </div>
      </div>

      {/* Add a global style for spin animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default RoomManager;