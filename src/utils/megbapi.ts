import { getToken } from '@/services/TokenService';
import axiosLib from 'axios';

const megbapi = axiosLib.create({
    baseURL: 'https://sales.megb.com.br/api',
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