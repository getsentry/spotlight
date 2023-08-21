import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const root = document.createElement('div');
root.style.position = 'absolute';
root.style.top = "0";
root.style.left = "0";
root.style.right = "0";
document.body.appendChild(root);

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
