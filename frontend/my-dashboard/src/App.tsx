import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import Header from './components/header';
import GlobeHome from "./pages/GlobeHome";
import About from "./pages/About";
import Ranking from "./pages/Ranking";
import UserPage from "./pages/UserPage";
import Measure from "./pages/Measure";

import AuthCallback from "./pages/auth/AuthCallback";

const App = () => {
  return (
    <Router>
      <div className="App">
        <Header />
        <main>
            <Routes> 
              <Route path="/" element={<GlobeHome />} />
              <Route path="/about" element={<About />} />
              <Route path="/ranking" element={<Ranking />} />
              <Route path="/user" element={<UserPage />} />
              <Route path="/measure" element={<Measure />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
            </Routes>
          </main>
      </div>
    </Router>
  );
};

export default App;
