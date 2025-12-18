import axios from 'axios';
import userManager from './authConfig';

const api = axios.create({
    baseURL: import.meta.env.VITE_KONG_URL || 'http://localhost:8000',
});

api.interceptors.request.use(
    async (config) => {
        const user = await userManager.getUser();
        const url = new URL(config.url, api.defaults.baseURL);
        const method = (config.method || 'get').toUpperCase();

        if (user && user.access_token) {
            const dpopProof = await userManager.dpopProof({
                url: url.href,
                method,
            });

            config.headers['Authorization'] = `Bearer ${user.access_token}`;
            config.headers['DPoP'] = dpopProof;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
)

export default api;