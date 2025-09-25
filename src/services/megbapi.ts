import axios from 'axios';

const megbapi = axios.create({
    baseURL: 'https://sales.megb.com.br/api/',
    headers: {
        'Content-Type': 'application/json'
    },
});

export default megbapi;