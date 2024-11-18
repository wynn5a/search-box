"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { AddClusterDialog } from "./add-cluster-dialog"

export function AddClusterButton() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  return (
    <AddClusterDialog 
      open={open} 
      onOpenChange={setOpen}
      onSuccess={() => {
        setOpen(false)
        router.refresh()
      }}
      trigger={
        <Button variant="outline" size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          添加集群
        </Button>
      }
    />
  )
} 