"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Save, Download, ArrowLeft, RefreshCw, AlertCircle, Folder, FolderPlus } from "lucide-react"
import { analyzeCodeWithGemini } from "../services/geminiService"
import "../styles/SnippetDetail.css"

const SnippetDetail = ({ snippets, folders, updateSnippet, moveSnippet, createFolder }) => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [snippet, setSnippet] = useState(null)
  const [code, setCode] = useState("")
  const [title, setTitle] = useState("")
  const [analysis, setAnalysis] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState("")
  const [selectedFolder, setSelectedFolder] = useState("")
  const [showFolderDropdown, setShowFolderDropdown] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)

  const codeTextareaRef = useRef(null)

  useEffect(() => {
    const foundSnippet = snippets.find((s) => s.id === id)
    if (foundSnippet) {
      setSnippet(foundSnippet)
      setCode(foundSnippet.code)
      setTitle(foundSnippet.title)
      setAnalysis(foundSnippet.analysis)
      setSelectedFolder(foundSnippet.folderId || "")
    } else {
      navigate("/snippets")
    }
  }, [id, snippets, navigate])

  if (!snippet) {
    return <div className="loading">Loading snippet...</div>
  }

  const handleSave = () => {
    if (!title.trim()) {
      setError("Please provide a title for your snippet.")
      return
    }

    if (!code.trim()) {
      setError("Cannot save empty code snippet.")
      return
    }

    const updatedSnippet = {
      ...snippet,
      title,
      code,
      analysis,
      folderId: selectedFolder,
      updatedAt: new Date().toISOString(),
    }

    updateSnippet(updatedSnippet)

    // If folder changed, move the snippet
    if (selectedFolder !== snippet.folderId) {
      moveSnippet(snippet.id, selectedFolder)
    }

    setError("")
    alert("Snippet updated successfully!")
  }

  const reanalyzeCode = async () => {
    if (!code.trim()) {
      setError("Please write some code before analyzing.")
      return
    }

    setIsAnalyzing(true)
    setError("")

    try {
      const analysisResult = await analyzeCodeWithGemini(code, snippet.language)
      setAnalysis(analysisResult)
    } catch (err) {
      setError("Error analyzing code. Please check your Gemini API key in settings.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const exportToPDF = () => {
      try {
        const doc = new jsPDF()
  
        // Add title
        doc.setFontSize(16)
        doc.text(title, 20, 20)
  
        // Add language info
        doc.setFontSize(12)
        doc.text(`Language: ${language.toUpperCase()}`, 20, 30)
  
        // Add date
        const date = new Date().toLocaleDateString()
        doc.text(`Date: ${date}`, 20, 40)
  
        // Add code with syntax highlighting (basic formatting)
        doc.setFontSize(10)
        doc.text("Code:", 20, 50)
  
        const codeLines = code.split("\n")
        let y = 60
  
        codeLines.forEach((line) => {
          if (y > 270) {
            doc.addPage()
            y = 20
          }
  
          doc.text(line, 20, y)
          y += 5
        })
  
        // Add analysis if available
        if (analysis) {
          doc.addPage()
          doc.setFontSize(14)
          doc.text("Analysis", 20, 20)
  
          doc.setFontSize(12)
          doc.text("Summary:", 20, 30)
  
          // Split summary into lines to avoid overflow
          const summaryLines = doc.splitTextToSize(analysis.summary, 170)
          doc.text(summaryLines, 20, 40)
  
          let explanationY = 40 + summaryLines.length * 7
  
          doc.text("Explanation:", 20, explanationY)
          explanationY += 10
  
          // Split explanation into lines
          const explanationLines = doc.splitTextToSize(analysis.explanation, 170)
  
          // Check if we need a new page
          if (explanationY + explanationLines.length * 5 > 280) {
            doc.addPage()
            explanationY = 20
          }
  
          doc.text(explanationLines, 20, explanationY)
  
          // Add related problems if available
          if (analysis.relatedProblems && analysis.relatedProblems.length > 0) {
            let problemsY = explanationY + explanationLines.length * 5 + 10
  
            // Check if we need a new page
            if (problemsY > 270) {
              doc.addPage()
              problemsY = 20
            }
  
            doc.text("Related LeetCode Problems:", 20, problemsY)
            problemsY += 10
  
            analysis.relatedProblems.forEach((problem, index) => {
              if (problemsY > 270) {
                doc.addPage()
                problemsY = 20
              }
  
              doc.text(`${index + 1}. ${problem.title} (${problem.difficulty})`, 20, problemsY)
              doc.text(`   ${problem.url}`, 30, problemsY + 5)
              problemsY += 15
            })
          }
        }
  
        // Save the PDF
        doc.save(`${title.replace(/\s+/g, "_")}.pdf`)
      } catch (err) {
        console.error("Error generating PDF:", err)
        setError("Failed to generate PDF. Please try again.")
      }
    }

  // Handle tab key in textarea for indentation
  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault()

      const start = e.target.selectionStart
      const end = e.target.selectionEnd

      // Insert tab at cursor position
      const newCode = code.substring(0, start) + "    " + code.substring(end)
      setCode(newCode)

      // Move cursor after the inserted tab
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 4
      }, 0)
    }
  }

  return (
    <div className="snippet-detail-container">
      <div className="snippet-detail-header">
        <button className="back-button" onClick={() => navigate("/snippets")}>
          <ArrowLeft size={16} />
          Back to Snippets
        </button>
        <div className="snippet-title">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter snippet title"
            className="title-input"
          />
        </div>

        <div className="folder-selector">
          <button className="folder-select-button" onClick={() => setShowFolderDropdown(!showFolderDropdown)}>
            <Folder size={16} />
            <span>
              {selectedFolder ? folders.find((f) => f.id === selectedFolder)?.name || "Select Folder" : "Select Folder"}
            </span>
          </button>

          {showFolderDropdown && (
            <div className="folder-dropdown">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  className={`folder-option ${selectedFolder === folder.id ? "selected" : ""}`}
                  onClick={() => {
                    setSelectedFolder(folder.id)
                    setShowFolderDropdown(false)
                  }}
                >
                  {folder.name}
                </button>
              ))}

              <button
                className="create-folder-option"
                onClick={() => {
                  setIsCreatingFolder(true)
                }}
              >
                <FolderPlus size={14} />
                Create New Folder
              </button>

              {isCreatingFolder && (
                <div className="new-folder-form">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Folder name"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (newFolderName.trim()) {
                          const newFolder = createFolder(newFolderName.trim())
                          setSelectedFolder(newFolder.id)
                          setNewFolderName("")
                          setIsCreatingFolder(false)
                          setShowFolderDropdown(false)
                        }
                      }
                      if (e.key === "Escape") {
                        setIsCreatingFolder(false)
                        setNewFolderName("")
                      }
                      e.stopPropagation()
                    }}
                  />
                  <div className="folder-form-actions">
                    <button
                      onClick={() => {
                        if (newFolderName.trim()) {
                          const newFolder = createFolder(newFolderName.trim())
                          setSelectedFolder(newFolder.id)
                          setNewFolderName("")
                          setIsCreatingFolder(false)
                          setShowFolderDropdown(false)
                        }
                      }}
                    >
                      Create
                    </button>
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
            </div>
          )}
        </div>
      </div>

      <div className="snippet-detail-body">
        <div className="code-area">
          <textarea
            ref={codeTextareaRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            className="code-textarea"
            placeholder="Write your code here..."
            spellCheck="false"
          />
        </div>

        <div className="snippet-actions">
          <button className="action-button analyze" onClick={reanalyzeCode} disabled={isAnalyzing}>
            {isAnalyzing ? <RefreshCw className="spin" size={16} /> : <AlertCircle size={16} />}
            {isAnalyzing ? "Analyzing..." : "Reanalyze Code"}
          </button>
          <button className="action-button save" onClick={handleSave}>
            <Save size={16} />
            Save Changes
          </button>
          <button className="action-button export" onClick={exportToPDF}>
            <Download size={16} />
            Export to PDF
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {analysis && (
        <div className="analysis-container">
          <h3>Code Analysis</h3>
          <div className="analysis-section">
            <h4>Summary</h4>
            <p>{analysis.summary}</p>
          </div>
          <div className="analysis-section">
            <h4>Explanation</h4>
            <p>{analysis.explanation}</p>
          </div>
          {analysis.relatedProblems && analysis.relatedProblems.length > 0 && (
            <div className="analysis-section">
              <h4>Related LeetCode Problems</h4>
              <ul className="related-problems">
                {analysis.relatedProblems.map((problem, index) => (
                  <li key={index}>
                    <a href={problem.url} target="_blank" rel="noopener noreferrer">
                      {problem.title}
                    </a>
                    <span className="problem-difficulty">{problem.difficulty}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SnippetDetail

