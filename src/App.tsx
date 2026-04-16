import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './app/AppLayout'
import { AboutPage } from './components/pages/AboutPage'
import { DataPage } from './components/pages/DataPage'
import { GlossaryPage } from './components/pages/GlossaryPage'
import { HomePage } from './components/pages/HomePage'
import { MasterclassesPage } from './components/pages/MasterclassesPage'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/data" element={<DataPage />} />
        <Route path="/glossary" element={<GlossaryPage />} />
        <Route path="/masterclasses" element={<MasterclassesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
