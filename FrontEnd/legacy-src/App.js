import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./App.css";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import PrivateComponent from "./components/PrivateComponent";
import Portfolio from "./components/Portfolio";
import Orders from "./components/Orders";
import Stocks from "./components/Stocks";
import Allocation from "./components/Allocation";
import Heatmap from "./components/Heatmap";
import IPO from "./components/IPO";
import GrowthHub from "./pages/GrowthHub";
import AICoach from "./pages/AICoach";

function App() {
  return (
    <div className="App">
      <Router>
        <Header />
        <Routes>
          <Route element={<PrivateComponent />}>
            <Route path="onboarding" element={<Onboarding />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="portfolio" element={<Portfolio />} />
            <Route path="orders" element={<Orders />} />
            <Route path="allocation" element={<Allocation />} />
            <Route path="heatmap" element={<Heatmap />} />
            <Route path="ipo" element={<IPO />} />
            <Route path="profile" element={<Profile />} />
            <Route path="growth" element={<GrowthHub />} />
            <Route path="coach" element={<AICoach />} />
            <Route path="stock/:id" element={<Stocks />} />
          </Route>
          <Route exact path="/" element={<HomePage />} />
          <Route path="signup" element={<Signup />} />
          <Route path="login" element={<Login />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="verify-email" element={<VerifyEmail />} />
        </Routes>
      </Router>
      <Footer />
    </div>
  );
}

export default App;
