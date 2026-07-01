import { getToken } from '@/services/TokenService';
import axiosLib from 'axios';

const apiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '') || 'https://vetorpet.com.br/api';

const megbapi = axiosLib.create({
    baseURL: apiUrl,
    timeout: 10000,
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
    },
});

megbapi.interceptors.request.use(async (req) => {
    const token = await getToken();

    if (token !== null) {
        req.headers["Authorization"] = `Bearer ${token}`;
    }

    return req;
});

export default megbapi;
