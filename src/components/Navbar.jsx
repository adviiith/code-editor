"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { Moon, Sun, Code, Settings, Trash2 } from "lucide-react"
import "../styles/Navbar.css"

const Navbar = ({ darkMode, setDarkMode, openSettings }) => {
  const [menuOpen, setMenuOpen] = useState(false)

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Code size={24} />
        <h1>CodeHub</h1>
      </div>

      <div className={`navbar-menu ${menuOpen ? "active" : ""}`}>
        <Link to="/" className="nav-item" onClick={() => setMenuOpen(false)}>
          Editor
        </Link>
        <Link to="/snippets" className="nav-item" onClick={() => setMenuOpen(false)}>
          My Snippets
        </Link>
        <Link to="/recycle-bin" className="nav-item" onClick={() => setMenuOpen(false)}>
          <Trash2 size={16} />
          Recycle Bin
        </Link>
      </div>

      <div className="navbar-actions">
        <button className="theme-toggle" onClick={toggleDarkMode}>
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button className="theme-toggle" onClick={openSettings}>
          <Settings size={20} />
        </button>
        <button className="mobile-menu-button" onClick={() => setMenuOpen(!menuOpen)}>
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  )
}

export default Navbar

