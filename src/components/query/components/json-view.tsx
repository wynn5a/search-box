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
          minimap: { enabled: true },
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
          },
          // 禁用所有编辑相关的功能
          contextmenu: false,
          quickSuggestions: false,
          suggestOnTriggerCharacters: false,
          acceptSuggestionOnEnter: 'off',
          tabCompletion: 'off',
          parameterHints: {
            enabled: false
          },
          cursorStyle: 'line-thin',
          cursorBlinking: 'solid',
          // 禁用拖放
          dragAndDrop: false,
          // 禁用所有编辑器操作
          matchBrackets: 'never',
          selectionHighlight: false,
          // 禁用右键菜单
          mouseWheelZoom: false
        }}
        className="[&_.monaco-editor]:!bg-transparent"
      />
    </div>
  )
}
