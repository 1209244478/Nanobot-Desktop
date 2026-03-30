import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Chat from './pages/Chat'
import Dashboard from './pages/Dashboard'
import Channels from './pages/Channels'
import Providers from './pages/Providers'
import Skills from './pages/Skills'
import Cron from './pages/Cron'
import Settings from './pages/Settings'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Chat />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="channels" element={<Channels />} />
          <Route path="providers" element={<Providers />} />
          <Route path="skills" element={<Skills />} />
          <Route path="cron" element={<Cron />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
