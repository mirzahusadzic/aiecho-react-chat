import React from "react";
import { VariableSizeList as List } from "react-window";
import useResizeObserver from "@react-hook/resize-observer";
import MarkdownRenderer from "./MarkdownRenderer";
import "../styles/components/_bubble.css";
import "../styles/components/_code.css";
import "../styles/components/_markdown.css";
import "../styles/components/_tables.css";
import "../styles/components/_avatar.css";

// User / Gemini bubble component
function Bubble({
  role,
  markdown,
  id,
  isThought,
  expandThinking,
  expandedThoughtIds,
  toggleThoughtExpanded,
}) {
  const isThoughtExpanded = expandedThoughtIds.has(id);

  return (
    <div className="chat-container" id={id}>
      <div
        className={`${role}-avatar avatar`}
        role="img"
        aria-label={`${role} avatar`}
      ></div>
      <div className={`bubble ${role}-bubble`}>
        {isThought ? (
          <div className="collapsible-thought">
            <button
              type="button"
              className="collapsible-summary"
              onClick={() => toggleThoughtExpanded(id)}
              aria-label="Toggle thought process"
            ></button>
            {(isThoughtExpanded || expandThinking) && (
              <div className="part-box">
                <MarkdownRenderer markdown={markdown} />
              </div>
            )}
          </div>
        ) : (
          <div className="bubble-inner">
            <MarkdownRenderer markdown={markdown} />
          </div>
        )}
      </div>
    </div>
  );
}

// Grounding table
function GroundingTable({ grounding, rowIndex }) {
  if (!grounding) return null;
  const rows = [];

  grounding.groundingSources?.forEach((src) => {
    rows.push(
      <tr key={`src-${rowIndex}-${src.referenceNumber}`}>
        <td>[source {src.referenceNumber}]</td>
        <td>
          <a
            className="grounding-link"
            href={src.uri}
            target="_blank"
            rel="noreferrer"
          >
            {src.title}
          </a>
        </td>
      </tr>,
    );
  });

  grounding.corroborationSegments?.forEach((seg, idx) => {
    rows.push(
      <tr key={`seg-${rowIndex}-${idx}`}>
        <td>[corroboration {seg.index}]</td>
        <td>
          <a
            className="grounding-link"
            href={seg.uri}
            target="_blank"
            rel="noreferrer"
          >
            {seg.uri}
          </a>
        </td>
      </tr>,
    );
  });

  grounding.webSearchQueries?.forEach((q, idx) => {
    rows.push(
      <tr key={`web-${rowIndex}-${idx}`}>
        <td>[web search {idx + 1}]</td>
        <td>{q}</td>
      </tr>,
    );
  });

  if (!rows.length) return null;
  return (
    <table className="grounding-table">
      <tbody>{rows}</tbody>
    </table>
  );
}

// Row component for react-window
const Row = ({ index, style, data, isScrolling }) => {
  const {
    conversationTurns,
    expandThinking,
    itemHeightsRef,
    listRef,
    expandedThoughtIds,
    toggleThoughtExpanded,
  } = data;
  const turn = conversationTurns[index];
  const rowRef = React.useRef(null);

  React.useLayoutEffect(() => {
    if (!rowRef.current || isScrolling) return;

    const observer = new ResizeObserver(() => {
      if (!rowRef.current) return;
      const newHeight = rowRef.current.offsetHeight;
      const currentHeight = itemHeightsRef.current.get(index);

      if (newHeight > 0 && Math.abs(newHeight - (currentHeight || 0)) > 1) {
        itemHeightsRef.current.set(index, newHeight);
        if (listRef.current) {
          listRef.current.resetAfterIndex(index);
        }
      }
    });

    observer.observe(rowRef.current);

    return () => observer.disconnect();
  }, [
    index,
    turn,
    expandThinking,
    expandedThoughtIds,
    listRef,
    itemHeightsRef,
    isScrolling,
  ]);

  if (!turn) return null;

  const id = `msg${index}`;

  return (
    <div style={style}>
      <div ref={rowRef} className="chat-pair-container" id={id}>
        <div
          style={{
            paddingTop: "15px",
            borderTop: "3px solid var(--color-accent-orange-alpha-55)",
            borderRadius: "10px",
          }}
        >
          {turn.userMessage && (
            <Bubble
              role="user"
              markdown={turn.userMessage.text}
              id={`user-${id}`}
              isThought={false}
              expandThinking={expandThinking}
              expandedThoughtIds={expandedThoughtIds}
              toggleThoughtExpanded={toggleThoughtExpanded}
            />
          )}
          {turn.thinkingMessage && (
            <Bubble
              role="gemini-thinking"
              markdown={
                turn.thinkingMessage.parts?.map((p) => p.text).join("") || ""
              }
              id={`gemini-thought-${id}`}
              isThought={true}
              expandThinking={expandThinking}
              expandedThoughtIds={expandedThoughtIds}
              toggleThoughtExpanded={toggleThoughtExpanded}
            />
          )}
          {turn.geminiMessage && (
            <Bubble
              role="gemini"
              markdown={
                turn.geminiMessage.text ||
                turn.geminiMessage.parts?.map((p) => p.text).join("") ||
                ""
              }
              id={`gemini-model-${id}`}
              isThought={false}
              expandThinking={expandThinking}
              expandedThoughtIds={expandedThoughtIds}
              toggleThoughtExpanded={toggleThoughtExpanded}
            />
          )}
          {turn.grounding && (
            <GroundingTable grounding={turn.grounding} rowIndex={index} />
          )}
        </div>
      </div>
    </div>
  );
};

// Main chat renderer
export default function ChatRenderer({
  conversationTurns,
  expandThinking,
  onListRef,
  scrollTargetIndex,
  onScrollComplete,
}) {
  const containerRef = React.useRef(null);
  const [listWidth, setListWidth] = React.useState(0);
  const [listHeight, setListHeight] = React.useState(0);
  const [isUserAtBottom, setIsUserAtBottom] = React.useState(true); // eslint-disable-line no-unused-vars
  const [expandedThoughtIds, setExpandedThoughtIds] = React.useState(new Set());

  const listRef = React.useRef(null);
  const itemHeightsRef = React.useRef(new Map());
  const scrollStopTimeout = React.useRef();

  const toggleThoughtExpanded = React.useCallback((id) => {
    setExpandedThoughtIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleScroll = React.useCallback(() => {
    clearTimeout(scrollStopTimeout.current);
    scrollStopTimeout.current = setTimeout(() => {
      if (onScrollComplete) {
        onScrollComplete();
      }
    }, 150);
  }, [onScrollComplete]);

  useResizeObserver(containerRef, (entry) => {
    setListWidth(entry.contentRect.width);
    setListHeight(entry.contentRect.height);
  });

  React.useEffect(() => {
    if (onListRef) {
      onListRef(listRef);
    }
  }, [onListRef, listRef]);

  React.useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToItem(conversationTurns.length - 1, "end");
    }
  }, [conversationTurns.length]);

  const getItemSize = (index) => {
    const measuredHeight = itemHeightsRef.current.get(index) || 250;
    return measuredHeight + 20; // Add 20px for spacing
  };

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", flex: "1 1 auto", minHeight: 0 }}
    >
      {listWidth > 0 && listHeight > 0 && (
        <List
          ref={listRef}
          height={listHeight}
          width={listWidth}
          itemCount={conversationTurns.length}
          itemSize={getItemSize}
          estimatedItemSize={250}
          overscanCount={10}
          itemData={{
            conversationTurns,
            expandThinking,
            itemHeightsRef,
            listRef,
            expandedThoughtIds,
            toggleThoughtExpanded,
            scrollTargetIndex,
          }}
          useIsScrolling
          onScroll={handleScroll}
          onItemsRendered={({ visibleStartIndex, visibleStopIndex }) => {
            // Update isUserAtBottom based on visible items
            setIsUserAtBottom(
              visibleStopIndex === conversationTurns.length - 1,
            );

            // Check if there's a pending scroll to an index
            if (scrollTargetIndex !== null) {
              const targetIndex = scrollTargetIndex;
              // If the target index is now visible, perform the final scroll
              if (
                targetIndex >= visibleStartIndex &&
                targetIndex <= visibleStopIndex
              ) {
                listRef.current.scrollToItem(targetIndex, "start");
                // Introduce a small delay to allow layout to settle, then re-scroll for precision
                setTimeout(() => {
                  // Only re-scroll if the target index hasn't changed (i.e., no new click during delay)
                  // App.jsx is responsible for clearing scrollTargetIndex after the scroll effect.
                  if (scrollTargetIndex === targetIndex) {
                    listRef.current.scrollToItem(targetIndex, "start");
                  }
                }, 50); // 50ms delay
              }
            }
          }}
        >
          {Row}
        </List>
      )}
    </div>
  );
}
