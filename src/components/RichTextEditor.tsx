'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Schreibe hier...',
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none focus:outline-none min-h-[300px] p-4',
      },
    },
    immediatelyRender: false,
  });

  if (!isMounted) {
    return (
      <div className="border-2 border-gray-300 rounded-xl p-4 min-h-[300px] bg-gray-50 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>
    );
  }

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({ 
    onClick, 
    active, 
    children,
    label
  }: { 
    onClick: () => void; 
    active?: boolean; 
    children: React.ReactNode;
    label: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`relative group px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
        active 
          ? 'bg-yellow-500 text-black font-medium' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {children}
      <span className="text-sm">{label}</span>
      {active && (
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
      )}
    </button>
  );

  return (
    <div className="border-2 border-gray-300 rounded-xl overflow-hidden focus-within:border-yellow-500 focus-within:ring-2 focus-within:ring-yellow-500/30 transition-all">
      <div className="flex flex-wrap gap-1 p-3 bg-gray-50 border-b border-gray-300">
        <div className="flex items-center gap-1 mr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive('heading', { level: 1 })}
            label="H1"
          >
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            label="H2"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive('heading', { level: 3 })}
            label="H3"
          >
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>
        </div>
        
        <div className="w-px h-8 bg-gray-300 mx-1" />
        
        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            label="Fett"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            label="Kursiv"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
        </div>
        
        <div className="w-px h-8 bg-gray-300 mx-1" />
        
        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            label="Liste"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            label="Nummeriert"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
            label="Zitat"
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>
        </div>
        
        <div className="flex-1" />
        
        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            label="Rückgängig"
          >
            <Undo className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            label="Wiederholen"
          >
            <Redo className="w-4 h-4" />
          </ToolbarButton>
        </div>
      </div>

      <EditorContent editor={editor} />
      
      <div className="p-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex gap-4">
        <span>• H1 = Hauptüberschrift</span>
        <span>• H2 = Abschnittsüberschrift</span>
        <span>• H3 = Unterüberschrift</span>
      </div>
    </div>
  );
}