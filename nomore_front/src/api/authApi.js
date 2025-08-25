import api from "./axios";

export const reqPrincipal = async () => await api.get("/api/account/principal");

export const reqSignup = async (data) => await api.post("/api/auth/signup", data)