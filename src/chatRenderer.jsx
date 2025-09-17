import React from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { VariableSizeList as List} from "react-window";
import useResizeObserver from '@react-hook/resize-observer';
import './App.css';   // chat-specific

// Convert markdown → sanitized HTML
function safeChunkBody(text) {
  if (!text) return "<strong>NO DATA FOR THE CHUNK</strong>";
  try {
    const rawHtml = marked.parse(text);
    return DOMPurify.sanitize(rawHtml);
  } catch (e) {
    return `<pre>Error rendering markdown: ${e}\n\n${text}</pre>`;
  }
}

// Random helper
const randBetween = (min, max) => Math.random() * (max - min) + min;

// User / Gemini bubble component
function Bubble({ role, html, id, isScrolling: isScrollingWithDelay, isThought, expandThinking, animationsEnabled, expandedThoughtIds, toggleThoughtExpanded }) {
  const isThoughtExpanded = expandedThoughtIds.has(id);

  const animationValues = React.useRef({
    rand: randBetween(0.3, 0.7),
    trembleDelayOffset: randBetween(0, 0.5),
    trembleDurationFactor: randBetween(0.8, 1.2),
  });
  const { rand, trembleDelayOffset, trembleDurationFactor } = animationValues.current;

  const slideAnimation = React.useMemo(() => {
    const finalTrembleDuration = 40.0 * trembleDurationFactor;
    const finalTrembleDelay = 1.5 + trembleDelayOffset;
    return `slide-x-${role} ${finalTrembleDuration}s infinite cubic-bezier(0.8,0,0.2,1) ${finalTrembleDelay}s backwards, move-noise 10s steps(10,end) infinite, geminiPulse 10s infinite alternate ease-in-out`;
  }, [role, trembleDurationFactor, trembleDelayOffset]);

  const trembleAnimation = React.useMemo(() => {
    const finalTrembleDelay = 1.5 + trembleDelayOffset;
    return `tremble-fast 1s infinite ease-in-out ${finalTrembleDelay}s`;
  }, [trembleDelayOffset]);

  const avatar = role === "user" ? "𖤓" : "۝";
  const containerClass = role === "user" ? "chat-container user-pulls merge" : "chat-container gemini-pulls merge";
  const bubbleClass = role === "user" ? "bubble user-bubble" : "bubble gemini-bubble";

  return (
    <div className={containerClass} id={id}>
      <div className={`${role}-avatar avatar ${animationsEnabled ? '' : 'animation-paused'}`}>{avatar}</div>
          <div className="bubble-tremble-wrapper">
            <div className={`${bubbleClass} ${animationsEnabled ? '' : 'animation-paused'}`} style={{ "--rand": rand, animation: slideAnimation }}>
              {isThought ? (
                <div className="collapsible-thought">
                  <div className="collapsible-summary" onClick={() => toggleThoughtExpanded(id)}>۩</div>
                  {(isThoughtExpanded || expandThinking) && (
                    <div className={`part-box ${animationsEnabled ? '' : 'animation-paused'}`} dangerouslySetInnerHTML={{ __html: html }} />
                  )}
                </div>
              ) : (
                <div className="bubble-inner" style={{ animation: animationsEnabled ? trembleAnimation : 'none' }} dangerouslySetInnerHTML={{ __html: html }} />
              )}
            </div>
          </div>
    </div>
  );
}

// Grounding table
function GroundingTable({ grounding, rowIndex }) {
  if (!grounding) return null;
  const rows = [];

  grounding.groundingSources?.forEach(src => {
    rows.push(
      <tr key={`src-${rowIndex}-${src.referenceNumber}`}>
        <td>[source {src.referenceNumber}]</td>
        <td><a className="grounding-link" href={src.uri} target="_blank">{src.title}</a></td>
      </tr>
    );
  });

  grounding.corroborationSegments?.forEach((seg, idx) => {
    rows.push(
      <tr key={`seg-${rowIndex}-${idx}`}>
        <td>[corroboration {seg.index}]</td>
        <td><a className="grounding-link" href={seg.uri} target="_blank">{seg.uri}</a></td>
      </tr>
    );
  });

  grounding.webSearchQueries?.forEach((q, idx) => {
    rows.push(
      <tr key={`web-${rowIndex}-${idx}`}>
        <td>[web search {idx + 1}]</td>
        <td>{q}</td>
      </tr>
    );
  });

  if (!rows.length) return null;
  return <table className="grounding-table"><tbody>{rows}</tbody></table>;
}

// Row component for react-window
const Row = ({ index, style, data }) => {
  const { conversationTurns, expandThinking, itemHeightsRef, listRef, isScrolling: isUserScrolling, animationsEnabled, expandedThoughtIds, toggleThoughtExpanded } = data;
  const turn = conversationTurns[index];
  const rowRef = React.useRef(null);

  React.useLayoutEffect(() => {
    if (!rowRef.current) return;

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
  }, [index, turn, expandThinking, expandedThoughtIds, listRef, itemHeightsRef]);

  if (!turn) return null;

  const id = `msg${index}`;

  return (
    <div style={style}> 
      <div ref={rowRef} className="chat-pair-container" id={id}>
        {turn.userMessage && (
          <Bubble
            role="user"
            html={safeChunkBody(turn.userMessage.text)}
            id={`user-${id}`}
            isScrolling={isUserScrolling}
            isThought={false}
            expandThinking={expandThinking}
            animationsEnabled={animationsEnabled}
            expandedThoughtIds={expandedThoughtIds}
            toggleThoughtExpanded={toggleThoughtExpanded}
          />
        )}
        {turn.thinkingMessage && (
          <Bubble
            role="gemini"
            html={safeChunkBody(turn.thinkingMessage.parts?.map(p => p.text).join("" ) || "")}
            id={`gemini-thought-${id}`}
            isScrolling={isUserScrolling}
            isThought={true}
            expandThinking={expandThinking}
            animationsEnabled={animationsEnabled}
            expandedThoughtIds={expandedThoughtIds}
            toggleThoughtExpanded={toggleThoughtExpanded}
          />
        )}
        {turn.geminiMessage && (
          <Bubble
            role="gemini"
            html={safeChunkBody(
              turn.geminiMessage.text || turn.geminiMessage.parts?.map(p => p.text).join("" ) || ""
            )}
            id={`gemini-model-${id}`}
            isScrolling={isUserScrolling}
            isThought={false}
            expandThinking={expandThinking}
            animationsEnabled={animationsEnabled}
            expandedThoughtIds={expandedThoughtIds}
            toggleThoughtExpanded={toggleThoughtExpanded}
          />
        )}
        {turn.grounding && (
          <GroundingTable grounding={turn.grounding} rowIndex={index} />
        )}
      </div>
    </div>
  );
};

// Main chat renderer
export default function ChatRenderer({ conversationTurns, expandThinking, onListRef, pendingScrollToIndex, animationsEnabled: propAnimationsEnabled }) {
  const containerRef = React.useRef(null);
  const [listWidth, setListWidth] = React.useState(0);
  const [listHeight, setListHeight] = React.useState(0);
  const [isScrollingWithDelay, setIsScrollingWithDelay] = React.useState(false);
  const [isUserAtBottom, setIsUserAtBottom] = React.useState(true);
  const [expandedThoughtIds, setExpandedThoughtIds] = React.useState(new Set());

  const listRef = React.useRef(null);
  const itemHeightsRef = React.useRef(new Map());

  // Calculate effective animationsEnabled by combining prop and scrolling state
  const effectiveAnimationsEnabled = propAnimationsEnabled && !isScrollingWithDelay;

  const toggleThoughtExpanded = React.useCallback((id) => {
    setExpandedThoughtIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleListScroll = React.useCallback(({ scrollOffset }) => {
    // This is the scroll event from react-window
    // We need to detect when scrolling stops
    let lastScrollTop = scrollOffset;
    let frameId = null;

    const checkScrollStop = () => {
      if (listRef.current && listRef.current._outerRef.scrollTop === lastScrollTop) {
        // Scroll has stopped
        setIsScrollingWithDelay(false);
        cancelAnimationFrame(frameId);
        frameId = null;
      } else {
        lastScrollTop = listRef.current._outerRef.scrollTop;
        frameId = requestAnimationFrame(checkScrollStop);
      }
    };

    setIsScrollingWithDelay(true);
    if (!frameId) {
      frameId = requestAnimationFrame(checkScrollStop);
    }
  }, [listRef, setIsScrollingWithDelay]);

  useResizeObserver(containerRef, (entry) => {
    setListWidth(entry.contentRect.width);
    setListHeight(entry.contentRect.height);
  });

  // Custom scroll event listener to manage isScrollingWithDelay
  React.useEffect(() => {
    if (!containerRef.current) return;

    const listElement = containerRef.current; // Attach to the main scrollable container

    listElement.addEventListener('scroll', handleListScroll);
    listElement.addEventListener('wheel', handleListScroll); // Also listen for wheel events

    return () => {
      listElement.removeEventListener('scroll', handleListScroll);
      listElement.removeEventListener('wheel', handleListScroll);
    };
  }, [containerRef, handleListScroll]); // Dependency on containerRef and handleListScroll

  React.useEffect(() => {
    if (onListRef) {
      onListRef(listRef);
    }
  }, [onListRef, listRef]);

  // This effect triggers a layout recalculation after the initial mount,
  // which fixes the initial "messed up" layout.
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (listRef.current) {
        listRef.current.resetAfterIndex(0);
      }
    }, 100); // Delay to allow initial rows to measure themselves.

    return () => clearTimeout(timer);
  }, []); // Run only once on mount.

  React.useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToItem(conversationTurns.length - 1, "end");
    }
  }, [conversationTurns.length]);

  const getItemSize = index => {
    return itemHeightsRef.current.get(index) || 250;
  };

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      {listWidth > 0 && listHeight > 0 && (
        <List
          ref={listRef}
          height={listHeight}
          width={listWidth}
          itemCount={conversationTurns.length}
          itemSize={getItemSize}
          estimatedItemSize={250}
          overscanCount={10}
          itemData={{ conversationTurns, expandThinking, itemHeightsRef, listRef, isScrolling: isScrollingWithDelay, animationsEnabled: effectiveAnimationsEnabled, expandedThoughtIds, toggleThoughtExpanded, pendingScrollToIndex }}
          onScroll={handleListScroll}
          onItemsRendered={({ visibleStartIndex, visibleStopIndex }) => {
            // Update isUserAtBottom based on visible items
            setIsUserAtBottom(visibleStopIndex === conversationTurns.length - 1);

            // Check if there's a pending scroll to an index
            if (pendingScrollToIndex && pendingScrollToIndex.current !== null) {
              const targetIndex = pendingScrollToIndex.current;
              // If the target index is now visible, perform the final scroll
              if (targetIndex >= visibleStartIndex && targetIndex <= visibleStopIndex) {
                listRef.current.scrollToItem(targetIndex, "start");
                // Introduce a small delay to allow layout to settle, then re-scroll for precision
                setTimeout(() => {
                  // Only re-scroll if the pending index hasn't changed (i.e., no new click during delay)
                  if (pendingScrollToIndex.current === targetIndex) {
                    listRef.current.scrollToItem(targetIndex, "start");
                    pendingScrollToIndex.current = null; // Clear the pending index after final scroll
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
