import React, { useContext, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import { useToast } from "../components/ToastProvider.jsx";

export default function Login() {
  const { login } = useContext(AuthContext);
  const { addToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  function validate() {
    const errs = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Invalid email";
    if (password.length < 6) errs.password = "Password must be at least 6 characters";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email, password, rememberMe);
      addToast("Logged in successfully", "success");
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
      addToast(err?.response?.data?.message || "Login failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-box">
        <h1 className="h2" style={{ marginTop: 0, marginBottom: 12 }}>Login</h1>
        <form onSubmit={onSubmit}>
          <div className="section-sm">
            <label htmlFor="email">Email</label>
            <input id="email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            {fieldErrors.email && <div style={{ color: "red" }}>{fieldErrors.email}</div>}
          </div>
          <div className="section-sm">
            <label htmlFor="password">Password</label>
            <input id="password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
            {fieldErrors.password && <div style={{ color: "red" }}>{fieldErrors.password}</div>}
          </div>
          <div className="section-sm" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
              Remember me
            </label>
            <Link to="#">Forgot password?</Link>
          </div>
          {error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}
          <button className="btn btn-primary" disabled={loading} type="submit">{loading ? "Logging in..." : "Login"}</button>
        </form>
        <p className="section-sm">
          No account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
