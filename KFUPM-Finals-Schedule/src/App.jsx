import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TermSelect from './pages/TermSelect/TermSelect';
import ScheduleView from './pages/ScheduleView/ScheduleView';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TermSelect />} />
        <Route path="/Schedule-view" element={<ScheduleView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
