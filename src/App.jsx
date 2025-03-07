"use client"

import { useState, useEffect } from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Navbar from "./components/Navbar"
import Sidebar from "./components/Sidebar"
import CodeEditor from "./components/CodeEditor"
import SnippetList from "./components/SnippetList"
import SnippetDetail from "./components/SnippetDetail"
import RecycleBin from "./components/RecycleBin"
import SettingsModal from "./components/SettingsModal"
import "./App.css"

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });
  const [snippets, setSnippets] = useState([])
  const [folders, setFolders] = useState([])
  const [deletedItems, setDeletedItems] = useState([])
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [currentTheme, setCurrentTheme] = useState("dark")

  useEffect(() => {
    // Load snippets from localStorage
    const savedSnippets = localStorage.getItem("codeSnippets")
    if (savedSnippets) {
      setSnippets(JSON.parse(savedSnippets))
    }

    // Load folders from localStorage
    const savedFolders = localStorage.getItem("codeFolders")
    if (savedFolders) {
      setFolders(JSON.parse(savedFolders))
    } else {
      // Create a default folder if none exists
      const defaultFolder = {
        id: "default",
        name: "My Snippets",
        createdAt: new Date().toISOString(),
      }
      setFolders([defaultFolder])
      localStorage.setItem("codeFolders", JSON.stringify([defaultFolder]))
    }

    // Load deleted items from localStorage
    const savedDeletedItems = localStorage.getItem("deletedItems")
    if (savedDeletedItems) {
      setDeletedItems(JSON.parse(savedDeletedItems))
    }

    // Check user preference for dark mode and theme
    const prefersDark = localStorage.getItem("darkMode") === "true"
    setDarkMode(prefersDark)
    if (prefersDark) {
      document.body.classList.add("dark")
    }

    const savedTheme = localStorage.getItem("currentTheme") || "default"
    setCurrentTheme(savedTheme)
    document.body.setAttribute("data-theme", savedTheme)
  }, [])

  useEffect(() => {
    // Save dark mode preference
    localStorage.setItem("darkMode", darkMode)
    if (darkMode) {
      document.body.classList.add("dark")
    } else {
      document.body.classList.remove("dark")
    }
  }, [darkMode])

  useEffect(() => {
    // Save theme preference
    localStorage.setItem("currentTheme", currentTheme)
    document.body.setAttribute("data-theme", currentTheme)
  }, [currentTheme])

  // Clean up deleted items older than 30 days
  useEffect(() => {
    const cleanupDeletedItems = () => {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const updatedDeletedItems = deletedItems.filter((item) => {
        const deletedDate = new Date(item.deletedAt)
        return deletedDate > thirtyDaysAgo
      })

      if (updatedDeletedItems.length !== deletedItems.length) {
        setDeletedItems(updatedDeletedItems)
        localStorage.setItem("deletedItems", JSON.stringify(updatedDeletedItems))
      }
    }

    // Run cleanup on load and set interval
    cleanupDeletedItems()
    const interval = setInterval(cleanupDeletedItems, 86400000) // Check once a day

    return () => clearInterval(interval)
  }, [deletedItems])

  const saveSnippet = async (newSnippet) => {
    // If no folder is specified, use the default folder
    if (!newSnippet.folderId && folders.length > 0) {
      newSnippet.folderId = folders[0].id
    }

    const updatedSnippets = [...snippets, newSnippet]
    setSnippets(updatedSnippets)
    localStorage.setItem("codeSnippets", JSON.stringify(updatedSnippets))
  }

  const deleteSnippet = (id) => {
    const snippetToDelete = snippets.find((snippet) => snippet.id === id)
    if (snippetToDelete) {
      // Move to recycle bin
      const deletedItem = {
        ...snippetToDelete,
        type: "snippet",
        deletedAt: new Date().toISOString(),
      }

      const updatedDeletedItems = [...deletedItems, deletedItem]
      setDeletedItems(updatedDeletedItems)
      localStorage.setItem("deletedItems", JSON.stringify(updatedDeletedItems))
    }

    // Remove from active snippets
    const updatedSnippets = snippets.filter((snippet) => snippet.id !== id)
    setSnippets(updatedSnippets)
    localStorage.setItem("codeSnippets", JSON.stringify(updatedSnippets))
  }

  const updateSnippet = (updatedSnippet) => {
    const updatedSnippets = snippets.map((snippet) => (snippet.id === updatedSnippet.id ? updatedSnippet : snippet))
    setSnippets(updatedSnippets)
    localStorage.setItem("codeSnippets", JSON.stringify(updatedSnippets))
  }

  const createFolder = (name) => {
    const newFolder = {
      id: Date.now().toString(),
      name,
      createdAt: new Date().toISOString(),
    }

    const updatedFolders = [...folders, newFolder]
    setFolders(updatedFolders)
    localStorage.setItem("codeFolders", JSON.stringify(updatedFolders))
    return newFolder
  }

  const deleteFolder = (folderId) => {
    const folderToDelete = folders.find((folder) => folder.id === folderId)
    if (folderToDelete) {
      // Move to recycle bin
      const deletedItem = {
        ...folderToDelete,
        type: "folder",
        deletedAt: new Date().toISOString(),
      }

      const updatedDeletedItems = [...deletedItems, deletedItem]
      setDeletedItems(updatedDeletedItems)
      localStorage.setItem("deletedItems", JSON.stringify(updatedDeletedItems))
    }

    // Delete the folder
    const updatedFolders = folders.filter((folder) => folder.id !== folderId)
    setFolders(updatedFolders)
    localStorage.setItem("codeFolders", JSON.stringify(updatedFolders))

    // Move all snippets in the folder to default folder or recycle bin
    if (updatedFolders.length > 0) {
      const defaultFolderId = updatedFolders[0].id
      const updatedSnippets = snippets.map((snippet) =>
        snippet.folderId === folderId ? { ...snippet, folderId: defaultFolderId } : snippet,
      )
      setSnippets(updatedSnippets)
      localStorage.setItem("codeSnippets", JSON.stringify(updatedSnippets))
    } else {
      // If no folders left, move all snippets in the folder to recycle bin
      const snippetsToDelete = snippets.filter((snippet) => snippet.folderId === folderId)

      // Add to deleted items
      const newDeletedItems = snippetsToDelete.map((snippet) => ({
        ...snippet,
        type: "snippet",
        deletedAt: new Date().toISOString(),
      }))

      const updatedDeletedItems = [...deletedItems, ...newDeletedItems]
      setDeletedItems(updatedDeletedItems)
      localStorage.setItem("deletedItems", JSON.stringify(updatedDeletedItems))

      // Remove from active snippets
      const updatedSnippets = snippets.filter((snippet) => snippet.folderId !== folderId)
      setSnippets(updatedSnippets)
      localStorage.setItem("codeSnippets", JSON.stringify(updatedSnippets))
    }
  }

  const renameFolder = (folderId, newName) => {
    const updatedFolders = folders.map((folder) => (folder.id === folderId ? { ...folder, name: newName } : folder))
    setFolders(updatedFolders)
    localStorage.setItem("codeFolders", JSON.stringify(updatedFolders))
  }

  const moveSnippet = (snippetId, targetFolderId) => {
    const updatedSnippets = snippets.map((snippet) =>
      snippet.id === snippetId ? { ...snippet, folderId: targetFolderId } : snippet,
    )
    setSnippets(updatedSnippets)
    localStorage.setItem("codeSnippets", JSON.stringify(updatedSnippets))
  }

  const restoreItem = (itemId, itemType) => {
    const itemToRestore = deletedItems.find((item) => item.id === itemId && item.type === itemType)

    if (!itemToRestore) return

    if (itemType === "snippet") {
      // Restore snippet
      setSnippets((prev) => [
        ...prev,
        {
          ...itemToRestore,
          folderId:
            itemToRestore.folderId && folders.some((f) => f.id === itemToRestore.folderId)
              ? itemToRestore.folderId
              : folders[0]?.id || "default",
        },
      ])
    } else if (itemType === "folder") {
      // Restore folder
      setFolders((prev) => [...prev, itemToRestore])
    }

    // Remove from deleted items
    const updatedDeletedItems = deletedItems.filter((item) => !(item.id === itemId && item.type === itemType))
    setDeletedItems(updatedDeletedItems)
    localStorage.setItem("deletedItems", JSON.stringify(updatedDeletedItems))

    // Update localStorage for the restored item type
    if (itemType === "snippet") {
      localStorage.setItem("codeSnippets", JSON.stringify([...snippets, itemToRestore]))
    } else if (itemType === "folder") {
      localStorage.setItem("codeFolders", JSON.stringify([...folders, itemToRestore]))
    }
  }

  const permanentlyDeleteItem = (itemId, itemType) => {
    const updatedDeletedItems = deletedItems.filter((item) => !(item.id === itemId && item.type === itemType))
    setDeletedItems(updatedDeletedItems)
    localStorage.setItem("deletedItems", JSON.stringify(updatedDeletedItems))
  }

  const emptyRecycleBin = () => {
    setDeletedItems([])
    localStorage.setItem("deletedItems", JSON.stringify([]))
  }

  return (
    <Router>
      <div className={`app-container ${darkMode ? "dark" : ""}`}>
        <Navbar darkMode={darkMode} setDarkMode={setDarkMode} openSettings={() => setShowSettingsModal(true)} />
        <div className="main-content">
          <Sidebar
            folders={folders}
            snippets={snippets}
            onCreateFolder={createFolder}
            onDeleteFolder={deleteFolder}
            onRenameFolder={renameFolder}
            onMoveSnippet={moveSnippet}
          />
          <div className="content-area">
            <Routes>
              <Route
                path="/"
                element={<CodeEditor saveSnippet={saveSnippet} folders={folders} createFolder={createFolder} />}
              />
              <Route
                path="/snippets"
                element={<SnippetList snippets={snippets} folders={folders} deleteSnippet={deleteSnippet} />}
              />
              <Route
                path="/snippets/:id"
                element={
                  <SnippetDetail
                    snippets={snippets}
                    folders={folders}
                    updateSnippet={updateSnippet}
                    moveSnippet={moveSnippet}
                  />
                }
              />
              <Route
                path="/recycle-bin"
                element={
                  <RecycleBin
                    deletedItems={deletedItems}
                    folders={folders}
                    restoreItem={restoreItem}
                    permanentlyDeleteItem={permanentlyDeleteItem}
                    emptyRecycleBin={emptyRecycleBin}
                  />
                }
              />
            </Routes>
          </div>
        </div>

        {showSettingsModal && (
          <SettingsModal
            onClose={() => setShowSettingsModal(false)}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            currentTheme={currentTheme}
            setCurrentTheme={setCurrentTheme}
          />
        )}
      </div>
    </Router>
  )
}

export default App

