import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Apply dark theme by default
document.documentElement.classList.add('dark');

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
);
