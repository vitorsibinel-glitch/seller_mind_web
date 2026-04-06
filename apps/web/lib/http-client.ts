import axios from "axios";

const apiUrl = process.env.API_URL;

const api = axios.create({
  baseURL: apiUrl, // erro no dotenv, verificar pq
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    return Promise.reject(err);
  }
);

export default api;
