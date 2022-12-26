import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const [email, setemail] = useState("");
  const [password, setpassword] = useState("");

  const navigate = useNavigate();
  useEffect(() => {
    const auth = localStorage.getItem("user");
    if (auth) {
      navigate("/dashboard");
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    let result = await fetch("http://localhost:5000/login", {
      method: "post",
      body: JSON.stringify({ email, password }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    result = await result.json();
    console.log(result);
    if (result.username) {
      localStorage.setItem("user", JSON.stringify(result));
      navigate("/dashboard");
    } else {
      console.log("wrong credentials");
      navigate("/login");
    }
  };

  return (
    <div className="login-page">
      <form onSubmit={handleSubmit}>
        <h3>Login</h3>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          className="input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setemail(e.target.value)}
        />
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          className="input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setpassword(e.target.value)}
        />
        <button className="btn" type="submit">
          Login
        </button>
        <p>
          Need an account ? <br />
          <Link to="/signup">SignUp here</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
