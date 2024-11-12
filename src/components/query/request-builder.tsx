"use client"

import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HttpMethod, Operation, OPERATIONS, OperationType } from "@/types/query"

interface RequestBuilderProps {
  method: HttpMethod
  selectedOperation: OperationType
  selectedIndex: string
  indices: Array<{ index: string }>
  onMethodChange: (method: HttpMethod) => void
  onOperationChange: (operation: OperationType) => void
  onIndexChange: (index: string) => void
  allowedMethods: HttpMethod[]
  requestPath: string
}

export function RequestBuilder({
  method,
  selectedOperation,
  selectedIndex,
  indices,
  onMethodChange,
  onOperationChange,
  onIndexChange,
  allowedMethods,
  requestPath,
}: RequestBuilderProps) {
  return (
    <Card className="shrink-0 p-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <select
            value={method}
            onChange={(e) => onMethodChange(e.target.value as HttpMethod)}
            className="h-9 rounded-md border border-input bg-background px-3"
          >
            {allowedMethods.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <Select 
            value={selectedOperation} 
            onValueChange={onOperationChange}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="选择操作" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>搜索和文档</SelectLabel>
                {OPERATIONS.slice(0, 3).map((op: Operation) => (
                  <SelectItem key={op.value} value={op.value}>
                    {op.label}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>索引操作</SelectLabel>
                {OPERATIONS.slice(3, 10).map((op: Operation) => (
                  <SelectItem key={op.value} value={op.value}>
                    {op.label}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>集群操作</SelectLabel>
                {OPERATIONS.slice(10, 14).map((op: Operation) => (
                  <SelectItem key={op.value} value={op.value}>
                    {op.label}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>其他操作</SelectLabel>
                {OPERATIONS.slice(14).map((op: Operation) => (
                  <SelectItem key={op.value} value={op.value}>
                    {op.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select value={selectedIndex} onValueChange={onIndexChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="选择索引" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>用户索引</SelectLabel>
                {indices
                  .filter(i => !i.index.startsWith('.'))
                  .map(i => (
                    <SelectItem key={i.index} value={i.index}>
                      {i.index}
                    </SelectItem>
                  ))
                }
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>系统索引</SelectLabel>
                {indices
                  .filter(i => i.index.startsWith('.'))
                  .map(i => (
                    <SelectItem key={i.index} value={i.index}>
                      {i.index}
                    </SelectItem>
                  ))
                }
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 text-sm text-muted-foreground">
          请求路径: <code className="bg-muted px-1 py-0.5 rounded">{requestPath}</code>
        </div>
      </div>
    </Card>
  )
} 