// App.tsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./home";
import GroceryList from "./groceryList";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/grocery-list" element={<GroceryList />} />
      </Routes>
    </Router>
  );
}
