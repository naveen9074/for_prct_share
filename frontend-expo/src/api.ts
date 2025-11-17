// src/api.ts
import axios from 'axios';

// *** IMPORTANT ***
// 1. If using an Android Emulator, use: 'http://10.0.2.2:3000'
// 2. If testing on your REAL PHONE, find your computer's IP address
//    (e.g., 192.168.1.10) and use: 'http://192.168.1.10:3000'
// 3. (Replace 3000 if your Node server uses a different port)

const API_URL = 'http://192.168.43.169:5000/api'; // <-- CHANGE THIS URL

const api = axios.create({
  baseURL: API_URL,
});

export default api;