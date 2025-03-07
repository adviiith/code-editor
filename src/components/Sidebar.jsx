"use client"

import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { Code, FileText, Trash2 } from "lucide-react"
import FolderStructure from "./FolderStructure"
import "../styles/Sidebar.css"

const Sidebar = ({ folders, snippets, onCreateFolder, onDeleteFolder, onRenameFolder, onMoveSnippet }) => {
  const location = useLocation()
  const [activeTab, setActiveTab] = useState("folders")

  useEffect(() => {
    // Set active tab based on current route
    if (location.pathname === "/") {
      setActiveTab("editor")
    } else if (location.pathname.includes("/snippets")) {
      setActiveTab("folders")
    } else if (location.pathname === "/recycle-bin") {
      setActiveTab("recycle-bin")
    }
  }, [location])

  return (
    <div className="sidebar">
      <div className="sidebar-tabs">
        <Link
          to="/"
          className={`sidebar-tab ${activeTab === "editor" ? "active" : ""}`}
          onClick={() => setActiveTab("editor")}
        >
          <Code size={20} />
          <span>Editor</span>
        </Link>
        <button
          className={`sidebar-tab ${activeTab === "folders" ? "active" : ""}`}
          onClick={() => setActiveTab("folders")}
        >
          <FileText size={20} />
          <span>Folders</span>
        </button>
        <Link
          to="/recycle-bin"
          className={`sidebar-tab ${activeTab === "recycle-bin" ? "active" : ""}`}
          onClick={() => setActiveTab("recycle-bin")}
        >
          <Trash2 size={20} />
          <span>Recycle Bin</span>
        </Link>
      </div>

      <div className="sidebar-content">
        {activeTab === "folders" && (
          <FolderStructure
            folders={folders}
            snippets={snippets}
            onCreateFolder={onCreateFolder}
            onDeleteFolder={onDeleteFolder}
            onRenameFolder={onRenameFolder}
            onMoveSnippet={onMoveSnippet}
          />
        )}
      </div>
    </div>
  )
}

export default Sidebar

