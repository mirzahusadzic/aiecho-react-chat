import React, { useRef } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import "../styles/components/_sidebar.css";

// Helper to safely get text content from markdown, similar to your Python example
function getPlainTextFromMarkdown(markdownText) {
  if (!markdownText) return "";
  try {
    const rawHtml = marked.parse(markdownText);
    const sanitizedHtml = DOMPurify.sanitize(rawHtml);
    // Create a temporary div to extract plain text
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = sanitizedHtml;
    return tempDiv.textContent || tempDiv.innerText || "";
  } catch (e) {
    // console.error('Error processing markdown for TOC:', e); // Removed log
    return markdownText; // Fallback to raw text on error
  }
}

export default function SidebarTOC({
  chunks,
  isSidebarOpen,
  toggleSidebar,
  chatListRef,
  originalIndexToValidIndexMap,
  setScrollTargetIndex,
  expandThinking,
  setExpandThinking,
  setChunks,
  setFileName,
  fileName,
}) {
  const handleTocClick = React.useCallback(
    (e, originalIndex) => {
      e.preventDefault();
      if (chatListRef) {
        const validIndex = originalIndexToValidIndexMap[originalIndex];
        if (validIndex !== undefined) {
          // Set the scroll target index
          // We don't directly scroll here, but set the state that App.jsx watches
          setScrollTargetIndex(validIndex);
        } else {
          // console.warn('validIndex is undefined for originalIndex:', originalIndex); // Removed log
        }
      } else {
        // console.warn('chatListRef.current is not available.'); // Removed log
      }
    },
    [chatListRef, originalIndexToValidIndexMap, setScrollTargetIndex],
  );

  const fileInputRef = useRef(null);

  const handleButtonClick = () => {
    fileInputRef.current.click(); // triggers file picker
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const fileNameWithoutExtension = file.name
        .split(".")
        .slice(0, -1)
        .join(".");
      setFileName(fileNameWithoutExtension); // Update the file name in App.jsx state
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsedJson = JSON.parse(e.target.result);
          // console.log('SidebarTOC.jsx: Parsed JSON:', parsedJson); // Removed log
          const extractedChunks = parsedJson?.chunkedPrompt?.chunks || [];
          // console.log('SidebarTOC.jsx: Extracted Chunks:', extractedChunks); // Removed log
          // console.log('SidebarTOC.jsx: Is Extracted Chunks an array?', Array.isArray(extractedChunks)); // Removed log

          if (Array.isArray(extractedChunks)) {
            setChunks(extractedChunks);
          } else {
            console.error("Error: Extracted chat chunks are not an array.");
            alert(
              "Error: Selected JSON file does not contain a valid array of chat chunks under 'chunkedPrompt.chunks'.",
            );
            setChunks([]); // Clear chunks or handle as appropriate
          }
        } catch (error) {
          console.error("Error parsing JSON file:", error);
          alert("Error parsing JSON file. Please ensure it's a valid JSON.");
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <section
      data-testid="stSidebar"
      className={`${isSidebarOpen ? "" : "closed"}`}
    >
      {" "}
      {/* Apply 'closed' class */}
      <div>
        {" "}
        {/* This div will be the :first-child targeted by CSS */}
        <label className="sidebar-control-label">
          <span className="switch-label">Show Thoughts</span>
          <input
            type="checkbox"
            checked={expandThinking}
            onChange={(e) => setExpandThinking(e.target.checked)}
            className="sidebar-checkbox"
          />
          <span className="switch-container">
            <span className="switch-handle"></span>
          </span>
        </label>
        <div className="sidebar-controls">
          {" "}
          {/* New wrapper for sticky elements */}
          <div className="sidebar-control-group">
            <button
              onClick={handleButtonClick}
              className={`sidebar-button ${fileName ? "sidebar-button-selected" : ""}`}
            >
              Choose JSON File
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: "none" }}
              accept=".json"
            />
          </div>
          <h3 className="sidebar-title">⚕ User Messages</h3>
        </div>{" "}
        {/* End sidebar-controls */}
        <nav className="sidebar-nav-scrollable">
          {" "}
          {/* New class for scrollable nav */}
          {chunks.map((chunk, i) => {
            if (chunk.role?.toLowerCase() === "user") {
              const validIndex = originalIndexToValidIndexMap[i];
              if (validIndex === undefined) return null; // Skip if not a valid item in the virtualized list
              const text = getPlainTextFromMarkdown(chunk.text);
              const short_preview =
                text.length > 40 ? text.substring(0, 37) + "..." : text;
              const label = `${validIndex + 1}. ${short_preview}`;
              return (
                <a
                  key={`toc-item-${i}`}
                  href={`#msg${i}`}
                  onClick={(e) => handleTocClick(e, i)}
                >
                  {label}
                </a>
              );
            }
            return null;
          })}
        </nav>
      </div>
      <button onClick={toggleSidebar} className="sidebar-toggle-button">
        {isSidebarOpen ? "<" : ">"} {/* Simple toggle icon */}
      </button>
    </section>
  );
}
