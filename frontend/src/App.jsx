import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Chat from './components/Chat'
import './App.css'

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [username, setUsername] = useState(localStorage.getItem('username'))

  const handleLogin = (newToken, newUsername) => {
    localStorage.setItem('token', newToken)
    localStorage.setItem('username', newUsername)
    setToken(newToken)
    setUsername(newUsername)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    setToken(null)
    setUsername(null)
  }

  return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={
            token ? <Navigate to="/chat" /> : <Login onLogin={handleLogin} />
          } />
          <Route path="/chat" element={
            token ? <Chat token={token} username={username} onLogout={handleLogout} />
                : <Navigate to="/login" />
          } />
          <Route path="*" element={<Navigate to={token ? "/chat" : "/login"} />} />
        </Routes>
      </BrowserRouter>
  )
}

export default App