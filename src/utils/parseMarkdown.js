import { marked } from "marked";
import DOMPurify from "dompurify";

export function safeChunkHTML(text) {
  if (!text) text = "**NO DATA FOR THE CHUNK**";

  try {
    const rawHTML = marked(text);
    return DOMPurify.sanitize(rawHTML);
  } catch (e) {
    console.error("Error parsing markdown:", e);
    return `<pre>Error rendering markdown: ${e}\n\n${text}</pre>`;
  }
}
