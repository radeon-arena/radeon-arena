"use client";

import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { auth, googleProvider, firebaseEnabled } from "@/lib/firebase";

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!firebaseEnabled || !auth) {
      setReady(true);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });
    return () => unsub();
  }, []);

  if (!firebaseEnabled) {
    return (
      <Shell>
        <h1 className="text-xl font-semibold text-zinc-100">Admin</h1>
        <p className="mt-2 max-w-lg text-sm text-zinc-400">
          The admin console manages recipe approvals and contributor moderation. It requires a configured
          Firebase project. Set the <code className="text-radeon-300">NEXT_PUBLIC_FIREBASE_*</code> and{" "}
          <code className="text-radeon-300">FIREBASE_SERVICE_ACCOUNT</code> environment variables, then reload.
        </p>
      </Shell>
    );
  }

  if (!ready) return <Shell><p className="text-sm text-zinc-500">Loading…</p></Shell>;

  if (!user) {
    return (
      <Shell>
        <h1 className="text-xl font-semibold text-zinc-100">Admin</h1>
        <p className="mt-2 text-sm text-zinc-400">Sign in to manage the arena.</p>
        <button
          onClick={() => auth && googleProvider && signInWithPopup(auth, googleProvider)}
          className="btn-primary mt-4"
        >
          Sign in with Google
        </button>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-100">Admin</h1>
        <button onClick={() => auth && signOut(auth)} className="btn-ghost">Sign out</button>
      </div>
      <p className="mt-2 text-sm text-zinc-400">Signed in as {user.email}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { k: "Pending recipes", v: "Review & approve submitted recipes" },
          { k: "Contributors", v: "Moderate contributor profiles" },
          { k: "Snapshots", v: "Regenerate leaderboard snapshot" },
        ].map((c) => (
          <div key={c.k} className="card p-5">
            <h3 className="font-medium text-zinc-100">{c.k}</h3>
            <p className="mt-1 text-sm text-zinc-500">{c.v}</p>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-zinc-600">
        Moderation actions are gated by Firestore security rules (admin custom claim).
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">{children}</div>;
}
