import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "http://localhost:3123/api", // The base URL for your API
  headers: {
    "Content-Type": "application/json", // default content type for requests
  },
});
