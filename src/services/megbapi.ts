import axios from 'axios';

const megbapi = axios.create({
    baseURL: 'http://172.16.1.67:8000/api/',
    // baseURL: 'https://sales.megb.com.br/api/',
    headers: {
        'Content-Type': 'application/json'
    },
});

export default megbapi;