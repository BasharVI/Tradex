import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { auth } from "../lib/api";

const PrivateComponent = () => {
  return auth.user && auth.access ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateComponent;
