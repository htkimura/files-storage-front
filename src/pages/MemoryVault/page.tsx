import { MEMORY_VAULT_ROOT_LABEL } from './constants'
import { MemoryVaultPageContent } from './MemoryVaultPageContent'

export const MemoryVault = () => {
  return (
    <MemoryVaultPageContent
      folderId={null}
      title={MEMORY_VAULT_ROOT_LABEL}
      description="Drop files anywhere to upload. Drag items onto a folder or breadcrumb to move them."
    />
  )
}
