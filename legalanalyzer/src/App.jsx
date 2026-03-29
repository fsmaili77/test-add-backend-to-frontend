// src/App.jsx
import React from "react";
import Routes from "./Routes";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ClientProvider } from "./contexts/ClientContext";  // ← ADD THIS LINE

function App() {
  return (
    <LanguageProvider>
      <ClientProvider>                                      {/* ← WRAP WITH THIS */}
        <Routes />
      </ClientProvider>                                     {/* ← WRAP WITH THIS */}
    </LanguageProvider>
  );
}

export default App;