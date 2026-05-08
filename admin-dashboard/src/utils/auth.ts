export const setAuth = (token: string, role: string) => {
  if (typeof window === "undefined") return;

  localStorage.setItem("token", token);
  localStorage.setItem("role", role);
};

export const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

export const getRole = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("role");
};

export const logout = () => {
  if (typeof window === "undefined") return;

  localStorage.removeItem("token");
  localStorage.removeItem("role");

  window.location.href = "/login";
};