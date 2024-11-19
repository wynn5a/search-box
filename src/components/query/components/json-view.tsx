import { useTheme } from "next-themes"
import Editor from "@monaco-editor/react"

interface JsonViewProps {
  value: string
}

export function JsonView({ value }: JsonViewProps) {
  const { theme } = useTheme()

  return (
    <div className="h-full border rounded-md relative">
      <Editor
        height="100%"
        defaultLanguage="json"
        value={value}
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        options={{
          minimap: { enabled: false },
          folding: true,
          foldingHighlight: true,
          lineNumbers: 'on',
          renderValidationDecorations: 'on',
          scrollBeyondLastLine: false,
          readOnly: true,
          wordWrap: 'on',
          fontSize: 13,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          renderLineHighlight: 'none',
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
          overviewRulerLanes: 0,
          guides: {
            indentation: true,
            bracketPairs: true
          },
          bracketPairColorization: {
            enabled: true
          }
        }}
        className="[&_.monaco-editor]:!bg-transparent"
      />
    </div>
  )
}
