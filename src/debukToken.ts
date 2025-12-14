export function debugToken() {
  const keys = [
    "token",
    "authToken",
    "accessToken",
    "jwt",
    "novi_token",
    "auth",
    "novi_auth",
  ];

  for (const k of keys) {
    const v = localStorage.getItem(k);

  
    if (v) {
      console.log("[token storage]", k, v.slice(0, 40) + "...");
    }
  }
}
