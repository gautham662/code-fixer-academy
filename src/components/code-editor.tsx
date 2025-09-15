import { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from '@/components/theme-provider';

interface CodeEditorProps {
  language: string;
  value: string;
  onChange: (value: string | undefined) => void;
  height?: string;
  readOnly?: boolean;
}

const languageMap: Record<string, string> = {
  python: 'python',
  javascript: 'javascript',
  java: 'java',
  cpp: 'cpp',
  go: 'go',
  rust: 'rust',
};

export function CodeEditor({
  language,
  value,
  onChange,
  height = '400px',
  readOnly = false,
}: CodeEditorProps) {
  const { theme } = useTheme();
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    editor.focus();
  };

  const editorTheme = theme === 'dark' ? 'vs-dark' : 'light';
  const monacoLanguage = languageMap[language] || 'plaintext';

  return (
    <div className="border border-border rounded-md overflow-hidden">
      <Editor
        height={height}
        language={monacoLanguage}
        value={value}
        onChange={onChange}
        onMount={handleEditorDidMount}
        theme={editorTheme}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: 'JetBrains Mono, Monaco, Menlo, Ubuntu Mono, monospace',
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          wordWrap: 'on',
          readOnly,
          contextmenu: true,
          selectOnLineNumbers: true,
          roundedSelection: false,
          cursorStyle: 'line',
          folding: true,
          showFoldingControls: 'always',
          bracketPairColorization: {
            enabled: true,
          },
        }}
      />
    </div>
  );
}