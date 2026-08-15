'use client';

import type { Theme, SxProps } from '@mui/material/styles';

import React from 'react';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import ReactMarkdown from 'react-markdown';

import Box from '@mui/material/Box';

import { KatexMath } from 'src/components/katex';
import { MermaidDiagram } from 'src/components/mermaid';

export interface RichContentSegment {
  type: 'markdown' | 'inlineMath' | 'displayMath' | 'erd';
  content: string;
}

export function parseRichContent(text: string): RichContentSegment[] {
  if (!text || !text.trim()) return [];

  const trimmed = text.trim();

  // Check for ERD diagram blocks or erDiagram syntax
  if (trimmed.startsWith('erDiagram') || trimmed.includes('```mermaid')) {
    const mermaidMatch = trimmed.match(/```mermaid\s*([\s\S]*?)```/);
    if (mermaidMatch) {
      const before = trimmed.slice(0, mermaidMatch.index).trim();
      const erdCode = mermaidMatch[1].trim();
      const after = trimmed.slice((mermaidMatch.index || 0) + mermaidMatch[0].length).trim();
      const segments: RichContentSegment[] = [];
      if (before) segments.push(...parseRichContent(before));
      segments.push({ type: 'erd', content: erdCode });
      if (after) segments.push(...parseRichContent(after));
      return segments;
    }
    return [{ type: 'erd', content: trimmed }];
  }

  const segments: RichContentSegment[] = [];
  const mathRegex = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null = null;

  while ((match = mathRegex.exec(text)) !== null) {
    const textBefore = text.substring(lastIndex, match.index);
    if (textBefore) {
      segments.push({ type: 'markdown', content: textBefore });
    }

    if (match[1]) {
      segments.push({ type: 'displayMath', content: match[1] });
    } else if (match[2]) {
      segments.push({ type: 'inlineMath', content: match[2] });
    }

    lastIndex = mathRegex.lastIndex;
  }

  const remaining = text.substring(lastIndex);
  if (remaining) {
    // Detect raw KaTeX commands if not delimited by $
    const isPureMath =
      /^\s*\\(frac|sqrt|int|sum|lim|alpha|beta|theta|pi|infty|matrix|vec|pm|le|ge|neq|times|div|cdot)\b/.test(
        remaining
      );

    if (isPureMath) {
      segments.push({ type: 'displayMath', content: remaining.trim() });
    } else {
      segments.push({ type: 'markdown', content: remaining });
    }
  }

  return segments;
}

interface RichContentRendererProps {
  content: string;
  idPrefix?: string;
  sx?: SxProps<Theme>;
  inline?: boolean;
}

export function RichContentRenderer({
  content,
  idPrefix = 'rich_content',
  sx,
  inline = false,
}: RichContentRendererProps) {
  if (!content || !content.trim()) {
    return null;
  }

  const segments = parseRichContent(content);

  return (
    <Box
      component={inline ? 'span' : 'div'}
      sx={{
        display: inline ? 'inline-flex' : 'flex',
        flexDirection: inline ? 'row' : 'column',
        alignItems: inline ? 'center' : 'stretch',
        flexWrap: inline ? 'wrap' : 'nowrap',
        gap: 0.5,
        '& p': {
          m: 0,
          display: inline ? 'inline' : 'block',
          fontSize: 14,
          lineHeight: 1.6,
        },
        '& code': {
          px: 0.5,
          py: 0.25,
          borderRadius: 0.5,
          fontSize: 13,
          fontFamily: 'monospace',
          bgcolor: (t) => t.palette.action.hover,
          color: 'error.main',
        },
        '& blockquote': {
          m: 0,
          pl: 1.5,
          borderLeft: (t) => `3px solid ${t.palette.primary.main}`,
        },
        ...sx,
      }}
    >
      {segments.map((seg, idx) => {
        if (seg.type === 'erd') {
          return (
            <Box key={idx} sx={{ my: inline ? 0.5 : 1, width: '100%' }}>
              <MermaidDiagram chart={seg.content} idPrefix={`${idPrefix}_erd_${idx}`} />
            </Box>
          );
        }

        if (seg.type === 'inlineMath') {
          return <KatexMath key={idx} math={seg.content} inline />;
        }

        if (seg.type === 'displayMath') {
          return <KatexMath key={idx} math={seg.content} inline={inline} />;
        }

        return (
          <Box key={idx} component={inline ? 'span' : 'div'}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
              {seg.content}
            </ReactMarkdown>
          </Box>
        );
      })}
    </Box>
  );
}

export default RichContentRenderer;
