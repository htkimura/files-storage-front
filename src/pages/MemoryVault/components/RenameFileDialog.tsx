import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, PencilIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

interface RenameFileDialogProps {
  fileName: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (name: string) => void
  isLoading: boolean
}

export const RenameFileDialog = ({
  fileName,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: RenameFileDialogProps) => {
  const [name, setName] = useState('')

  useEffect(() => {
    if (open && fileName) {
      setName(fileName)
    }
  }, [open, fileName])

  const trimmedName = name.trim()
  const canSubmit =
    Boolean(fileName) && trimmedName.length > 0 && trimmedName !== fileName

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!canSubmit || isLoading) return
    onConfirm(trimmedName)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename file</DialogTitle>
            <DialogDescription>
              Enter a new name for <b>{fileName ?? 'this file'}</b>.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2 py-4">
            <Label htmlFor="file-name">Name</Label>
            <Input
              id="file-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
              disabled={isLoading}
            />
          </div>

          <DialogFooter>
            <DialogClose asChild disabled={isLoading}>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!canSubmit || isLoading}>
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <PencilIcon />
              )}
              Rename{isLoading && 'ing'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
