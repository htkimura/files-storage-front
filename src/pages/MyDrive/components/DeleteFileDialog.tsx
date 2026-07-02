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
import { Loader2, TrashIcon } from 'lucide-react'

interface DeleteFileDialogProps {
  fileName: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isLoading: boolean
}

export const DeleteFileDialog = ({
  fileName,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: DeleteFileDialogProps) => {
  if (!fileName) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete file</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <b>{fileName}</b>?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose asChild disabled={isLoading}>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            type="submit"
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <TrashIcon />}
            Delete{isLoading && 'ing'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
