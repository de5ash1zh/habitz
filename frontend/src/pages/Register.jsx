import React, { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import { checkAvailability } from "../api/auth";

export default function Register() {
  const { register } = useContext(AuthContext);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const strongPassword = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

  async function validateAvailability() {
    const errs = {};
    if (username && !(await checkAvailability({ username }))) errs.username = "Username is taken";
    if (email && !(await checkAvailability({ email }))) errs.email = "Email is already registered";
    return errs;
  }

  function validate() {
    const errs = {};
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) errs.username = "Username must be 3-30 chars (letters, numbers, underscore)";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Invalid email";
    if (!strongPassword.test(password)) errs.password = "Password must be 8+ chars with letters and numbers";
    if (password !== confirm) errs.confirm = "Passwords do not match";
    if (!accepted) errs.accepted = "You must accept the terms";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    const availabilityErrs = await validateAvailability();
    if (Object.keys(availabilityErrs).length) {
      setFieldErrors((prev) => ({ ...prev, ...availabilityErrs }));
      return;
    }
    setLoading(true);
    try {
      await register(username, email, password, rememberMe);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-box">
        <h1 className="h2" style={{ marginTop: 0, marginBottom: 12 }}>Register</h1>
        <form onSubmit={onSubmit}>
          <div className="section-sm">
            <label htmlFor="username">Username</label>
            <input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            {fieldErrors.username && <div style={{ color: "red" }}>{fieldErrors.username}</div>}
          </div>
          <div className="section-sm">
            <label htmlFor="email">Email</label>
            <input id="email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            {fieldErrors.email && <div style={{ color: "red" }}>{fieldErrors.email}</div>}
          </div>
          <div className="section-sm">
            <label htmlFor="password">Password</label>
            <input id="password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
            {fieldErrors.password && <div style={{ color: "red" }}>{fieldErrors.password}</div>}
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>Use at least 8 characters with letters and numbers.</div>
          </div>
          <div className="section-sm">
            <label htmlFor="confirm">Confirm Password</label>
            <input id="confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} type="password" required />
            {fieldErrors.confirm && <div style={{ color: "red" }}>{fieldErrors.confirm}</div>}
          </div>
          <div className="section-sm" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
              I accept the terms and conditions
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
              Remember me
            </label>
          </div>
          {error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}
          {fieldErrors.accepted && <div style={{ color: "red", marginBottom: 12 }}>{fieldErrors.accepted}</div>}
          <button className="btn btn-primary" disabled={loading} type="submit">{loading ? "Registering..." : "Register"}</button>
        </form>
        <p className="section-sm">
          Have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
