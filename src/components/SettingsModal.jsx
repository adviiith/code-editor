"use client"

import { useState, useEffect } from "react"
import { X, Save, RefreshCw, Check, Moon, Sun, Palette } from "lucide-react"
import "../styles/SettingsModal.css"

const SettingsModal = ({ onClose, darkMode, setDarkMode, currentTheme, setCurrentTheme }) => {
  const [geminiApiKey, setGeminiApiKey] = useState("")
  const [rapidApiKey, setRapidApiKey] = useState("")
  const [editorFontSize, setEditorFontSize] = useState(14)
  const [editorTheme, setEditorTheme] = useState("light")
  const [autoSave, setAutoSave] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")
  const [activeTab, setActiveTab] = useState("general")

  const themes = [
    { id: "default", name: "Default" },
    { id: "blue", name: "Blue" },
    { id: "green", name: "Green" },
    { id: "purple", name: "Purple" },
    { id: "orange", name: "Orange" },
  ]

  useEffect(() => {
    // Load settings from localStorage
    const savedGeminiApiKey = localStorage.getItem("geminiApiKey") || ""
    const savedRapidApiKey = localStorage.getItem("rapidApiKey") || ""
    const savedEditorFontSize = Number.parseInt(localStorage.getItem("editorFontSize") || "14")
    const savedEditorTheme = localStorage.getItem("editorTheme") || "light"
    const savedAutoSave = localStorage.getItem("autoSave") === "true"

    setGeminiApiKey(savedGeminiApiKey)
    setRapidApiKey(savedRapidApiKey)
    setEditorFontSize(savedEditorFontSize)
    setEditorTheme(savedEditorTheme)
    setAutoSave(savedAutoSave)
  }, [])

  const saveSettings = () => {
    setIsSaving(true)

    // Save settings to localStorage
    localStorage.setItem("geminiApiKey", geminiApiKey)
    localStorage.setItem("rapidApiKey", rapidApiKey)
    localStorage.setItem("editorFontSize", editorFontSize.toString())
    localStorage.setItem("editorTheme", editorTheme)
    localStorage.setItem("autoSave", autoSave.toString())

    // Simulate saving delay
    setTimeout(() => {
      setIsSaving(false)
      setSaveMessage("Settings saved successfully!")

      // Clear message after 3 seconds
      setTimeout(() => {
        setSaveMessage("")
      }, 3000)
    }, 1000)
  }

  return (
    <div className="settings-modal-overlay">
      <div className="settings-modal">
        <div className="settings-modal-header">
          <h2>Settings</h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="settings-modal-tabs">
          <button
            className={`settings-tab ${activeTab === "general" ? "active" : ""}`}
            onClick={() => setActiveTab("general")}
          >
            General
          </button>
          <button
            className={`settings-tab ${activeTab === "appearance" ? "active" : ""}`}
            onClick={() => setActiveTab("appearance")}
          >
            Appearance
          </button>
          <button className={`settings-tab ${activeTab === "api" ? "active" : ""}`} onClick={() => setActiveTab("api")}>
            API Keys
          </button>
          <button
            className={`settings-tab ${activeTab === "editor" ? "active" : ""}`}
            onClick={() => setActiveTab("editor")}
          >
            Editor
          </button>
        </div>

        <div className="settings-modal-content">
          {activeTab === "general" && (
            <div className="settings-section">
              <div className="setting-item">
                <label htmlFor="auto-save">Auto Save</label>
                <div className="toggle-switch">
                  <input type="checkbox" id="auto-save" checked={autoSave} onChange={() => setAutoSave(!autoSave)} />
                  <label htmlFor="auto-save"></label>
                </div>
                <p className="setting-description">Automatically save your code snippets while typing</p>
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="settings-section">
              <div className="setting-item">
                <label>Dark Mode</label>
                <div className="theme-mode-selector">
                  <button
                    className={`theme-mode-button ${!darkMode ? "active" : ""}`}
                    onClick={() => setDarkMode(false)}
                  >
                    <Sun size={16} />
                    Light
                  </button>
                  <button className={`theme-mode-button ${darkMode ? "active" : ""}`} onClick={() => setDarkMode(true)}>
                    <Moon size={16} />
                    Dark
                  </button>
                </div>
              </div>

              <div className="setting-item">
                <label>Color Theme</label>
                <div className="color-theme-selector">
                  {themes.map((theme) => (
                    <button
                      key={theme.id}
                      className={`color-theme-button ${theme.id} ${currentTheme === theme.id ? "active" : ""}`}
                      onClick={() => setCurrentTheme(theme.id)}
                    >
                      <Palette size={16} />
                      <span>{theme.name}</span>
                      {currentTheme === theme.id && <Check size={14} className="check-icon" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "api" && (
            <div className="settings-section">
              <div className="setting-item">
                <label htmlFor="gemini-api-key">Google Gemini API Key</label>
                <input
                  type="password"
                  id="gemini-api-key"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="Enter your Gemini API key"
                />
                <p className="setting-description">
                  Required for code analysis and AI-powered features. Get your API key from the{" "}
                  <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer">
                    Google AI Studio
                  </a>
                  .
                </p>
              </div>

              <div className="setting-item">
                <label htmlFor="rapid-api-key">RapidAPI Key (Judge0)</label>
                <input
                  type="password"
                  id="rapid-api-key"
                  value={rapidApiKey}
                  onChange={(e) => setRapidApiKey(e.target.value)}
                  placeholder="Enter your RapidAPI key"
                />
                <p className="setting-description">
                  Required for code execution. Get your API key from{" "}
                  <a
                    href="https://rapidapi.com/judge0-official/api/judge0-ce"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    RapidAPI
                  </a>
                  .
                </p>
              </div>
            </div>
          )}

          {activeTab === "editor" && (
            <div className="settings-section">
              <div className="setting-item">
                <label htmlFor="editor-font-size">Font Size</label>
                <div className="range-input-container">
                  <input
                    type="range"
                    id="editor-font-size"
                    min="10"
                    max="24"
                    value={editorFontSize}
                    onChange={(e) => setEditorFontSize(Number.parseInt(e.target.value))}
                  />
                  <span className="range-value">{editorFontSize}px</span>
                </div>
              </div>

              <div className="setting-item">
                <label htmlFor="editor-theme">Editor Theme</label>
                <select id="editor-theme" value={editorTheme} onChange={(e) => setEditorTheme(e.target.value)}>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="monokai">Monokai</option>
                  <option value="github">GitHub</option>
                  <option value="tomorrow">Tomorrow</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="settings-modal-footer">
          <button className="save-button" onClick={saveSettings} disabled={isSaving}>
            {isSaving ? <RefreshCw className="spin" size={16} /> : <Save size={16} />}
            {isSaving ? "Saving..." : "Save Settings"}
          </button>

          {saveMessage && <div className="save-message">{saveMessage}</div>}
        </div>
      </div>
    </div>
  )
}

export default SettingsModal

