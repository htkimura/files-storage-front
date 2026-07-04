import axios from 'axios'

/** Use multipart when the object is larger than this (single PUT stays fine below it). */
const MULTIPART_THRESHOLD_BYTES = 10 * 1024 * 1024

/** Part size (must be ≥ 5 MiB except the last part; 8 MiB is a common choice). */
const PART_SIZE_BYTES = 8 * 1024 * 1024

/** 0–100 while uploading; reaches 100 after the server confirms the object. */
export type UploadProgressCallback = (percent: number) => void

export type UploadFileOptions = {
  onProgress?: UploadProgressCallback
  signal?: AbortSignal
  onMultipartStarted?: (fileId: string) => void
}

function clampPercent(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)))
}

async function uploadSinglePut(
  file: File,
  apiBaseUrl: string,
  headers: Record<string, string>,
  options?: UploadFileOptions,
) {
  const { onProgress, signal } = options ?? {}
  const report = (p: number) => onProgress?.(clampPercent(p))

  report(0)

  const { data } = await axios.get(`${apiBaseUrl}/uploads/presigned-url`, {
    params: {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    },
    headers,
    signal,
  })

  const {
    presignedUploadUrl,
    file: { id: fileId },
  } = data

  await axios.put(presignedUploadUrl, file, {
    headers: {
      'Content-Type': file.type,
    },
    signal,
    onUploadProgress: (e) => {
      const total = e.total && e.total > 0 ? e.total : file.size
      if (total <= 0) return
      report((e.loaded / total) * 92)
    },
  })

  await axios.post(
    `${apiBaseUrl}/uploads/image-uploaded`,
    { fileId },
    { headers, signal },
  )

  report(100)
  return fileId
}

async function uploadMultipart(
  file: File,
  apiBaseUrl: string,
  headers: Record<string, string>,
  options?: UploadFileOptions,
) {
  const { onProgress, signal, onMultipartStarted } = options ?? {}
  const report = (p: number) => onProgress?.(clampPercent(p))

  report(0)

  let createdFileId: string | undefined

  const onAbort = () => {
    if (!createdFileId) return
    void axios.delete(`${apiBaseUrl}/uploads/multipart/abort`, {
      params: { fileId: createdFileId },
      headers,
    })
  }

  signal?.addEventListener('abort', onAbort)

  try {
    const { data: init } = await axios.post(
      `${apiBaseUrl}/uploads/multipart/init`,
      {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      },
      { headers, signal },
    )

    const newFileId = init.file.id

    if (!newFileId) {
      throw new Error('Multipart init did not return a file id')
    }

    createdFileId = newFileId
    onMultipartStarted?.(newFileId)

    const fileId = newFileId
    const partCount = Math.max(1, Math.ceil(file.size / PART_SIZE_BYTES))
    const parts: { partNumber: number; etag: string }[] = []

    let bytesCompleted = 0

    for (let partNumber = 1; partNumber <= partCount; partNumber++) {
      const { data: urlData } = await axios.get(
        `${apiBaseUrl}/uploads/multipart/part-url`,
        {
          params: { fileId, partNumber },
          headers,
          signal,
        },
      )

      const start = (partNumber - 1) * PART_SIZE_BYTES
      const chunk = file.slice(start, start + PART_SIZE_BYTES)
      const chunkLen = chunk.size

      const res = await axios.put(urlData.presignedUrl, chunk, {
        signal,
        onUploadProgress: (e) => {
          const denom = e.total && e.total > 0 ? e.total : chunkLen
          if (denom <= 0 || file.size <= 0) return
          const inChunk = Math.min(1, e.loaded / denom)
          const overallBytes = bytesCompleted + inChunk * chunkLen
          report((overallBytes / file.size) * 94)
        },
      })

      bytesCompleted += chunkLen

      const etag = res.headers.etag

      if (!etag) {
        throw new Error(
          'Storage did not return an ETag for this part. For direct browser uploads to R2/S3, the bucket CORS rules must expose the ETag response header.',
        )
      }

      parts.push({ partNumber, etag })
    }

    await axios.post(
      `${apiBaseUrl}/uploads/multipart/complete`,
      { fileId, parts },
      { headers, signal },
    )

    report(100)
    return fileId
  } catch (err) {
    if (createdFileId && !signal?.aborted) {
      try {
        await axios.delete(`${apiBaseUrl}/uploads/multipart/abort`, {
          params: { fileId: createdFileId },
          headers,
        })
      } catch {
        // ignore cleanup errors
      }
    }
    throw err
  } finally {
    signal?.removeEventListener('abort', onAbort)
  }
}

export async function uploadFileToStorage(
  file: File,
  apiBaseUrl: string,
  headers: Record<string, string>,
  options?: UploadFileOptions,
): Promise<string> {
  if (file.size > MULTIPART_THRESHOLD_BYTES) {
    return uploadMultipart(file, apiBaseUrl, headers, options)
  }
  return uploadSinglePut(file, apiBaseUrl, headers, options)
}
