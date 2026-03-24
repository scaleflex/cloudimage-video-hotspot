import React from 'react';
import { createRoot } from 'react-dom/client';
import { EditorProvider } from './state/EditorContext';
import { App } from './App';

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <EditorProvider>
      <App />
    </EditorProvider>
  </React.StrictMode>
);
