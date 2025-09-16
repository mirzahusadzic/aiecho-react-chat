import React from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { VariableSizeList as List} from "react-window";
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
      <div className={role + "-avatar avatar"}>{avatar}</div>
          <div className="bubble-tremble-wrapper">
            <div className={`${bubbleClass} ${animationsEnabled ? '' : 'animation-paused'}`} style={{ "--rand": rand, animation: slideAnimation }}>
              {isThought ? (
                <div className="collapsible-thought">
                  <div className="collapsible-summary" onClick={() => toggleThoughtExpanded(id)}>۩</div>
                  {(isThoughtExpanded || expandThinking) && (
                    <div className="part-box" dangerouslySetInnerHTML={{ __html: html }} />
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
  const { conversationTurns, expandThinking, itemHeightsRef, listRef, isScrolling: isUserScrolling, animationsEnabled, expandedThoughtIds, toggleThoughtExpanded } = data; // Access animationsEnabled, expandedThoughtIds, toggleThoughtExpanded from data
  const turn = conversationTurns[index];

  const rowRef = React.useRef(null);

  React.useLayoutEffect(() => {
    if (!rowRef.current) {
      return;
    }

    const observer = new ResizeObserver(() => {
      if (!rowRef.current) {
        return;
      }
      const measuredHeight = rowRef.current.offsetHeight;
      const storedHeight = itemHeightsRef.current.get(index);

      if (measuredHeight !== storedHeight) {
        itemHeightsRef.current.set(index, measuredHeight);
        if (listRef.current) { // Always reset if height changed
          listRef.current.resetAfterIndex(index);
        }
      }
    });

    observer.observe(rowRef.current);

    return () => {
      observer.disconnect();
    };
  }, [index, itemHeightsRef, listRef, turn, expandThinking]); // Re-measure when content or index changes

  if (!turn) return null; // Handle empty or invalid turns

  const id = `msg${index}`;

  return (
    <div style={style}> {/* react-window applies positioning styles here */}
      <div ref={rowRef} className="chat-pair-container" id={id}> {/* Inner div to observe for content height */}
        {turn.userMessage && (
          <Bubble
            role="user"
            html={safeChunkBody(turn.userMessage.text)}
            id={`user-${id}`}
            isScrolling={isUserScrolling}
            isThought={false}
            expandThinking={expandThinking}
            animationsEnabled={animationsEnabled} // Pass animationsEnabled
            expandedThoughtIds={expandedThoughtIds}
            toggleThoughtExpanded={toggleThoughtExpanded}
          />
        )}
        {turn.thinkingMessage && (
                      <Bubble
                      role="gemini"
                      html={safeChunkBody(turn.thinkingMessage.parts?.map(p => p.text).join("") || "")}
                      id={`gemini-thought-${id}`}
                      isScrolling={isUserScrolling}
                      isThought={true}
                      expandThinking={expandThinking}
                      animationsEnabled={animationsEnabled}
                      expandedThoughtIds={expandedThoughtIds}
                      toggleThoughtExpanded={toggleThoughtExpanded}
                    />        )}
        {turn.geminiMessage && (
          <Bubble
            role="gemini"
            html={safeChunkBody(
              turn.geminiMessage.text || turn.geminiMessage.parts?.map(p => p.text).join("") || ""
            )}
            id={`gemini-model-${id}`}
            isScrolling={isUserScrolling}
            isThought={false}
            expandThinking={expandThinking}
            animationsEnabled={animationsEnabled} // Pass animationsEnabled
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
export default function ChatRenderer({ chunks, expandThinking, onListRef }) {
  const validChunks = chunks.filter(chunk => chunk?.role);

  const conversationTurns = React.useMemo(() => {
    const turns = [];
    let i = 0;
    while (i < validChunks.length) {
      const turn = { userMessage: null, thinkingMessage: null, geminiMessage: null, grounding: null };

      // Find user message
      if (validChunks[i].role?.toLowerCase() === 'user') {
        turn.userMessage = validChunks[i];
        i++;
      }

      // Find thinking message (if any)
      if (i < validChunks.length && validChunks[i].role?.toLowerCase() === 'model' && validChunks[i].isThought) {
        turn.thinkingMessage = validChunks[i];
        i++;
      }

      // Find gemini message
      if (i < validChunks.length && validChunks[i].role?.toLowerCase() === 'model' && !validChunks[i].isThought) {
        turn.geminiMessage = validChunks[i];
        turn.grounding = validChunks[i].grounding;
        i++;
      }

      // Handle cases where a turn might start with a model message (orphan)
      if (!turn.userMessage && (turn.thinkingMessage || turn.geminiMessage)) {
        // This is an orphaned model message, push it as a new turn
        turns.push(turn);
      } else if (turn.userMessage || turn.thinkingMessage || turn.geminiMessage) {
        // Push the turn if it contains any message
        turns.push(turn);
      }
    }
    return turns;
  }, [validChunks]);

  const containerRef = React.useRef(null);
  const [listWidth, setListWidth] = React.useState(0);
  const [listHeight, setListHeight] = React.useState(0);
  const [isScrollingWithDelay, setIsScrollingWithDelay] = React.useState(false);
  const scrollTimeoutRef = React.useRef(null); // This ref will now store the requestAnimationFrame ID
  const [isUserAtBottom, setIsUserAtBottom] = React.useState(true);
  const [animationsEnabled, setAnimationsEnabled] = React.useState(true); // New state for controlling animations
  const [expandedThoughtIds, setExpandedThoughtIds] = React.useState(new Set()); // State to track expanded thoughts

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

  console.log('isScrollingWithDelay (outside handleScroll):', isScrollingWithDelay);

  const listRef = React.useRef(null);
  const itemHeightsRef = React.useRef(new Map());

  // Manage isScrollingWithDelay using List's onScroll prop
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

  React.useEffect(() => {
    console.log('ChatRenderer mounted');
    return () => {
      console.log('ChatRenderer unmounted');
    };
  }, []);

  // Effect to manage animationsEnabled state
  React.useEffect(() => {
    if (isScrollingWithDelay) {
      setAnimationsEnabled(false); // Disable animations immediately when scrolling starts
    } else {
      // Enable animations after a short delay when scrolling stops
      const timeout = setTimeout(() => {
        setAnimationsEnabled(true);
      }, 100); // 100ms delay after scroll stops
      return () => clearTimeout(timeout);
    }
  }, [isScrollingWithDelay]);

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

  const getItemSize = index => {
    const size = itemHeightsRef.current.get(index) || 250;
    return size;
  };

  React.useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        setListWidth(entry.contentRect.width);
        setListHeight(entry.contentRect.height);
      }
    });

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  React.useEffect(() => {
    if (onListRef) {
      onListRef(listRef);
    }
  }, [onListRef, listRef]);

  // Initial scroll to bottom when component mounts
  React.useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToItem(conversationTurns.length - 1, "end");
    }
  }, []); // Empty dependency array to run only on mount

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
                    itemData={{ conversationTurns, expandThinking, itemHeightsRef, listRef, isScrolling: isScrollingWithDelay, animationsEnabled, expandedThoughtIds, toggleThoughtExpanded }} // Pass animationsEnabled, expandedThoughtIds, toggleThoughtExpanded
                    onScroll={handleListScroll}
                    onItemsRendered={({ visibleStopIndex }) => {
                      // Update isUserAtBottom based on visible items
                      setIsUserAtBottom(visibleStopIndex === conversationTurns.length - 1);
                    }}
        >
          {({ index, style, data }) => (
            <Row index={index} style={style} data={data} />
          )}
        </List>
      )}
    </div>
  );
}