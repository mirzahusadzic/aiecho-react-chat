import React, { useEffect, useState, useMemo, useRef } from 'react';
import ChatRenderer from './chatRenderer.jsx';
import SidebarTOC from './SidebarTOC.jsx';
import { loadChatJSON } from './utils/loadJson.js';

export default function App() {
  const [chunks, setChunks] = useState([]);
  const [expandThinking, setExpandThinking] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [animationsPaused, setAnimationsPaused] = useState(true); // New state for animations
  const [chatListRef, setChatListRef] = useState(null);
  const [scrollTargetIndex, setScrollTargetIndex] = useState(null);
  const [fileName, setFileName] = useState(''); // New state for file name

  useEffect(() => {
    // Load default JSON on initial mount
    loadChatJSON('/How_Can_I_Help_You.json')
       .then(setChunks)
       .catch(err => console.error('Failed to load chat JSON', err));

    // Handle initial URL hash for scrolling
    const handleInitialHashScroll = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#msg')) {
        const msgIndex = parseInt(hash.substring(4), 10);
        if (!isNaN(msgIndex)) {
          setScrollTargetIndex(msgIndex-1);
          console.log('App.jsx: Initial hash scroll target index:', msgIndex);
        }
      }
    };

    handleInitialHashScroll();

    window.addEventListener('hashchange', handleInitialHashScroll);

    return () => {
      window.removeEventListener('hashchange', handleInitialHashScroll);
    };
  }, []);

  const { conversationTurns, originalIndexToTurnIndexMap } = useMemo(() => {
    if (!Array.isArray(chunks)) {
      return { conversationTurns: [], originalIndexToTurnIndexMap: {} };
    }
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

  // Effect to perform the scroll once chatListRef and conversationTurns are ready
  useEffect(() => {
    if (chatListRef && chatListRef.current && conversationTurns.length > 0 && scrollTargetIndex !== null) {
      chatListRef.current.scrollToItem(scrollTargetIndex, "start"); // Corrected access
    }
  }, [chatListRef, conversationTurns, scrollTargetIndex]); // Removed setScrollTargetIndex from dependencies

  const handleScrollComplete = React.useCallback(() => {
    setScrollTargetIndex(null);
  }, []);

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
        scrollTargetIndex={scrollTargetIndex}
        setScrollTargetIndex={setScrollTargetIndex}
        expandThinking={expandThinking}
        setExpandThinking={setExpandThinking}
        animationsPaused={animationsPaused}
        setAnimationsPaused={setAnimationsPaused}
        setChunks={setChunks} // Pass setChunks to SidebarTOC
        setFileName={setFileName} // Pass setFileName to SidebarTOC
        fileName={fileName} // Pass fileName to SidebarTOC
      />
      <div className={`main-content ${isSidebarOpen ? '' : 'sidebar-closed'}`}> {/* Apply ref and class */}
        <div className="app-header-title">
          The Architect in the Echo:{fileName ? <span className="file-name-display"> {fileName}</span> : ''}
        </div>
        {conversationTurns.length > 0 ? (
          <ChatRenderer
            key={conversationTurns.length} // Force re-mount on data change
            conversationTurns={conversationTurns}
            expandThinking={expandThinking}
            animationsEnabled={!animationsPaused} // Pass animationsEnabled prop
            onListRef={setChatListRef}
            scrollTargetIndex={scrollTargetIndex}
            onScrollComplete={handleScrollComplete}
          />
        ) : (
          <p>Loading chat...</p>
        )}
      </div>
    </div>
  );
}
