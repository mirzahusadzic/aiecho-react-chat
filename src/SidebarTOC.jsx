import React from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Helper to safely get text content from markdown, similar to your Python example
function getPlainTextFromMarkdown(markdownText) {
  if (!markdownText) return '';
  try {
    const rawHtml = marked.parse(markdownText);
    const sanitizedHtml = DOMPurify.sanitize(rawHtml);
    // Create a temporary div to extract plain text
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = sanitizedHtml;
    return tempDiv.textContent || tempDiv.innerText || '';
  } catch (e) {
    console.error('Error processing markdown for TOC:', e);
    return markdownText; // Fallback to raw text on error
  }
}

export default function SidebarTOC({ chunks, isSidebarOpen, toggleSidebar, chatListRef, originalIndexToValidIndexMap, pendingScrollToIndex, expandThinking, setExpandThinking, animationsPaused, setAnimationsPaused }) {
  const handleTocClick = React.useCallback((e, originalIndex) => {
    e.preventDefault();
    if (chatListRef && chatListRef.current) {
      const validIndex = originalIndexToValidIndexMap[originalIndex];
      if (validIndex !== undefined) {
        // Set the pending index first
        pendingScrollToIndex.current = validIndex;
        // Scroll to bring the item into view. This is the first, approximate scroll.
        chatListRef.current.scrollToItem(validIndex, "auto");
      } else {
        console.warn('validIndex is undefined for originalIndex:', originalIndex);
      }
    } else {
      console.warn('chatListRef.current is not available.');
    }
  }, [chatListRef, originalIndexToValidIndexMap, pendingScrollToIndex]);

  return (
    <section data-testid="stSidebar" className={`${isSidebarOpen ? '' : 'closed'} ${animationsPaused ? 'animations-paused' : ''}`}> {/* Apply 'closed' class */}
      <div> {/* This div will be the :first-child targeted by CSS */}
        <label style={{ display: 'block', margin: '1em 0' }}>
          <input
            type="checkbox"
            checked={expandThinking}
            onChange={e => setExpandThinking(e.target.checked)}
          />{' '}
          Show Thoughts
        </label>
        <label style={{ display: 'block', margin: '1em 0' }}>
          <input
            type="checkbox"
            checked={animationsPaused}
            onChange={e => setAnimationsPaused(e.target.checked)}
          />{' '}
          Pause Animations
        </label>
        <h3>⚕ User Messages</h3>
        <nav>
          {chunks.map((chunk, i) => {
            if (chunk.role?.toLowerCase() === 'user') {
              const validIndex = originalIndexToValidIndexMap[i];
              if (validIndex === undefined) return null; // Skip if not a valid item in the virtualized list
              const text = getPlainTextFromMarkdown(chunk.text);
              const short_preview = text.length > 40 ? text.substring(0, 37) + '...' : text;
              const label = `${validIndex + 1}. ${short_preview}`;
              return (
                <a key={`toc-item-${i}`} href={`#msg${i}`} onClick={(e) => handleTocClick(e, i)}>
                  {label}
                </a>
              );
            }
            return null;
          })}
        </nav>
      </div>
      <button onClick={toggleSidebar} className="sidebar-toggle-button">
        {isSidebarOpen ? '<' : '>'} {/* Simple toggle icon */}
      </button>
    </section>
  );
}