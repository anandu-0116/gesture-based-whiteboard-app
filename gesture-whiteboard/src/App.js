import React from 'react';
import HandTracker from './components/HandTracker';
import WhiteBoard from './components/WhiteBoard';

function App() {
  return (
    <div className="App">
      <h1>Gesture-Based Virtual Whiteboard</h1>
      <HandTracker />
    </div>
  );
}

export default App;
