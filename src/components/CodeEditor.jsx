"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "react-router-dom"
import { Play, Save, Download, RefreshCw, AlertCircle, FolderPlus, Folder } from "lucide-react"
import { analyzeCodeWithGemini } from "../services/geminiService"
import { jsPDF } from "jspdf"
import "../styles/CodeEditor.css"

const CodeEditor = ({ saveSnippet, folders, createFolder }) => {
  const [searchParams] = useSearchParams()
  const language = searchParams.get("language") || "cpp"

  const [code, setCode] = useState("")
  const [title, setTitle] = useState("")
  const [output, setOutput] = useState("")
  const [isRunning, setIsRunning] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState("")
  const [selectedFolder, setSelectedFolder] = useState("")
  const [showFolderDropdown, setShowFolderDropdown] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [autoSave, setAutoSave] = useState(false)
  const [autoSaveTimeout, setAutoSaveTimeout] = useState(null)
  const [editorFontSize, setEditorFontSize] = useState(14)
  const [editorTheme, setEditorTheme] = useState("light")

  const codeTextareaRef = useRef(null)
  const editorRef = useRef(null)

  // Default code templates based on language
  useEffect(() => {
    const templates = {
      cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    cout << "Hello, World!" << endl;\n    return 0;\n}`,
      java: `public class Main {\n    public static void main(String[] args) {\n        // Your code here\n        System.out.println("Hello, World!");\n    }\n}`,
      python: `# Your Python code here\nprint("Hello, World!")`,
    }

    setCode(templates[language] || templates.cpp)

    // Set a default title based on language
    setTitle(`New ${language.toUpperCase()} Snippet`)

    // Set default folder if available
    if (folders.length > 0 && !selectedFolder) {
      setSelectedFolder(folders[0].id)
    }

    // Load settings from localStorage
    const savedAutoSave = localStorage.getItem("autoSave") === "true"
    setAutoSave(savedAutoSave)

    const savedEditorFontSize = Number.parseInt(localStorage.getItem("editorFontSize") || "14")
    setEditorFontSize(savedEditorFontSize)

    const savedEditorTheme = localStorage.getItem("editorTheme") || "light"
    setEditorTheme(savedEditorTheme)
  }, [language, folders])

  // Set up enhanced editor with syntax highlighting and auto-parenthesis
  useEffect(() => {
    if (!codeTextareaRef.current) return

    // Apply editor font size
    codeTextareaRef.current.style.fontSize = `${editorFontSize}px`

    // Apply editor theme
    if (editorTheme === "dark") {
      codeTextareaRef.current.classList.add("dark-theme")
      codeTextareaRef.current.classList.remove("light-theme", "monokai-theme", "github-theme", "tomorrow-theme")
    } else if (editorTheme === "monokai") {
      codeTextareaRef.current.classList.add("monokai-theme")
      codeTextareaRef.current.classList.remove("light-theme", "dark-theme", "github-theme", "tomorrow-theme")
    } else if (editorTheme === "github") {
      codeTextareaRef.current.classList.add("github-theme")
      codeTextareaRef.current.classList.remove("light-theme", "dark-theme", "monokai-theme", "tomorrow-theme")
    } else if (editorTheme === "tomorrow") {
      codeTextareaRef.current.classList.add("tomorrow-theme")
      codeTextareaRef.current.classList.remove("light-theme", "dark-theme", "monokai-theme", "github-theme")
    } else {
      codeTextareaRef.current.classList.add("light-theme")
      codeTextareaRef.current.classList.remove("dark-theme", "monokai-theme", "github-theme", "tomorrow-theme")
    }

    // Set up auto-save if enabled
    if (autoSave && code.trim()) {
      if (autoSaveTimeout) clearTimeout(autoSaveTimeout)

      const timeout = setTimeout(() => {
        if (title.trim() && code.trim() && selectedFolder) {
          console.log("Auto-saving...")
          handleSave(true)
        }
      }, 5000) // Auto-save after 5 seconds of inactivity

      setAutoSaveTimeout(timeout)
    }

    return () => {
      if (autoSaveTimeout) clearTimeout(autoSaveTimeout)
    }
  }, [code, autoSave, editorFontSize, editorTheme])

  const runCode = async () => {
    setIsRunning(true)
    setError("")
    setOutput("")

    try {
      // Check if we have a RapidAPI key
      const rapidApiKey = localStorage.getItem("rapidApiKey")

      if (!rapidApiKey || rapidApiKey === "YOUR_RAPIDAPI_KEY") {
        // If no API key, use mock execution
        await mockCodeExecution()
        return
      }

      // Using Judge0 API for code execution (free tier)
      try {
        const response = await fetch("https://judge0-ce.p.rapidapi.com/submissions", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "X-RapidAPI-Key": rapidApiKey,
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
          },
          body: JSON.stringify({
            source_code: code,
            language_id: language === "cpp" ? 54 : language === "java" ? 62 : 71, // IDs for C++, Java, Python
            stdin: "",
          }),
        })

        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()

        // Poll for results
        setTimeout(async () => {
          try {
            const resultResponse = await fetch(`https://judge0-ce.p.rapidapi.com/submissions/${data.token}`, {
              headers: {
                "X-RapidAPI-Key": rapidApiKey,
                "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
              },
            })

            if (!resultResponse.ok) {
              throw new Error(`API returned ${resultResponse.status}: ${resultResponse.statusText}`)
            }

            const resultData = await resultResponse.json()

            if (resultData.stdout) {
              setOutput(resultData.stdout)
            } else if (resultData.stderr) {
              setError(resultData.stderr)
            } else if (resultData.compile_output) {
              setError(resultData.compile_output)
            }
          } catch (err) {
            console.error("Error fetching execution results:", err)
            await mockCodeExecution()
          } finally {
            setIsRunning(false)
          }
        }, 2000)
      } catch (err) {
        console.error("Error submitting code for execution:", err)
        await mockCodeExecution()
      }
    } catch (err) {
      setError("Error connecting to code execution service. Using local execution instead.")
      await mockCodeExecution()
    }
  }

  // Mock code execution for when API is not available
  const mockCodeExecution = async () => {
    // Simulate a delay for "execution"
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Simple mock execution based on language
    if (language === "cpp") {
      if (code.includes("cout")) {
        // Extract what's inside cout statements
        const coutMatches = code.match(/cout\s*<<\s*"([^"]*)"/g)
        if (coutMatches && coutMatches.length > 0) {
          const outputs = coutMatches.map((match) => {
            const content = match.match(/cout\s*<<\s*"([^"]*)"/)
            return content ? content[1] : ""
          })
          setOutput(outputs.join("\n"))
        } else {
          setOutput("Hello, World! (Mock C++ output)")
        }
      } else {
        setOutput("Program executed successfully. (Mock C++ output)")
      }
    } else if (language === "java") {
      if (code.includes("System.out.println")) {
        // Extract what's inside println statements
        const printlnMatches = code.match(/System\.out\.println$$"([^"]*)"$$/g)
        if (printlnMatches && printlnMatches.length > 0) {
          const outputs = printlnMatches.map((match) => {
            const content = match.match(/System\.out\.println$$"([^"]*)"$$/)
            return content ? content[1] : ""
          })
          setOutput(outputs.join("\n"))
        } else {
          setOutput("Hello, World! (Mock Java output)")
        }
      } else {
        setOutput("Program executed successfully. (Mock Java output)")
      }
    } else if (language === "python") {
      if (code.includes("print")) {
        // Extract what's inside print statements
        const printMatches = code.match(/print$$"([^"]*)"$$/g)
        if (printMatches && printMatches.length > 0) {
          const outputs = printMatches.map((match) => {
            const content = match.match(/print$$"([^"]*)"$$/)
            return content ? content[1] : ""
          })
          setOutput(outputs.join("\n"))
        } else {
          setOutput("Hello, World! (Mock Python output)")
        }
      } else {
        setOutput("Program executed successfully. (Mock Python output)")
      }
    }

    setIsRunning(false)
  }

  const analyzeCode = async () => {
    if (!code.trim()) {
      setError("Please write some code before analyzing.")
      return
    }

    setIsAnalyzing(true)
    setError("")

    try {
      const analysisResult = await analyzeCodeWithGemini(code, language)
      setAnalysis(analysisResult)
    } catch (err) {
      setError("Error analyzing code. Please check your Gemini API key in settings.")
      console.error("Analysis error:", err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSave = async (isAutoSave = false) => {
    if (!title.trim()) {
      setError("Please provide a title for your snippet.")
      return
    }

    if (!code.trim()) {
      setError("Cannot save empty code snippet.")
      return
    }

    if (!selectedFolder && folders.length > 0) {
      setSelectedFolder(folders[0].id)
    }

    // If no analysis yet, generate one before saving
    let snippetAnalysis = analysis
    if (!snippetAnalysis) {
      setIsAnalyzing(true)
      try {
        snippetAnalysis = await analyzeCodeWithGemini(code, language)
      } catch (err) {
        console.error("Analysis error during save:", err)
        setError("Could not analyze code. Saving without analysis.")
        snippetAnalysis = { summary: "No analysis available", explanation: "", relatedProblems: [] }
      } finally {
        setIsAnalyzing(false)
      }
    }

    const newSnippet = {
      id: Date.now().toString(),
      title,
      code,
      language,
      folderId: selectedFolder,
      createdAt: new Date().toISOString(),
      analysis: snippetAnalysis,
    }

    saveSnippet(newSnippet)
    setError("")

    if (!isAutoSave) {
      alert("Snippet saved successfully!")
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

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      const newFolder = createFolder(newFolderName.trim())
      setSelectedFolder(newFolder.id)
      setNewFolderName("")
      setIsCreatingFolder(false)
      setShowFolderDropdown(false)
    }
  }

  // Get indentation of the current line
  const getIndentation = (line) => {
    const match = line.match(/^(\s*)/)
    return match ? match[1] : ""
  }

  // Check if the line ends with an opening bracket or similar that should increase indentation
  const shouldIncreaseIndent = (line) => {
    return /[{([][ \t]*$/.test(line)
  }

  // Handle key events in the editor
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
    } else if (e.key === "Enter") {
      e.preventDefault()

      const start = e.target.selectionStart
      const end = e.target.selectionEnd

      // Get the current line up to the cursor
      const textBeforeCursor = code.substring(0, start)
      const textAfterCursor = code.substring(end)
      const currentLineStart = textBeforeCursor.lastIndexOf("\n") + 1
      const currentLine = textBeforeCursor.substring(currentLineStart)

      // Get the indentation of the current line
      let indentation = getIndentation(currentLine)

      // Add extra indentation if the line ends with an opening bracket
      if (shouldIncreaseIndent(currentLine)) {
        indentation += "    "
      }

      // Insert new line with proper indentation
      const newCode = textBeforeCursor + "\n" + indentation + textAfterCursor
      setCode(newCode)

      // Move cursor to the start of the new line after indentation
      setTimeout(() => {
        const newPosition = start + 1 + indentation.length
        e.target.selectionStart = e.target.selectionEnd = newPosition
      }, 0)
    } else if (e.key === "{") {
      // Auto-complete curly braces
      e.preventDefault()

      const start = e.target.selectionStart
      const newCode = code.substring(0, start) + "{}" + code.substring(start)
      setCode(newCode)

      // Place cursor between braces
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 1
      }, 0)
    } else if (e.key === "(") {
      // Auto-complete parentheses
      e.preventDefault()

      const start = e.target.selectionStart
      const newCode = code.substring(0, start) + "()" + code.substring(start)
      setCode(newCode)

      // Place cursor between parentheses
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 1
      }, 0)
    } else if (e.key === "[") {
      // Auto-complete square brackets
      e.preventDefault()

      const start = e.target.selectionStart
      const newCode = code.substring(0, start) + "[]" + code.substring(start)
      setCode(newCode)

      // Place cursor between brackets
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 1
      }, 0)
    } else if (e.key === '"') {
      // Auto-complete double quotes
      e.preventDefault()

      const start = e.target.selectionStart
      const newCode = code.substring(0, start) + '""' + code.substring(start)
      setCode(newCode)

      // Place cursor between quotes
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 1
      }, 0)
    } else if (e.key === "'") {
      // Auto-complete single quotes
      e.preventDefault()

      const start = e.target.selectionStart
      const newCode = code.substring(0, start) + "''" + code.substring(start)
      setCode(newCode)

      // Place cursor between quotes
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 1
      }, 0)
    }
  }

  return (
    <div className="code-editor-container">
      <div className="editor-header">
        <div className="editor-title">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter snippet title"
            className="title-input"
          />
        </div>

        <div className="editor-controls">
          <div className="folder-selector">
            <button className="folder-select-button" onClick={() => setShowFolderDropdown(!showFolderDropdown)}>
              <Folder size={16} />
              <span>
                {selectedFolder
                  ? folders.find((f) => f.id === selectedFolder)?.name || "Select Folder"
                  : "Select Folder"}
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
                        if (e.key === "Enter") handleCreateFolder()
                        if (e.key === "Escape") {
                          setIsCreatingFolder(false)
                          setNewFolderName("")
                        }
                        e.stopPropagation()
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
              </div>
            )}
          </div>

          <div className="language-selector">
            <select value={language} onChange={(e) => (window.location.href = `/?language=${e.target.value}`)}>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
              <option value="python">Python</option>
            </select>
          </div>
        </div>
      </div>

      <div className="editor-body">
        <div className="code-area" ref={editorRef}>
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

        <div className="editor-actions">
          <button className="action-button run" onClick={runCode} disabled={isRunning}>
            {isRunning ? <RefreshCw className="spin" size={16} /> : <Play size={16} />}
            {isRunning ? "Running..." : "Run Code"}
          </button>
          <button className="action-button analyze" onClick={analyzeCode} disabled={isAnalyzing}>
            {isAnalyzing ? <RefreshCw className="spin" size={16} /> : <AlertCircle size={16} />}
            {isAnalyzing ? "Analyzing..." : "Analyze Code"}
          </button>
          <button className="action-button save" onClick={() => handleSave(false)} disabled={isAnalyzing}>
            <Save size={16} />
            Save Snippet
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

      <div className="output-container">
        <h3>Output</h3>
        <pre className="output-area">{output || "Run your code to see output here"}</pre>
      </div>

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

export default CodeEditor

