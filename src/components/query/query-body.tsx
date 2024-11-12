"use client"

import { Card } from "@/components/ui/card"
import Editor from "@monaco-editor/react"

interface QueryBodyProps {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
}

export function QueryBody({ value, onChange, readOnly = false }: QueryBodyProps) {
  return (
    <Card className="flex flex-col h-full min-h-0">
      <div className="border-b p-2 text-sm text-muted-foreground">
        请求体 {readOnly && <span className="text-muted-foreground">(GET 请求不需要请求体)</span>}
      </div>
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage="json"
          value={value}
          onChange={(value) => onChange(value || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            formatOnPaste: true,
            formatOnType: true,
            readOnly: readOnly,
          }}
        />
      </div>
    </Card>
  )
} 