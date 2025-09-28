import axios from 'axios';

const megbapi = axios.create({
    // baseURL: 'http://sales-representative.test/api/',
    baseURL: 'https://sales.megb.com.br/api/',
    headers: {
        'Content-Type': 'application/json'
    },
});

export default megbapi;