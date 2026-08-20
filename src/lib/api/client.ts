import axios from "axios";
import { attachInterceptors } from "./interceptor";

export const mainClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

attachInterceptors(mainClient);
