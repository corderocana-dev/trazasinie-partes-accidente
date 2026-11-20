import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Añade el token JWT a todas las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si el servidor responde 401 en una petición con sesión (token caducado o no válido),
// se borra la sesión y se vuelve al login.
// Las rutas de /auth (login, registro, recuperar contraseña) se excluyen: ahí un 401 significa
// "datos incorrectos" y la propia página debe mostrar el mensaje, sin recargar.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const esRutaDeAuth = err.config?.url?.startsWith('/auth/');
    if (err.response?.status === 401 && !esRutaDeAuth) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
