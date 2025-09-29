import megbapi from "@/utils/megbapi";
import { setToken } from "./TokenService";

export async function login(credentials: any) {
    const { data } = await megbapi.post("/login", credentials);
    await setToken(data.token);
}

export async function loadUser() {
    const { data: user } = await megbapi.get("/user");
    return user;
}

export async function logout() {

    await megbapi.post('/logout',{});

    await setToken(null);
}

