import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { auth } from "../lib/api";

// Auth gate. Two cases beyond simple "logged in":
//   1. Not signed in           -> /login
//   2. Signed in but not done  -> /onboarding (unless they're already there)
const PrivateComponent = () => {
  const location = useLocation();
  if (!(auth.user && auth.access)) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  const completed = auth.user.onboarding?.completed;
  if (!completed && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }
  return <Outlet />;
};

export default PrivateComponent;
