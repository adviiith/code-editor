"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { Folder, FolderPlus, File, ChevronRight, ChevronDown, MoreHorizontal, Edit, Trash2 } from "lucide-react"
import "../styles/FolderStructure.css"

const FolderStructure = ({ folders, snippets, onCreateFolder, onDeleteFolder, onRenameFolder, onMoveSnippet }) => {
  const [expandedFolders, setExpandedFolders] = useState({})
  const [newFolderName, setNewFolderName] = useState("")
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [editingFolder, setEditingFolder] = useState(null)
  const [editFolderName, setEditFolderName] = useState("")
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, folderId: null })

  const toggleFolder = (folderId) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }))
  }

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim())
      setNewFolderName("")
      setIsCreatingFolder(false)
    }
  }

  const handleRenameFolder = () => {
    if (editFolderName.trim() && editingFolder) {
      onRenameFolder(editingFolder, editFolderName.trim())
      setEditingFolder(null)
      setEditFolderName("")
    }
  }

  const startEditingFolder = (folderId, currentName, e) => {
    e.stopPropagation()
    setEditingFolder(folderId)
    setEditFolderName(currentName)
    setContextMenu({ visible: false, x: 0, y: 0, folderId: null })
  }

  const showContextMenu = (e, folderId) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      folderId,
    })
  }

  const handleDeleteFolder = (folderId, e) => {
    e.stopPropagation()
    if (window.confirm("Are you sure you want to delete this folder and all its snippets?")) {
      onDeleteFolder(folderId)
    }
    setContextMenu({ visible: false, x: 0, y: 0, folderId: null })
  }

  // Close context menu when clicking elsewhere
  window.addEventListener("click", () => {
    if (contextMenu.visible) {
      setContextMenu({ visible: false, x: 0, y: 0, folderId: null })
    }
  })

  return (
    <div className="folder-structure">
      <div className="folder-header">
        <h3>Folders</h3>
        <button className="create-folder-button" onClick={() => setIsCreatingFolder(true)}>
          <FolderPlus size={16} />
        </button>
      </div>

      {isCreatingFolder && (
        <div className="new-folder-form">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateFolder()
              if (e.key === "Escape") {
                setIsCreatingFolder(false)
                setNewFolderName("")
              }
            }}
          />
          <div className="folder-form-actions">
            <button onClick={handleCreateFolder}>Create</button>
            <button
              onClick={() => {
                setIsCreatingFolder(false)
                setNewFolderName("")
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="folders-list">
        {folders.length === 0 ? (
          <div className="no-folders">
            <p>No folders yet. Create your first folder!</p>
          </div>
        ) : (
          folders.map((folder) => {
            const folderSnippets = snippets.filter((snippet) => snippet.folderId === folder.id)
            const isExpanded = expandedFolders[folder.id]

            return (
              <div key={folder.id} className="folder-item">
                <div
                  className="folder-row"
                  onClick={() => toggleFolder(folder.id)}
                  onContextMenu={(e) => showContextMenu(e, folder.id)}
                >
                  {isExpanded ? (
                    <ChevronDown size={16} className="folder-icon-toggle" />
                  ) : (
                    <ChevronRight size={16} className="folder-icon-toggle" />
                  )}

                  <Folder size={16} className="folder-icon" />

                  {editingFolder === folder.id ? (
                    <input
                      type="text"
                      value={editFolderName}
                      onChange={(e) => setEditFolderName(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameFolder()
                        if (e.key === "Escape") {
                          setEditingFolder(null)
                          setEditFolderName("")
                        }
                        e.stopPropagation()
                      }}
                      onBlur={handleRenameFolder}
                    />
                  ) : (
                    <span className="folder-name">{folder.name}</span>
                  )}

                  <span className="folder-count">{folderSnippets.length}</span>

                  <button className="folder-menu-button" onClick={(e) => showContextMenu(e, folder.id)}>
                    <MoreHorizontal size={16} />
                  </button>
                </div>

                {isExpanded && (
                  <div className="folder-snippets">
                    {folderSnippets.length === 0 ? (
                      <div className="no-snippets-in-folder">
                        <p>No snippets in this folder</p>
                      </div>
                    ) : (
                      folderSnippets.map((snippet) => (
                        <Link key={snippet.id} to={`/snippets/${snippet.id}`} className="snippet-item">
                          <File size={14} />
                          <span className="snippet-name">{snippet.title}</span>
                          <span className="snippet-language">{snippet.language.toUpperCase()}</span>
                        </Link>
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {contextMenu.visible && (
        <div
          className="folder-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => {
              const folder = folders.find((f) => f.id === contextMenu.folderId)
              if (folder) {
                startEditingFolder(folder.id, folder.name, e)
              }
            }}
          >
            <Edit size={14} />
            Rename
          </button>
          <button onClick={(e) => handleDeleteFolder(contextMenu.folderId, e)}>
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

export default FolderStructure

