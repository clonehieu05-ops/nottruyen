import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import StoryDetailPage from './pages/StoryDetailPage'
import ReaderPage from './pages/ReaderPage'
import AdminPage from './pages/AdminPage'

function App() {
    return (
        <>
            <Navbar />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/story/:id" element={<StoryDetailPage />} />
                <Route path="/read/:id/:chapter" element={<ReaderPage />} />
                <Route path="/admin" element={<AdminPage />} />
            </Routes>
        </>
    )
}

export default App

