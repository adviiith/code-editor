"use client"

import { useState, useEffect } from "react"
import { Save, RefreshCw } from "lucide-react"
import "../styles/Settings.css"

const Settings = () => {
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [rapidApiKey, setRapidApiKey] = useState("")
  const [editorFontSize, setEditorFontSize] = useState(14)
  const [editorTheme, setEditorTheme] = useState("light")
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")

  useEffect(() => {
    // Load settings from localStorage
    const savedGeminiApiKey = localStorage.getItem("geminiApiKey") || "";
    const savedRapidApiKey = localStorage.getItem("rapidApiKey") || ""
    const savedEditorFontSize = Number.parseInt(localStorage.getItem("editorFontSize") || "14")
    const savedEditorTheme = localStorage.getItem("editorTheme") || "light"

    setGeminiApiKey(savedGeminiApiKey);
    setRapidApiKey(savedRapidApiKey)
    setEditorFontSize(savedEditorFontSize)
    setEditorTheme(savedEditorTheme)
  }, [])

  const saveSettings = () => {
    setIsSaving(true)

    // Save settings to localStorage
    localStorage.setItem("geminiApiKey", geminiApiKey);
    localStorage.setItem("rapidApiKey", rapidApiKey)
    localStorage.setItem("editorFontSize", editorFontSize.toString())
    localStorage.setItem("editorTheme", editorTheme)

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
    <div className="settings-container">
      <h2>Settings</h2>

      <div className="settings-section">
        <h3>API Keys</h3>
        <div className="setting-item">
          <label htmlFor="deepseek-api-key">Gemini API Key</label>
          <input
            type="password"
            id="deepseek-api-key"
            value={geminiApiKey}
            onChange={(e) => setGeminiApiKey(e.target.value)}
            placeholder="Enter your Gemini API key"
          />
          <p className="setting-description">
            Required for code analysis and AI-powered features. Get your API key from the Gemini website.
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
          <p className="setting-description">Required for code execution. Get your API key from RapidAPI.</p>
        </div>
      </div>

      <div className="settings-section">
        <h3>Editor Preferences</h3>
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

      <div className="settings-actions">
        <button className="save-button" onClick={saveSettings} disabled={isSaving}>
          {isSaving ? <RefreshCw className="spin" size={16} /> : <Save size={16} />}
          {isSaving ? "Saving..." : "Save Settings"}
        </button>

        {saveMessage && <div className="save-message">{saveMessage}</div>}
      </div>
    </div>
  )
}

export default Settings

