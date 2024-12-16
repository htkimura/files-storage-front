import { Route, Routes } from 'react-router-dom'
import { NotFound } from './pages/NotFound'
import './css/base.css'
import './css/typography.css'
import './css/variables.css'

function App() {
  return (
    <Routes>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
