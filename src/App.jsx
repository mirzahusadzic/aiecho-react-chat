import React, { useEffect, useState, useMemo } from 'react';
import ChatRenderer from './chatRenderer.jsx';
import SidebarTOC from './SidebarTOC.jsx';
import { loadChatJSON } from './utils/loadJson.js';

export default function App() {
  const [chunks, setChunks] = useState([]);
  const [expandThinking, setExpandThinking] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [animationsPaused, setAnimationsPaused] = useState(true); // New state for animations
  const [chatListRef, setChatListRef] = useState(null);
  const pendingScrollToIndex = React.useRef(null);
  const [jsonFilePath, setJsonFilePath] = useState('/How_Can_I_Help_You.json'); // New state for JSON file path

  const handleLoadJson = () => {
    loadChatJSON(jsonFilePath)
      .then(setChunks)
      .catch(err => console.error('Failed to load chat JSON', err));
  };

  useEffect(() => {
    handleLoadJson(); // Load initial JSON or when path changes
  }, [jsonFilePath]); // Depend on jsonFilePath

  const { conversationTurns, originalIndexToTurnIndexMap } = useMemo(() => {
    const validChunks = chunks.filter(chunk => chunk?.role);
    const turns = [];
    const newMap = {};
    let i = 0;
    let turnIndex = 0;
    while (i < validChunks.length) {
      const turn = { userMessage: null, thinkingMessage: null, geminiMessage: null, grounding: null };
      const startingValidChunkIndex = i;

      if (validChunks[i].role?.toLowerCase() === 'user') {
        turn.userMessage = validChunks[i];
        i++;
      }
      if (i < validChunks.length && validChunks[i].role?.toLowerCase() === 'model' && validChunks[i].isThought) {
        turn.thinkingMessage = validChunks[i];
        i++;
      }
      if (i < validChunks.length && validChunks[i].role?.toLowerCase() === 'model' && !validChunks[i].isThought) {
        turn.geminiMessage = validChunks[i];
        turn.grounding = validChunks[i].grounding;
        i++;
      }

      if (turn.userMessage || turn.thinkingMessage || turn.geminiMessage) {
        turns.push(turn);
        // Map all original indices that are part of this turn to the current turnIndex
        for (let j = startingValidChunkIndex; j < i; j++) {
          const originalIndex = chunks.indexOf(validChunks[j]);
          if (originalIndex !== -1) {
            newMap[originalIndex] = turnIndex;
          }
        }
        turnIndex++;
      }
    }
    return { conversationTurns: turns, originalIndexToTurnIndexMap: newMap };
  }, [chunks]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="app-layout"> {/* New layout container */}
      <SidebarTOC
        chunks={chunks}
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        chatListRef={chatListRef}
        originalIndexToValidIndexMap={originalIndexToTurnIndexMap}
        pendingScrollToIndex={pendingScrollToIndex}
        expandThinking={expandThinking}
        setExpandThinking={setExpandThinking}
        animationsPaused={animationsPaused}
        setAnimationsPaused={setAnimationsPaused}
      />
      <div className={`main-content ${isSidebarOpen ? '' : 'sidebar-closed'}`}> {/* Apply ref and class */}
        <div style={{ marginBottom: '1em' }}>
          <input
            type="text"
            value={jsonFilePath}
            onChange={(e) => setJsonFilePath(e.target.value)}
            placeholder="Enter JSON file path (e.g., /path/to/file.json)"
            style={{ width: '300px', marginRight: '10px', padding: '5px' }}
          />
          <button onClick={handleLoadJson} style={{ padding: '5px 10px' }}>Load JSON</button>
        </div>

        {conversationTurns.length > 0 ? (
          <ChatRenderer
            key={conversationTurns.length} // Force re-mount on data change
            conversationTurns={conversationTurns}
            expandThinking={expandThinking}
            animationsEnabled={!animationsPaused} // Pass animationsEnabled prop
            onListRef={setChatListRef}
            pendingScrollToIndex={pendingScrollToIndex}
          />
        ) : (
          <p>Loading chat...</p>
        )}
      </div>
    </div>
  );
}
