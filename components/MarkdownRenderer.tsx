
import React, { useMemo, useEffect, useRef } from 'react';
import MarkdownIt from 'markdown-it';
import mdContainer from 'markdown-it-container';
import mdTasks from 'markdown-it-task-lists';
import mdMark from 'markdown-it-mark';
import DOMPurify from 'dompurify';
import katex from 'katex';
import renderMathInElement from 'katex/contrib/auto-render';

const renderKatexSafely = (tex: string, options: any) => {
  try {
    return katex.renderToString(tex, options);
  } catch (err) {
    return tex;
  }
};

const mk = (md: any) => {
  const temp = md.renderer.rules.text || function(tokens: any, idx: any) { return tokens[idx].content; };
  md.renderer.rules.text = (tokens: any, idx: any, options: any, env: any, self: any) => {
    let content = tokens[idx].content;
    content = content.replace(/\$\$([\s\S]*?)\$\$/g, (_: any, tex: string) => renderKatexSafely(tex, { displayMode: true }));
    content = content.replace(/\$([^\$\n]+?)\$/g, (match: string, tex: string) => {
      if (/^[\d,.\s]+$/.test(tex)) return match;
      return renderKatexSafely(tex, { displayMode: false });
    });
    return temp(tokens, idx, options, env, self);
  };

  const defaultFence = md.renderer.rules.fence || function(tokens: any, idx: any, options: any, env: any, self: any) {
    return self.renderToken(tokens, idx, options);
  };

  md.renderer.rules.fence = (tokens: any, idx: any, options: any, env: any, self: any) => {
    const token = tokens[idx];
    const info = token.info ? token.info.trim() : '';
    const code = token.content;

    // Support for Mermaid Diagrams
    if (info === 'mermaid') {
        return `<div class="mermaid">${code}</div>`;
    }

    // Removed data-code attribute to prevent DOM overload on huge code blocks
    return `
      <div class="code-block-wrapper relative group my-4 rounded-xl overflow-hidden border border-gray-200">
        <div class="code-header select-none flex justify-between items-center bg-gray-50 px-4 py-2 border-b border-gray-200">
          <span class="font-bold text-[10px] uppercase tracking-wider text-gray-500">${info || 'TEXT'}</span>
          <button 
            class="copy-btn text-[#008080] hover:bg-[#008080]/10 px-3 py-1 rounded-md transition-colors text-[10px] font-black tracking-widest cursor-pointer"
          >
            COPY
          </button>
        </div>
        <div class="overflow-x-auto">
          ${defaultFence(tokens, idx, options, env, self)}
        </div>
      </div>
    `;
  };
};

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = React.memo(({ content }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const md = useMemo(() => {
    const instance = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      breaks: true, // Enable line breaks
      highlight: function (str, lang) {
        if (lang && (window as any).Prism && (window as any).Prism.languages[lang]) {
          try {
            return (window as any).Prism.highlight(str, (window as any).Prism.languages[lang], lang);
          } catch (__) {}
        }
        return '';
      }
    });

    instance.use(mk);

    ['tip', 'warning', 'danger', 'info'].forEach(type => {
        instance.use(mdContainer, type, {
            render: (tokens: any, idx: any) => {
                const m = tokens[idx].info.trim().match(new RegExp(`^${type}\\s*(.*)$`));
                if (tokens[idx].nesting === 1) {
                    return `<div class="custom-container ${type}"><span class="custom-container-title">${m[1] || type}</span>\n`;
                } else {
                    return '</div>\n';
                }
            }
        });
    });

    instance.use(mdTasks, { label: true, labelAfter: true });
    instance.use(mdMark);

    return instance;
  }, []);

  // Use simple text comparison to avoid unnecessary processing on identical content chunks
  const sanitizedHTML = useMemo(() => {
    let rawHtml = md.render(content);
    return DOMPurify.sanitize(rawHtml, {
      ADD_TAGS: ['math', 'annotation', 'semantics', 'mn', 'mo', 'mi', 'msup', 'msub', 'mfrac', 'mrow', 'span', 'img', 'svg', 'line', 'input', 'button'],
      ADD_ATTR: ['class', 'style', 'onclick', 'src', 'alt', 'width', 'height', 'loading', 'viewBox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'x1', 'y1', 'x2', 'y2', 'type', 'checked', 'disabled'],
    });
  }, [content, md]);

  useEffect(() => {
    if (containerRef.current) {
      // Event Delegation for Copy Buttons
      const handleCopy = async (e: MouseEvent) => {
          const target = e.target as HTMLElement;
          const btn = target.closest('.copy-btn');
          if (btn) {
              const wrapper = btn.closest('.code-block-wrapper');
              if (wrapper) {
                  // Find the code element inside this wrapper
                  const codeElement = wrapper.querySelector('code');
                  if (codeElement && codeElement.innerText) {
                      try {
                          await navigator.clipboard.writeText(codeElement.innerText);
                          const originalText = btn.textContent;
                          btn.textContent = 'COPIED';
                          setTimeout(() => {
                              btn.textContent = 'COPY';
                          }, 2000);
                      } catch (err) {
                          console.error("Failed to copy", err);
                      }
                  }
              }
          }
      };
      
      const container = containerRef.current;
      container.addEventListener('click', handleCopy);

      // Katex
      try {
        renderMathInElement(container, {
          delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '\\(', right: '\\)', display: false},
            {left: '\\[', right: '\\]', display: true},
          ],
          throwOnError: false,
        });
      } catch (e) {}

      // Mermaid - Safe initialization
      if (container.querySelector('.mermaid')) {
          try {
              (window as any).mermaid.init(undefined, container.querySelectorAll('.mermaid'));
          } catch (err) {
              console.debug("Mermaid rendering incomplete");
          }
      }
      
      return () => {
          container.removeEventListener('click', handleCopy);
      };
    }
  }, [sanitizedHTML]);

  return (
    <div 
      ref={containerRef}
      className="prose prose-lg max-w-none text-gray-800 font-serif-custom leading-relaxed 
                 prose-headings:font-sans prose-headings:font-bold prose-headings:text-gray-900 
                 prose-p:text-gray-700 prose-p:font-medium prose-p:leading-8
                 prose-a:text-[#008080] prose-a:font-bold hover:prose-a:underline
                 prose-strong:font-black prose-strong:text-gray-900
                 prose-code:text-[#008080] prose-code:bg-[#008080]/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-semibold
                 prose-pre:bg-gray-50 prose-pre:text-gray-700
                 prose-li:text-gray-700"
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }} 
    />
  );
});
