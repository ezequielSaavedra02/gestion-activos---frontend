// src/lib/api/axiosClient.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Configuración base de Axios
const axiosClient: AxiosInstance = axios.create({
    baseURL: 'https://gestion-activos-backend-production.up.railway.app/api', // Ajusta según tu configuración
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    timeout: 10000, // 10 segundos
});

// Interceptor para añadir el token de autenticación si es necesario
axiosClient.interceptors.request.use(
    (config) => {
        // Aquí puedes añadir lógica para incluir el token de autenticación
        // Por ejemplo:
        // const token = localStorage.getItem('token');
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para manejar respuestas
axiosClient.interceptors.response.use(
    (response: AxiosResponse) => {
        // Puedes hacer algo con la respuesta antes de que llegue a tu componente
        return response.data;
    },
    (error) => {
        // Manejo de errores global
        if (error.response) {
            // El servidor respondió con un código de estado fuera del rango 2xx
            console.error('Error de respuesta:', {
                status: error.response.status,
                data: error.response.data,
                headers: error.response.headers,
            });
        } else if (error.request) {
            // La petición fue hecha pero no se recibió respuesta
            console.error('Error de conexión:', error.request);
        } else {
            // Algo pasó en la configuración de la petición
            console.error('Error:', error.message);
        }

        return Promise.reject(error);
    }
);

export default axiosClient;