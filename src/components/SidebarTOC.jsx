import React from "react";
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
        }
      }
    },
    [chatListRef, originalIndexToValidIndexMap, setScrollTargetIndex],
  );

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
          <h3 className="sidebar-title">⚕ User Messages</h3>
        </div>
        {/* End sidebar-controls */}
        <nav className="sidebar-nav-scrollable">
          {" "}
          {/* New class for scrollable nav */}
          {chunks.map((chunk, i) => {
            if (chunk.role?.toLowerCase() === "user") {
              const validIndex = originalIndexToValidIndexMap[i];
              if (validIndex === undefined) return null; // Skip if not a valid item in the virtualized list
              const text = getPlainTextFromMarkdown(chunk.text);
              const label = `${text}`;
              return (
                <a
                  key={`toc-item-${i}`}
                  href={`#msg${validIndex}`}
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
