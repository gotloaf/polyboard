import { useState } from 'react'

import './App.css'
import github from './assets/github.svg'

function App() {
  const [textContent, setTextContent] = useState("")

  return (
    <div className="main-content-anchor">
      <textarea
        className="main-text"
        value={textContent}
        onChange={e => setTextContent(e.target.value)}
      />
      <div className="bottom-bar">

      </div>
      <div className="selector">

      </div>
      <a href="https://github.com/gotloaf/polyboard" target="_blank" className="credit">
        <img src={github} className="logo small invert-when-dark" alt="GitHub Logo" />
        <span>gotloaf/<span className="credit-repo-name">polyboard</span></span>
      </a>
      <div className="keyboard-display">

      </div>
    </div>
  )
}

export default App
