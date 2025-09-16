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

export default function SidebarTOC({ chunks, isSidebarOpen, toggleSidebar, chatListRef, originalIndexToValidIndexMap }) {
  const handleTocClick = (e, originalIndex) => {
    e.preventDefault();
    if (chatListRef && chatListRef.current) {
      const validIndex = originalIndexToValidIndexMap[originalIndex];
      if (validIndex !== undefined) {
        chatListRef.current.scrollToItem(validIndex, "auto"); // Scroll to the item
      }
    }
  };

  return (
    <section data-testid="stSidebar" className={isSidebarOpen ? '' : 'closed'}> {/* Apply 'closed' class */}
      <div> {/* This div will be the :first-child targeted by CSS */}
        <h3>⚕ User Messages</h3>
        <nav>
          {chunks.map((chunk, i) => {
            if (chunk.role?.toLowerCase() === 'user') {
              const text = getPlainTextFromMarkdown(chunk.text);
              const short_preview = text.length > 40 ? text.substring(0, 37) + '...' : text;
              const label = `${i + 1}. ${short_preview}`;
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
