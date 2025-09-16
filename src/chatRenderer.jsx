import React from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
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
function Bubble({ role, html, id }) {
  const rand = randBetween(0.3, 0.7);
  const trembleDelayOffset = randBetween(0, 0.5);
  const trembleDurationFactor = randBetween(0.8, 1.2);
  const finalTrembleDuration = 40.0 * trembleDurationFactor;
  const finalTrembleDelay = 1.5 + trembleDelayOffset;

  const slideAnimation = role === "user"
    ? `slide-x-user ${finalTrembleDuration}s infinite cubic-bezier(0.8,0,0.2,1) ${finalTrembleDelay}s backwards, move-noise 10s steps(10,end) infinite, geminiPulse 10s infinite alternate ease-in-out`
    : `slide-x-gemini ${finalTrembleDuration}s infinite cubic-bezier(0.8,0,0.2,1) ${finalTrembleDelay}s backwards, move-noise 10s steps(10,end) infinite, geminiPulse 10s infinite alternate ease-in-out`;

  const trembleAnimation = `tremble-fast 1s infinite ease-in-out ${finalTrembleDelay}s`;

  const avatar = role === "user" ? "𖤓" : "۝";
  const containerClass = role === "user" ? "chat-container user-pulls merge" : "chat-container gemini-pulls merge";
  const bubbleClass = role === "user" ? "bubble user-bubble" : "bubble gemini-bubble";

  return (
    <div className="chat-pair-container" id={id}>
      <div className={containerClass}>
        <div className={role + "-avatar avatar"}>{avatar}</div>
        <div className="bubble-tremble-wrapper">
          <div className={bubbleClass} style={{ "--rand": rand, animation: slideAnimation }}>
            <div className="bubble-inner" style={{ animation: trembleAnimation }} dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Grounding table
function GroundingTable({ grounding }) {
  if (!grounding) return null;
  const rows = [];

  grounding.groundingSources?.forEach(src => {
    rows.push(
      <tr key={"src" + src.referenceNumber}>
        <td>[source {src.referenceNumber}]</td>
        <td><a className="grounding-link" href={src.uri} target="_blank">{src.title}</a></td>
      </tr>
    );
  });

  grounding.corroborationSegments?.forEach(seg => {
    rows.push(
      <tr key={"seg" + seg.index}>
        <td>[corroboration {seg.index}]</td>
        <td><a className="grounding-link" href={seg.uri} target="_blank">{seg.uri}</a></td>
      </tr>
    );
  });

  grounding.webSearchQueries?.forEach((q, idx) => {
    rows.push(
      <tr key={"web" + idx}>
        <td>[web search {idx + 1}]</td>
        <td>{q}</td>
      </tr>
    );
  });

  if (!rows.length) return null;
  return <table className="grounding-table"><tbody>{rows}</tbody></table>;
}

// Main chat renderer
export default function ChatRenderer({ chunks, expandThinking }) {
  const chatBlocks = [];
  let i = 0;

  while (i < chunks.length) {
    const chunk = chunks[i];
    if (!chunk?.role) { i++; continue; }
    const role = chunk.role.toLowerCase();

    // User chunk
    if (role === "user") {
      const userHtml = safeChunkBody(chunk.text);
      chatBlocks.push(<Bubble key={i} role="user" html={userHtml} id={"msg" + i} />);
      i++;

      // Gemini responses
      while (i < chunks.length && ["model", "assistant"].includes(chunks[i].role.toLowerCase())) {
        const geminiChunk = chunks[i];
        const gemHtml = safeChunkBody(
          geminiChunk.parts?.map(p => p.text).join("") || geminiChunk.text || ""
        );

        if (geminiChunk.isThought) {
          chatBlocks.push(
            <details key={i} open={expandThinking}>
              <summary>۩</summary>
              {geminiChunk.parts?.map((p, idx) => (
                <div key={idx} className="part-box" dangerouslySetInnerHTML={{ __html: safeChunkBody(p.text) }} />
              ))}
            </details>
          );
        } else {
          chatBlocks.push(<Bubble key={i} role="gemini" html={gemHtml} id={"msg" + i} />);
        }

        chatBlocks.push(<GroundingTable key={"ground" + i} grounding={geminiChunk.grounding} />);
        i++;
      }
    } else {
      // Orphan Gemini message
      const html = safeChunkBody(chunk.text);
      chatBlocks.push(<Bubble key={i} role="gemini" html={html} id={"msg" + i} />);
      chatBlocks.push(<GroundingTable key={"ground" + i} grounding={chunk.grounding} />);
      i++;
    }
  }

  return <>{chatBlocks}</>;
}
