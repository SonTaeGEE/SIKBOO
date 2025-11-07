import apiClient from "./axios";

// 개발 모드일 때만 memberId=1 자동 주입
if (import.meta.env.DEV) {
  apiClient.interceptors.request.use((config) => {
    // GET/DELETE 요청은 query param에 추가
    if (!config.params) config.params = {};
    if (config.method === "get" || config.method === "delete") {
      if (config.params.memberId == null) config.params.memberId = 1;
    }

    // POST/PUT/PATCH 요청은 body에 추가
    if (["post", "put", "patch"].includes(config.method || "")) {
      if (typeof config.data !== "object" || config.data == null) config.data = {};
      if (config.data.memberId == null) config.data.memberId = 1;
    }
    return config;
  });
}

export default apiClient;
