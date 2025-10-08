import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { NotFound } from './pages/NotFound'
import { HOME_PAGE_ROUTE, IMAGES_PAGE_ROUTE, LOGIN_PAGE_ROUTE } from './routes'
import { Login } from './pages/Login'
import './css/base.css'
import './css/typography.css'
import './css/variables.css'
import { useUser } from './contexts'
import { Home } from './pages/Home'
import { Images } from './pages/Images'

const AuthRoute = () => {
  const { token } = useUser()

  if (!token) {
    return <Navigate to={LOGIN_PAGE_ROUTE} replace />
  }

  return <Outlet />
}

function App() {
  return (
    <Routes>
      <Route path={LOGIN_PAGE_ROUTE} element={<Login />} />
      <Route element={<AuthRoute />}>
        <Route path={HOME_PAGE_ROUTE} element={<Home />} />
        <Route path={IMAGES_PAGE_ROUTE} element={<Images />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
