"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { Trash2, Edit, Search, Filter, Folder } from "lucide-react"
import "../styles/SnippetList.css"

const SnippetList = ({ snippets, folders, deleteSnippet }) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterLanguage, setFilterLanguage] = useState("")
  const [filterFolder, setFilterFolder] = useState("")

  // Get unique languages for filters
  const languages = [...new Set(snippets.map((snippet) => snippet.language))]

  const filteredSnippets = snippets.filter((snippet) => {
    const matchesSearch =
      snippet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (snippet.analysis?.summary || "").toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLanguage = filterLanguage ? snippet.language === filterLanguage : true
    const matchesFolder = filterFolder ? snippet.folderId === filterFolder : true

    return matchesSearch && matchesLanguage && matchesFolder
  })

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="snippet-list-container">
      <div className="snippet-list-header">
        <h2>My Code Snippets</h2>
        <div className="snippet-filters">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search snippets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-controls">
            <Filter size={16} />
            <select value={filterLanguage} onChange={(e) => setFilterLanguage(e.target.value)}>
              <option value="">All Languages</option>
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang.toUpperCase()}
                </option>
              ))}
            </select>

            <select value={filterFolder} onChange={(e) => setFilterFolder(e.target.value)}>
              <option value="">All Folders</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredSnippets.length === 0 ? (
        <div className="no-snippets">
          <p>No snippets found. Start coding and save your first snippet!</p>
          <Link to="/" className="create-snippet-button">
            Create New Snippet
          </Link>
        </div>
      ) : (
        <div className="snippet-grid">
          {filteredSnippets.map((snippet) => {
            const folder = folders.find((f) => f.id === snippet.folderId)

            return (
              <div key={snippet.id} className="snippet-card">
                <div className="snippet-card-header">
                  <h3>{snippet.title}</h3>
                  <div className="snippet-badges">
                    <span className="language-badge">{snippet.language.toUpperCase()}</span>
                    {folder && (
                      <span className="folder-badge">
                        <Folder size={12} />
                        {folder.name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="snippet-card-body">
                  <p className="snippet-summary">{snippet.analysis?.summary || "No summary available"}</p>
                  <div className="snippet-date">
                    Created: {formatDate(snippet.createdAt)}
                    {snippet.updatedAt && ` (Updated: ${formatDate(snippet.updatedAt)})`}
                  </div>
                </div>

                <div className="snippet-card-actions">
                  <Link to={`/snippets/${snippet.id}`} className="edit-button">
                    <Edit size={16} />
                    View & Edit
                  </Link>
                  <button
                    className="delete-button"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this snippet?")) {
                        deleteSnippet(snippet.id)
                      }
                    }}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SnippetList

