import { Platform } from "react-native";

const LOCAL_IP = "10.66.220.196";

const DEV_API =
  Platform.OS === "android"
    ? `http://${LOCAL_IP}:8000/api/v1`
    : `http://${LOCAL_IP}:8000/api/v1`;

const PROD_API = "https://your-production-domain.com/api/v1";

export const BASE_URL = __DEV__ ? DEV_API : PROD_API;