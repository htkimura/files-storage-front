import { Route, Routes } from 'react-router-dom'
import { NotFound } from './pages/NotFound'
import { HOME_PAGE_ROUTE } from './routes'
import { Login } from './pages/Login'
import './css/base.css'
import './css/typography.css'
import './css/variables.css'
import { Home } from './pages/Home'

function App() {
  return (
    <Routes>
      <Route path={HOME_PAGE_ROUTE} element={<Home />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
