"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, auth } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api("/auth/signup", { method: "POST", body: { email, username, password } });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError((j && j.error && j.error.message) || `Signup failed (${res.status})`);
        setLoading(false);
        return;
      }
      const data = await res.json();
      auth.set(data);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-24 p-6 bg-white rounded-md shadow-md">
      <h3 className="text-lg font-semibold mb-4">Create account</h3>
      {error ? <div className="text-sm text-red-600 mb-2">{error}</div> : null}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm">Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full border px-3 py-2 rounded" />
        </div>
        <div>
          <label className="block text-sm">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border px-3 py-2 rounded" />
        </div>
        <div>
          <label className="block text-sm">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border px-3 py-2 rounded" />
        </div>
        <button disabled={loading} className="w-full bg-primary text-white py-2 rounded">{loading ? "Creating..." : "Create account"}</button>
      </form>
    </div>
  );
}
