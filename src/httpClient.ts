import axios from "axios"

const httpClient = axios.create({
   baseURL: "http://localhost:3001",
   timeout: 5000, // 5 seconds before giving up
})

// REQUEST Interceptor: Run this BEFORE the request leaves
httpClient.interceptors.request.use((config) => {
   // Example: Attach a fake Token (how real apps handle login)
   const token = 'my-secret-token';
   if (token) {
      config.headers.Authorization = `Bearer ${token}`;
   }
   console.log(`🚀 Sending ${config.method?.toUpperCase()} to ${config.url}`);
   return config;
});

// RESPONSE Interceptor: Run this when data comes back
httpClient.interceptors.response.use(
   (response) => {
      // Any status code 2xx triggers this
      return response;
   },
   (error) => {
      // Handle global errors (404, 500, etc.)
      if (error.response?.status === 404) {
         alert('Resource not found on the server!');
      }
      return Promise.reject(error);
   }
);

export default httpClient