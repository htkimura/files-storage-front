import { Layout } from '@/components/layout/layout'
import { config } from '@/config'
import { useUser } from '@/contexts'
import axios from 'axios'
import { CloudUploadIcon } from 'lucide-react'
import { useDropzone } from 'react-dropzone'

export const Home = () => {
  const { token } = useUser()
  const { getRootProps, getInputProps } = useDropzone({
    noKeyboard: true,
    onDrop: async (acceptedFiles) => {
      acceptedFiles.forEach(async (file) => {
        try {
          const { data } = await axios.get(
            config.apiBaseUrl + '/uploads/presigned-url',
            {
              params: {
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
              },
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          )

          const { url } = data

          await axios.put(url, file, {
            headers: {
              'Content-Type': file.type,
            },
          })
        } catch (error) {
          console.error('[error]', error)
        }
      })
    },
  })
  return (
    <Layout>
      <button
        className="border-2 border-dashed max-w-xl  p-10 flex items-center justify-center flex-col m-auto mt-10 hover:border-orange-500 hover:bg-orange-50 transition-all duration-75"
        {...getRootProps()}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon />
        <span>Drag & Drop files or click to choose files</span>
      </button>
      <div>
        <h1>Home Page</h1>
        <p>Home page content</p>
        <p>Home page content</p>
        <p>Home page content</p>
        <p>Home page content</p>
        <p>Home page content</p>
        <p>Home page content</p>
        <p>Home page content</p>
        <p>Home page content</p>
        <p>Home page content</p>
        <p>Home page content</p>
        <p>Home page content</p>
        <p>Home page content</p>
        <p>Home page content</p>
        <p>Home page content</p>
        <p>Home page content</p>
        <p>Home page content</p>
        <p>Home page content</p>
        <p>Home page content</p>
        <p>Home page content</p>
        <p>Home page content</p>
        <p>Home page content</p>
        <p>Home page content</p>
        <p>Home page content</p>
        <p>Home page content</p>
        <p>Home page content</p>
        <p>Home page content</p>
        <p>Home page content</p>
        <p>Home page content</p>
      </div>
    </Layout>
  )
}
