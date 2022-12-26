import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./App.css";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PrivateComponent from "./components/PrivateComponent";

function App() {
  return (
    <div className="App">
      <Router>
        <Header />
        <Routes>
          <Route element={<PrivateComponent />}>
            <Route exact path="/" element={<HomePage />}></Route>
            <Route path="dashboard" element={<Dashboard />}></Route>
          </Route>
          <Route path="signup" element={<Signup />}></Route>
          <Route path="login" element={<Login />}></Route>
        </Routes>
      </Router>
      <Footer />
    </div>
  );
}

export default App;
