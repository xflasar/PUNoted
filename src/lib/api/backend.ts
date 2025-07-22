// src/lib/api/backend.ts

import axios from 'axios';
import { BACKEND_BASE_URL } from '@/lib/constants';

export const backendApiClient = axios.create({
  baseURL: BACKEND_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});