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

  useEffect(() => {
    loadChatJSON('/How_Can_I_Help_You.json')
      .then(setChunks)
      .catch(err => console.error('Failed to load chat JSON', err));
  }, []);

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
