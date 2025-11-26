"use client"

import { Card } from "@/components/ui/card"
import Editor, { useMonaco } from "@monaco-editor/react"
import { useEffect } from "react"
import { useTheme } from "next-themes"

interface QueryBodyProps {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
  isBulkOperation?: boolean
}

export function QueryBody({ 
  value, 
  onChange, 
  readOnly = false,
  isBulkOperation = false 
}: QueryBodyProps) {
  const monaco = useMonaco()
  const { theme } = useTheme()

  useEffect(() => {
    if (monaco) {
      // 为 bulk 操作创建自定义语言
      monaco.languages.register({ id: 'ndjson' })
      monaco.languages.setMonarchTokensProvider('ndjson', {
        tokenizer: {
          root: [
            [/".*?"/, 'string'],
            [/[{}\[\],]/, 'delimiter'],
            [/[0-9]+/, 'number'],
            [/true|false|null/, 'keyword'],
            [/[a-zA-Z_]\w*/, 'identifier'],
          ]
        }
      })
    }
  }, [monaco])

  return (
    <Card className="flex flex-col h-full min-h-0">
      <div className="border-b p-2 text-sm text-muted-foreground">
        请求体 {readOnly && <span className="text-muted-foreground">(GET 请求不需要请求体)</span>}
      </div>
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage={isBulkOperation ? "ndjson" : "json"}
          value={value}
          onChange={(value) => onChange(value || '')}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            formatOnPaste: !isBulkOperation,
            formatOnType: !isBulkOperation,
            readOnly: readOnly
          }}
        />
      </div>
    </Card>
  )
}