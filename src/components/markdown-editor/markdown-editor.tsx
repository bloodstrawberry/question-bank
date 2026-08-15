'use client';

import { useState, useCallback, useMemo, useEffect, useRef, memo } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { Link } from '@tiptap/extension-link';
import { Placeholder } from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { TableKit } from '@tiptap/extension-table';
import { Markdown } from 'tiptap-markdown';
import { Icon } from '@iconify/react';
import { debounce } from 'es-toolkit';

import { focusNextInput } from 'src/sections/file-manager/components/problem-set/focus-utils';

// ----------------------------------------------------------------------

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  icon: string;
  title: string;
  disabled?: boolean;
}

function ToolbarButton({ onClick, active, icon, title, disabled }: ToolbarButtonProps) {
  const theme = useTheme();
  return (
    <Box
      component="button"
      tabIndex={-1}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      title={title}
      sx={{
        p: 0.75,
        borderRadius: 1,
        border: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        bgcolor: active ? alpha(theme.palette.primary.main, 0.12) : 'transparent',
        color: active ? 'primary.main' : 'text.secondary',
        opacity: disabled ? 0.3 : 0.8,
        transition: (t) => t.transitions.create(['background-color', 'color', 'opacity']),
        '&:hover': {
          bgcolor: active
            ? alpha(theme.palette.primary.main, 0.18)
            : alpha(theme.palette.text.primary, 0.05),
          opacity: 1,
        },
      }}
    >
      <Icon icon={icon} width={18} height={18} />
    </Box>
  );
}

function ToolbarDivider() {
  return (
    <Box
      sx={{
        mx: 0.5,
        height: 20,
        width: '1px',
        bgcolor: 'divider',
        alignSelf: 'center',
      }}
    />
  );
}

interface ToolbarProps {
  editor: Editor;
  colorInputRef: React.RefObject<HTMLInputElement | null>;
  highlightInputRef: React.RefObject<HTMLInputElement | null>;
}

function Toolbar({ editor, colorInputRef, highlightInputRef }: ToolbarProps) {
  const addLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL을 입력하세요', previousUrl || 'https://');
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 0.5,
        p: 1,
        borderBottom: (t) => `1px solid ${t.palette.divider}`,
        bgcolor: (t) => alpha(t.palette.grey[500], 0.04),
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Heading Selector */}
      <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
        <select
          tabIndex={-1}
          value={
            editor.isActive('heading', { level: 1 })
              ? '1'
              : editor.isActive('heading', { level: 2 })
                ? '2'
                : editor.isActive('heading', { level: 3 })
                  ? '3'
                  : editor.isActive('heading', { level: 4 })
                    ? '4'
                    : editor.isActive('heading', { level: 5 })
                      ? '5'
                      : editor.isActive('heading', { level: 6 })
                        ? '6'
                        : 'p'
          }
          onChange={(e) => {
            const value = e.target.value;
            if (value === 'p') {
              editor.chain().focus().setParagraph().run();
            } else {
              editor
                .chain()
                .focus()
                .toggleHeading({ level: parseInt(value, 10) as any })
                .run();
            }
          }}
          style={{
            background: 'transparent',
            color: 'inherit',
            fontSize: '13px',
            fontWeight: 600,
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid currentColor',
            borderColor: 'rgba(0,0,0,0.15)',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="p">본문</option>
          <option value="1">H1</option>
          <option value="2">H2</option>
          <option value="3">H3</option>
          <option value="4">H4</option>
          <option value="5">H5</option>
          <option value="6">H6</option>
        </select>
      </Box>

      <ToolbarDivider />

      {/* Basic Styles */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        icon="material-symbols:format-bold"
        title="Bold"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        icon="material-symbols:format-italic"
        title="Italic"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive('underline')}
        icon="material-symbols:format-underlined"
        title="Underline"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive('strike')}
        icon="material-symbols:strikethrough-s"
        title="Strikethrough"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive('code')}
        icon="material-symbols:code"
        title="Code Inline"
      />

      <ToolbarDivider />

      {/* Text Colors */}
      <Box sx={{ display: 'flex', gap: 0.5, position: 'relative' }}>
        <ToolbarButton
          onClick={() => colorInputRef.current?.click()}
          active={editor.isActive('textStyle', { color: editor.getAttributes('textStyle').color })}
          icon="material-symbols:format-color-text"
          title="Text Color"
        />
        <input
          ref={colorInputRef}
          type="color"
          tabIndex={-1}
          style={{ visibility: 'hidden', position: 'absolute', width: 0, height: 0 }}
          onInput={(e) => {
            editor
              .chain()
              .focus()
              .setColor((e.target as HTMLInputElement).value)
              .run();
          }}
        />

        <ToolbarButton
          onClick={() => highlightInputRef.current?.click()}
          active={editor.isActive('highlight')}
          icon="material-symbols:format-ink-highlighter"
          title="Highlight"
        />
        <input
          ref={highlightInputRef}
          type="color"
          tabIndex={-1}
          style={{ visibility: 'hidden', position: 'absolute', width: 0, height: 0 }}
          onInput={(e) => {
            editor
              .chain()
              .focus()
              .toggleHighlight({ color: (e.target as HTMLInputElement).value })
              .run();
          }}
        />

        <ToolbarButton
          onClick={() => editor.chain().focus().unsetColor().unsetHighlight().run()}
          icon="material-symbols:format-color-reset"
          title="Reset Color"
        />
      </Box>

      <ToolbarDivider />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        icon="material-symbols:format-list-bulleted"
        title="Bullet List"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        icon="material-symbols:format-list-numbered"
        title="Ordered List"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        active={editor.isActive('taskList')}
        icon="material-symbols:checklist"
        title="Task List"
      />

      <ToolbarDivider />

      {/* Alignments */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        active={editor.isActive({ textAlign: 'left' })}
        icon="material-symbols:format-align-left"
        title="Align Left"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        active={editor.isActive({ textAlign: 'center' })}
        icon="material-symbols:format-align-center"
        title="Align Center"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        active={editor.isActive({ textAlign: 'right' })}
        icon="material-symbols:format-align-right"
        title="Align Right"
      />

      <ToolbarDivider />

      {/* Formatting & Insertions */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive('blockquote')}
        icon="material-symbols:format-quote"
        title="Blockquote"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive('codeBlock')}
        icon="material-symbols:terminal"
        title="Code Block"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        icon="material-symbols:horizontal-rule"
        title="Horizontal Rule"
      />
      <ToolbarButton
        onClick={addLink}
        active={editor.isActive('link')}
        icon="material-symbols:link"
        title="Insert Link"
      />

      <ToolbarDivider />

      {/* Table Actions */}
      <ToolbarButton
        onClick={() =>
          (editor.chain().focus() as any)
            .insertTable?.({ rows: 3, cols: 3, withHeaderRow: true })
            ?.run()
        }
        active={editor.isActive('table')}
        icon="material-symbols:table-chart-outline"
        title="표 삽입 (3x3)"
      />

      {editor.isActive('table') && (
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <ToolbarButton
            onClick={() => (editor.chain().focus() as any).addColumnBefore?.()?.run()}
            icon="material-symbols:add-column-left-outline"
            title="왼쪽에 열 추가"
          />
          <ToolbarButton
            onClick={() => (editor.chain().focus() as any).addColumnAfter?.()?.run()}
            icon="material-symbols:add-column-right-outline"
            title="오른쪽에 열 추가"
          />
          <ToolbarButton
            onClick={() => (editor.chain().focus() as any).deleteColumn?.()?.run()}
            icon="material-symbols:delete-column-outline"
            title="현재 열 삭제"
          />
          <ToolbarButton
            onClick={() => (editor.chain().focus() as any).addRowBefore?.()?.run()}
            icon="material-symbols:add-row-above-outline"
            title="위에 행 추가"
          />
          <ToolbarButton
            onClick={() => (editor.chain().focus() as any).addRowAfter?.()?.run()}
            icon="material-symbols:add-row-below-outline"
            title="아래에 행 추가"
          />
          <ToolbarButton
            onClick={() => (editor.chain().focus() as any).deleteRow?.()?.run()}
            icon="material-symbols:delete-row-outline"
            title="현재 행 삭제"
          />
          <ToolbarButton
            onClick={() => (editor.chain().focus() as any).toggleHeaderRow?.()?.run()}
            active={editor.isActive('tableHeader')}
            icon="material-symbols:table-rows-narrow-outline"
            title="헤더 행 설정/해제"
          />
          <ToolbarButton
            onClick={() => (editor.chain().focus() as any).deleteTable?.()?.run()}
            icon="material-symbols:table-rows-delete-outline"
            title="표 삭제"
          />
        </Box>
      )}

      <ToolbarButton
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        icon="material-symbols:format-clear"
        title="Clear Formatting"
      />
    </Box>
  );
}

// ----------------------------------------------------------------------

interface MarkdownEditorProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
  readOnly?: boolean;
  hideHeader?: boolean;
}

export const MarkdownEditor = memo(function MarkdownEditor({
  label,
  value,
  onChange,
  placeholder,
  minRows = 4,
  readOnly = false,
  hideHeader = false,
}: MarkdownEditorProps) {
  const theme = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const isLocalChangeRef = useRef(false);

  const debouncedOnChange = useMemo(
    () =>
      debounce((val: string) => {
        isLocalChangeRef.current = true;
        onChangeRef.current(val);
      }, 400),
    []
  );

  useEffect(() => {
    return () => {
      debouncedOnChange.cancel();
    };
  }, [debouncedOnChange]);

  const colorInputRef = useRef<HTMLInputElement>(null);
  const highlightInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Markdown.configure({
        html: true,
        tightLists: true,
        tightListClass: 'tight',
        bulletListMarker: '-',
        linkify: true,
        breaks: true,
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: placeholder || '상세 내용을 입력하세요...',
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      TableKit.configure({
        table: {
          resizable: true,
        },
      }),
    ],
    content: value || '',
    onUpdate: ({ editor: currentEditor }) => {
      const markdown = (currentEditor.storage as any).markdown.getMarkdown();
      debouncedOnChange(markdown);
    },
    onBlur: ({ editor: currentEditor }) => {
      const markdown = (currentEditor.storage as any).markdown.getMarkdown();
      debouncedOnChange.cancel();
      isLocalChangeRef.current = true;
      onChangeRef.current(markdown);
    },
    editable: !readOnly,
    immediatelyRender: false,
    editorProps: {
      handleKeyDown(view, event) {
        if (event.key === 'Tab') {
          const handled = focusNextInput(view.dom, event.shiftKey);
          if (handled) {
            return true;
          }
        }
        return false;
      },
    },
  });

  // Sync external changes (e.g. load, reset) back to editor
  useEffect(() => {
    if (!editor || !isMounted || value === undefined) return;

    if (isLocalChangeRef.current) {
      isLocalChangeRef.current = false;
      return;
    }

    if (editor.isFocused || editor.view.composing) {
      return;
    }

    const currentMarkdown = (editor.storage as any).markdown.getMarkdown();
    if (value !== currentMarkdown) {
      editor.commands.setContent(value);
    }
  }, [value, editor, isMounted]);

  // Sync editability
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [editor, readOnly]);

  if (!isMounted) {
    return null;
  }

  return (
    <Box
      sx={{
        border: `1px solid ${alpha(theme.palette.grey[500], 0.2)}`,
        borderRadius: 1.5,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        '&:focus-within': {
          borderColor: 'primary.main',
          borderWidth: 1.5,
        },
        transition: (t) => t.transitions.create(['border-color']),
      }}
    >
      {/* Label/Header banner */}
      {!hideHeader && label && (
        <Box
          sx={{
            px: 1.5,
            py: 0.75,
            borderBottom: `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
            bgcolor: alpha(theme.palette.grey[500], 0.04),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: 'text.secondary',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {label}
          </Typography>
        </Box>
      )}

      {/* TipTap WYSIWYG Toolbar */}
      {editor && !readOnly && (
        <Toolbar
          editor={editor}
          colorInputRef={colorInputRef}
          highlightInputRef={highlightInputRef}
        />
      )}

      {/* Editor Content Area */}
      <Box
        onClick={() => {
          if (editor && !editor.isFocused && !readOnly) {
            editor.commands.focus();
          }
        }}
        sx={{
          flexGrow: 1,
          px: 2,
          py: 1.5,
          minHeight: `${minRows * 24 + 24}px`,
          cursor: readOnly ? 'default' : 'text',
          outline: 'none',
          '& .tiptap': {
            minHeight: `${minRows * 24}px`,
            outline: 'none',
            fontSize: '14px',
            lineHeight: 1.8,
            fontFamily: theme.typography.fontFamily,
            color: 'text.primary',
            '& p': { m: 0, mb: 1, '&:last-child': { mb: 0 } },
            '& p.is-editor-empty:first-of-type::before': {
              color: 'text.disabled',
              content: 'attr(data-placeholder)',
              float: 'left',
              height: 0,
              pointerEvents: 'none',
            },
            '& h1, & h2, & h3, & h4, & h5, & h6': {
              mt: 2,
              mb: 1,
              fontWeight: 700,
              lineHeight: 1.4,
            },
            '& h1': { fontSize: '24px' },
            '& h2': { fontSize: '20px' },
            '& h3': { fontSize: '17px' },
            '& ul, & ol': {
              pl: 3,
              mb: 1.5,
              '& li': {
                mb: 0.5,
              },
            },
            '& ul[data-type="taskList"]': {
              listStyle: 'none',
              pl: 0,
              '& li': {
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                '& label': {
                  display: 'flex',
                  alignItems: 'center',
                  userSelect: 'none',
                  mt: '3px',
                },
                '& div': {
                  flex: '1 1 auto',
                },
              },
            },
            '& code': {
              px: 0.75,
              py: 0.25,
              borderRadius: 0.5,
              fontSize: '13px',
              fontFamily: 'monospace',
              bgcolor: alpha(theme.palette.grey[500], 0.12),
              color: 'error.main',
            },
            '& pre': {
              p: 2,
              borderRadius: 1,
              overflow: 'auto',
              bgcolor: alpha(theme.palette.grey[500], 0.08),
              '& code': {
                px: 0,
                py: 0,
                bgcolor: 'transparent',
                color: 'inherit',
              },
            },
            '& blockquote': {
              m: 0,
              mb: 1.5,
              pl: 2,
              borderLeft: `3px solid ${theme.palette.primary.main}`,
              color: 'text.secondary',
              fontStyle: 'italic',
            },
            '& strong': { fontWeight: 700 },
            '& em': { fontStyle: 'italic' },
            '& hr': {
              my: 2,
              border: 'none',
              borderTop: `1px dashed ${theme.palette.divider}`,
            },
            '& table': {
              borderCollapse: 'collapse',
              tableLayout: 'fixed',
              width: '100%',
              my: 1.5,
              overflow: 'hidden',
              '& td, & th': {
                minWidth: '1em',
                border: `1px solid ${alpha(theme.palette.grey[500], 0.3)}`,
                px: 1.5,
                py: 1,
                verticalAlign: 'top',
                boxSizing: 'border-box',
                position: 'relative',
                '& > *': {
                  mb: 0,
                },
              },
              '& th': {
                fontWeight: 700,
                textAlign: 'left',
                bgcolor: alpha(theme.palette.grey[500], 0.1),
              },
              '& .selectedCell:after': {
                zIndex: 2,
                position: 'absolute',
                content: '""',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                pointerEvents: 'none',
              },
              '& .column-resize-handle': {
                bgcolor: theme.palette.primary.main,
                bottom: 0,
                pointerEvents: 'none',
                position: 'absolute',
                right: -2,
                top: 0,
                width: 4,
              },
            },
          },
        }}
      >
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
});

export default MarkdownEditor;
