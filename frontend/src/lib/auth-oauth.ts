export async function signInWithGoogle(redirectTo?: string) {
  const res = await fetch("/api/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ redirectTo: redirectTo || "/marketplace" })
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    throw new Error(data.error || "Failed to sign in with Google.");
  }

  if (data.url) {
    window.location.href = data.url;
    return;
  }

  if (data.user) {
    localStorage.setItem("user", JSON.stringify(data.user));
    window.dispatchEvent(new Event("storage"));
    window.location.href = data.redirectTo || "/marketplace";
    return data;
  }

  throw new Error("Invalid server response for Google Auth.");
}
