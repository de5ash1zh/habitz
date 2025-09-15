import React, { useEffect, useState } from "react";
import { searchUsers } from "../api/users";
import { followUser, unfollowUser, getFriends } from "../api/social";
import Skeleton from "../components/Skeleton.jsx";

export default function Profile() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [error, setError] = useState("");

  async function refreshFriends() {
    try {
      setFriendsLoading(true);
      const data = await getFriends();
      setFriends(data);
    } catch (e) {
      // non-blocking
    } finally {
      setFriendsLoading(false);
    }
  }

  useEffect(() => {
    refreshFriends();
  }, []);

  async function onSearch(e) {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);
      const users = await searchUsers(q, 20);
      setResults(users);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to search");
    } finally {
      setLoading(false);
    }
  }

  async function onFollow(userId) {
    try {
      await followUser(userId);
      await refreshFriends();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to follow");
    }
  }

  async function onUnfollow(userId) {
    try {
      await unfollowUser(userId);
      await refreshFriends();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to unfollow");
    }
  }

  const friendIds = new Set(friends.map((f) => String(f.id)));

  return (
    <div className="container section">
      <h1 className="h2" style={{ marginTop: 0 }}>Profile</h1>

      <section className="section">
        <div className="card">
          <h2 className="h3" style={{ marginTop: 0 }}>Find People</h2>
          <form onSubmit={onSearch} style={{ display: "flex", gap: 8 }}>
            <input placeholder="Search username or email" value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="btn btn-primary" disabled={loading} type="submit">{loading ? "Searching..." : "Search"}</button>
          </form>
          {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
          {loading ? (
            <div className="grid-rows" style={{ marginTop: 12 }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card">
                  <Skeleton height={16} width="35%" />
                  <div className="space" />
                  <Skeleton height={12} width="55%" />
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <ul className="list-reset grid-12" style={{ marginTop: 12 }}>
              {results.map((u) => (
                <li key={u.id} className="card" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{u.username}</div>
                    <div className="caption">{u.email}</div>
                  </div>
                  {friendIds.has(String(u.id)) ? (
                    <button className="btn btn-danger" onClick={() => onUnfollow(u.id)}>Unfollow</button>
                  ) : (
                    <button className="btn btn-primary" onClick={() => onFollow(u.id)}>Follow</button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="card" style={{ marginTop: 12, textAlign: "center" }}>
              <div className="h3" style={{ margin: 0 }}>Search people</div>
              <div className="caption" style={{ marginTop: 6 }}>Find and follow friends to build accountability.</div>
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <h2 className="h3" style={{ marginTop: 0 }}>Friends</h2>
        {friendsLoading ? (
          <div className="grid-rows">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card">
                <Skeleton height={16} width="30%" />
                <div className="space" />
                <Skeleton height={12} width="40%" />
              </div>
            ))}
          </div>
        ) : friends.length === 0 ? (
          <div className="card" style={{ textAlign: "center" }}>
            <div className="h3" style={{ margin: 0 }}>No friends yet</div>
            <div className="caption" style={{ marginTop: 6 }}>Follow people from the search above to see their activity.</div>
          </div>
        ) : (
          <ul className="list-reset grid-rows">
            {friends.map((f) => (
              <li key={f.id} className="card">
                <div style={{ fontWeight: 600 }}>{f.username}</div>
                <div className="caption">{f.email}</div>
                <div className="section-sm">
                  <button className="btn btn-danger" onClick={() => onUnfollow(f.id)}>Unfollow</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
