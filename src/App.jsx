import React, { useEffect, useState, useMemo, lazy, Suspense } from "react";
const ChatRenderer = lazy(() => import("./components/chatRenderer.jsx"));
import SidebarTOC from "./components/SidebarTOC.jsx";
import { loadChatJSON } from "./utils/loadJson.js";
import "./styles/components/_app.css";

export default function App() {
  const [chunks, setChunks] = useState([]);
  const [expandThinking, setExpandThinking] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [chatListRef, setChatListRef] = useState(null);
  const [scrollTargetIndex, setScrollTargetIndex] = useState(null);
  const [fileName, setFileName] = useState(""); // New state for file name
  const [isMobile, setIsMobile] = useState(false);

  // Helper function to remove file extension
  const removeFileExtension = (name) => {
    const lastDotIndex = name.lastIndexOf(".");
    return lastDotIndex !== -1 ? name.substring(0, lastDotIndex) : name;
  };

  const displayedFileName = useMemo(
    () => removeFileExtension(fileName),
    [fileName],
  );

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile(); // Check on initial mount
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  useEffect(() => {
    // Collapse sidebar if on mobile
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    // Load default JSON on initial mount
    loadChatJSON("/Painters_And_Programmers.json")
      .then(setChunks)
      .catch((err) => console.error("Failed to load chat JSON", err));
    setFileName("Painters_And_Programmers.json");

    // Handle initial URL hash for scrolling
    const handleInitialHashScroll = () => {
      const hash = window.location.hash;
      if (hash.startsWith("#msg")) {
        const msgIndex = parseInt(hash.substring(4), 10);
        if (!isNaN(msgIndex)) {
          setScrollTargetIndex(msgIndex - 1);
          console.log("App.jsx: Initial hash scroll target index:", msgIndex);
        }
      }
    };

    handleInitialHashScroll();

    window.addEventListener("hashchange", handleInitialHashScroll);

    return () => {
      window.removeEventListener("hashchange", handleInitialHashScroll);
    };
  }, []);

  const { conversationTurns, originalIndexToTurnIndexMap } = useMemo(() => {
    if (!Array.isArray(chunks)) {
      return { conversationTurns: [], originalIndexToTurnIndexMap: {} };
    }
    const validChunks = chunks.filter((chunk) => chunk?.role);
    const turns = [];
    const newMap = {};
    let i = 0;
    let turnIndex = 0;
    while (i < validChunks.length) {
      const turn = {
        userMessage: null,
        thinkingMessage: null,
        geminiMessage: null,
        grounding: null,
      };
      const startingValidChunkIndex = i;

      if (validChunks[i].role?.toLowerCase() === "user") {
        turn.userMessage = validChunks[i];
        i++;
      }
      if (
        i < validChunks.length &&
        validChunks[i].role?.toLowerCase() === "model" &&
        validChunks[i].isThought
      ) {
        turn.thinkingMessage = validChunks[i];
        i++;
      }
      if (
        i < validChunks.length &&
        validChunks[i].role?.toLowerCase() === "model" &&
        !validChunks[i].isThought
      ) {
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
    if (
      chatListRef &&
      chatListRef.current &&
      conversationTurns.length > 0 &&
      scrollTargetIndex !== null
    ) {
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
    <div className="app-layout">
      {" "}
      {/* New layout container */}
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
        setChunks={setChunks} // Pass setChunks to SidebarTOC
        setFileName={setFileName} // Pass setFileName to SidebarTOC
        fileName={fileName} // Pass fileName to SidebarTOC
      />
      <div className={`main-content ${isSidebarOpen ? "" : "sidebar-closed"}`}>
        {" "}
        {/* Apply ref and class */}
        <div className="app-header-title">
          The Architect in the Echo:
          {displayedFileName ? (
            <span className="file-name-display"> {displayedFileName}</span>
          ) : (
            ""
          )}
        </div>
        <Suspense
          fallback={
            <p style={{ margin: "10px" }}>
              Loading chat... <span style={{ fontSize: "1.5em" }}>ִֶָ🐇</span>
            </p>
          }
        >
          {conversationTurns.length > 0 ? (
            <ChatRenderer
              key={conversationTurns.length} // Force re-mount on data change
              conversationTurns={conversationTurns}
              expandThinking={expandThinking}
              onListRef={setChatListRef}
              scrollTargetIndex={scrollTargetIndex}
              onScrollComplete={handleScrollComplete}
            />
          ) : (
            <p style={{ margin: "10px" }}>
              Loading chat... <span style={{ fontSize: "1.5em" }}>ִֶָ🐇</span>
            </p>
          )}
        </Suspense>
      </div>
    </div>
  );
}
