import React, { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

const renderBlock = (latex, container, displayMode = true) => {
  try {
    katex.render(latex, container, {
      throwOnError: false,
      displayMode: displayMode,
    });
  } catch (err) {
    container.innerHTML = `<span style="color:red;">${err.message}</span>`;
  }
};

const LatexRenderer = ({ latex, displayMode = true }) => {
  const containerRef = useRef();

  useEffect(() => {
    if (containerRef.current && latex) {
      const blocks = latex
        .split(/\n\s*\n/) // split on empty lines (paragraph breaks)
        .map((b) => b.trim())
        .filter((b) => b);

      containerRef.current.innerHTML = ""; // clear previous

      blocks.forEach((block) => {
        const el = document.createElement("div");
        containerRef.current.appendChild(el);

        const isMathBlock =
          block.startsWith("\\\[") ||
          block.startsWith("\\(") ||
          block.startsWith("\\begin") ||
          block.includes("&=") ||
          block.includes("^") ||
          displayMode;

        const cleanBlock = block.replace(/^\\\S|\\\S$/g, "");
        renderBlock(cleanBlock, el, isMathBlock);
      });
    }
  }, [latex, displayMode]);

  return <div ref={containerRef} />;
};

export default LatexRenderer;
