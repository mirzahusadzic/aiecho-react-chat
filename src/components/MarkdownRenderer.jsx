import React, { useMemo } from "react";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { a11yDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import markdown from "react-syntax-highlighter/dist/esm/languages/prism/markdown";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import LatexRenderer from "./LatexRenderer"; // Import the custom LatexRenderer

SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("markdown", markdown);

const syntaxHighlighterStyle = { ...a11yDark };
const preStyle = a11yDark['pre[class*="language-"]'] || {};
syntaxHighlighterStyle['pre[class*="language-"]'] = {
  ...preStyle,
  backgroundColor: "transparent",
  padding: "0",
};
const codeStyle = a11yDark['code[class*="language-"]'] || {};
syntaxHighlighterStyle['code[class*="language-"]'] = {
  ...codeStyle,
  backgroundColor: "transparent",
  padding: "0",
};

const MarkdownRenderer = React.memo(({ markdown }) => {
  MarkdownRenderer.displayName = "MarkdownRenderer";
  const components = useMemo(
    () => ({
      code({ inline, className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || "");
        const language = match ? match[1] : "";

        // Handle potential extra newline characters in children
        const code = String(children).replace(/\n$/, "");

        return !inline && language ? (
          <SyntaxHighlighter
            style={syntaxHighlighterStyle}
            language={language}
            PreTag="div"
            {...props}
          >
            {code}
          </SyntaxHighlighter>
        ) : (
          <code className={className} {...props}>
            {children}
          </code>
        );
      },
      // Custom rendering for math blocks
      math: ({ value }) => <LatexRenderer latex={value} displayMode={true} />,
      inlineMath: ({ value }) => (
        <LatexRenderer latex={value} displayMode={false} />
      ),
    }),
    [],
  );

  return (
    <ReactMarkdown
      components={components}
      remarkPlugins={[remarkMath, remarkGfm]}
      rehypePlugins={[rehypeKatex]}
    >
      {markdown}
    </ReactMarkdown>
  );
});

export default MarkdownRenderer;
