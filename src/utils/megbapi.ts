import { emitSessionExpired } from '@/services/session-events';
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

megbapi.interceptors.response.use(
    (response) => response,
    (error) => {
        // 401 só indica sessão expirada quando a requisição levava token. Sem conexão não há resposta.
        if (error?.response?.status === 401 && error?.config?.headers?.Authorization) {
            emitSessionExpired();
        }
        return Promise.reject(error);
    },
);

megbapi.interceptors.request.use(async (req) => {
    const token = await getToken();

    if (token !== null) {
        req.headers["Authorization"] = `Bearer ${token}`;
    }

    return req;
});

export default megbapi;
