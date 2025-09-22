import React, { useMemo } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { a11yDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';

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
    const components = useMemo(() => ({
        code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';

            // Handle potential extra newline characters in children
            const code = String(children).replace(/\n$/, '');

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
    }), []);

    return (
        <ReactMarkdown components={components}>
            {markdown}
        </ReactMarkdown>
    );
});

export default MarkdownRenderer;
