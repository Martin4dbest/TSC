import { Platform } from "react-native";

const DEV_API = "https://tsc-backend-nefz.onrender.com/api/v1";

const PROD_API = "https://tsc-backend-nefz.onrender.com/api/v1";

export const BASE_URL = __DEV__ ? DEV_API : PROD_API;