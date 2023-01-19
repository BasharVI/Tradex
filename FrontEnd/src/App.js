import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./App.css";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PrivateComponent from "./components/PrivateComponent";
import Portfolio from "./components/Portfolio";
import Orders from "./components/Orders";
import Stocks from "./components/Stocks";

function App() {
  return (
    <div className="App">
      <Router>
        <Header />
        <Routes>
          <Route element={<PrivateComponent />}>
            <Route path="dashboard" element={<Dashboard />}></Route>
            <Route path="Portfolio" element={<Portfolio />}></Route>
            <Route path="orders" element={<Orders />}></Route>
            <Route path="stock/:id" element={<Stocks />}></Route>
          </Route>
          <Route exact path="/" element={<HomePage />}></Route>
          <Route path="signup" element={<Signup />}></Route>
          <Route path="login" element={<Login />}></Route>
        </Routes>
      </Router>
      <Footer />
    </div>
  );
}

export default App;
