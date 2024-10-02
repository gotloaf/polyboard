import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

const noScriptAlignmentBox = document.getElementById('noscript-alignment-container')!;
noScriptAlignmentBox.parentElement?.removeChild(noScriptAlignmentBox);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
