import React, { useEffect, useState } from 'react';
import ChatRenderer from './chatRenderer.jsx'; // Make sure .jsx is included

export default function App() {
  const [chunks, setChunks] = useState([]);
  const [expandThinking, setExpandThinking] = useState(false); // default false

  useEffect(() => {
    fetch('/How_Can_I_Help_You.json') // put your JSON in public/
      .then(res => res.json())
      .then(data => setChunks(data.chunkedPrompt?.chunks || []))
      .catch(err => console.error('Failed to load chat JSON', err));
  }, []);

  return (
    <div className="App">
      <label style={{ display: 'block', margin: '1em 0' }}>
        <input
          type="checkbox"
          checked={expandThinking}
          onChange={e => setExpandThinking(e.target.checked)}
        />{' '}
        Show Thoughts
      </label>

      {chunks.length > 0 ? (
        <ChatRenderer chunks={chunks} expandThinking={expandThinking} />
      ) : (
        <p>Loading chat...</p>
      )}
    </div>
  );
}
