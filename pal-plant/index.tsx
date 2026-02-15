import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initializeFirebase } from './utils/firebase';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

void initializeFirebase();

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);