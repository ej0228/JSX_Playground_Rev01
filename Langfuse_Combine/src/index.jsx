// src/index.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx'; // App.jsx를 명시적으로 import
import { BrowserRouter } from 'react-router-dom';

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
