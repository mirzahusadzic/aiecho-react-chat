import React, { useEffect, useState } from 'react';
import ChatRenderer from './chatRenderer.jsx';
import SidebarTOC from './SidebarTOC.jsx';
import { loadChatJSON } from './utils/loadJson.js';

export default function App() {
  const [chunks, setChunks] = useState([]);
  const [expandThinking, setExpandThinking] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chatListRef, setChatListRef] = useState(null);
  const [originalIndexToValidIndexMap, setOriginalIndexToValidIndexMap] = useState({});

  useEffect(() => {
    loadChatJSON('/How_Can_I_Help_You.json')
      .then(data => {
        setChunks(data);
        const newMap = {};
        let validIdx = 0;
        data.forEach((chunk, originalIdx) => {
          if (chunk?.role) {
            newMap[originalIdx] = validIdx;
            validIdx++;
          }
        });
        setOriginalIndexToValidIndexMap(newMap);
        // console.log('App.jsx: originalIndexToValidIndexMap', newMap);
      })
      .catch(err => console.error('Failed to load chat JSON', err));
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const validChunks = React.useMemo(() => {
    const filtered = chunks.filter(chunk => chunk?.role);
    return filtered;
  }, [chunks]);

  return (
    <div className="app-layout"> {/* New layout container */}
      <SidebarTOC chunks={chunks} isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} chatListRef={chatListRef} originalIndexToValidIndexMap={originalIndexToValidIndexMap} />
      <div className={`main-content ${isSidebarOpen ? '' : 'sidebar-closed'}`}> {/* Apply ref and class */}
        <label style={{ display: 'block', margin: '1em 0' }}>
          <input
            type="checkbox"
            checked={expandThinking}
            onChange={e => setExpandThinking(e.target.checked)}
          />{' '}
          Show Thoughts
        </label>

        {validChunks.length > 0 ? (
          <ChatRenderer
            chunks={validChunks}
            expandThinking={expandThinking}
            onListRef={setChatListRef}
          />
        ) : (
          <p>Loading chat...</p>
        )}
      </div>
    </div>
  );
}
