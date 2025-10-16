import { getToken } from '@/services/TokenService';
import axiosLib from 'axios';

const megbapi = axiosLib.create({
    // baseURL: 'http://192.168.2.53:8000/api',
    baseURL: 'http://172.16.1.67:8000/api/',
    // baseURL: 'https://sales.megb.com.br/api/',
    headers: {
        Accept: "application/json"
    },
});

megbapi.interceptors.request.use(async (req) => {
    const token = await getToken();

    if (token !== null) {
        req.headers["Authorization"] = `Bearer ${token}`;
    }

    return req;
})

export default megbapi;