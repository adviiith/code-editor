"use client"

import { useState } from "react"
import { Trash2, RefreshCw, AlertTriangle, Folder, FileText } from "lucide-react"
import "../styles/RecycleBin.css"

const RecycleBin = ({ deletedItems, folders, restoreItem, permanentlyDeleteItem, emptyRecycleBin }) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("")

  const filteredItems = deletedItems.filter((item) => {
    const matchesSearch =
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.title?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType ? item.type === filterType : true
    return matchesSearch && matchesType
  })

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const calculateDaysLeft = (deletedAt) => {
    const deletedDate = new Date(deletedAt)
    const expiryDate = new Date(deletedDate)
    expiryDate.setDate(expiryDate.getDate() + 30)

    const today = new Date()
    const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24))

    return daysLeft
  }

  return (
    <div className="recycle-bin-container">
      <div className="recycle-bin-header">
        <h2>Recycle Bin</h2>
        <p className="recycle-bin-description">Items in the recycle bin will be automatically deleted after 30 days.</p>

        <div className="recycle-bin-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search deleted items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="filter-select">
            <option value="">All Items</option>
            <option value="folder">Folders</option>
            <option value="snippet">Snippets</option>
          </select>

          <button
            className="empty-bin-button"
            onClick={() => {
              if (window.confirm("Are you sure you want to permanently delete all items in the recycle bin?")) {
                emptyRecycleBin()
              }
            }}
          >
            <Trash2 size={16} />
            Empty Recycle Bin
          </button>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="empty-recycle-bin">
          <Trash2 size={48} />
          <p>Recycle bin is empty</p>
        </div>
      ) : (
        <div className="deleted-items-list">
          {filteredItems.map((item) => {
            const daysLeft = calculateDaysLeft(item.deletedAt)

            return (
              <div key={`${item.type}-${item.id}`} className="deleted-item">
                <div className="deleted-item-icon">
                  {item.type === "folder" ? <Folder size={24} /> : <FileText size={24} />}
                </div>

                <div className="deleted-item-info">
                  <h3>{item.type === "folder" ? item.name : item.title}</h3>
                  <div className="deleted-item-meta">
                    <span className="deleted-item-type">
                      {item.type === "folder" ? "Folder" : `${item.language?.toUpperCase() || "Code"} Snippet`}
                    </span>
                    <span className="deleted-item-date">Deleted on {formatDate(item.deletedAt)}</span>
                    <span className={`days-left ${daysLeft <= 5 ? "warning" : ""}`}>
                      <AlertTriangle size={14} />
                      {daysLeft} days left
                    </span>
                  </div>
                </div>

                <div className="deleted-item-actions">
                  <button className="restore-button" onClick={() => restoreItem(item.id, item.type)}>
                    <RefreshCw size={16} />
                    Restore
                  </button>

                  <button
                    className="delete-button"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to permanently delete this item?")) {
                        permanentlyDeleteItem(item.id, item.type)
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

export default RecycleBin

