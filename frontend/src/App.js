import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import PixelTest from './components/PixelTest';
import PrinterTest from './components/PrinterTest';
import ScreenTest from './components/ScreenTest';
import BenchmarkTest from './components/BenchmarkTest';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dpd" element={<PixelTest />} />
          <Route path="/printer" element={<PrinterTest />} />
          <Route path="/sscreen" element={<ScreenTest />} />
          <Route path="/benchmark" element={<BenchmarkTest />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;