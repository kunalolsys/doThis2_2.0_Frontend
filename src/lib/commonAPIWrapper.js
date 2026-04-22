import api from "./api";

export const request = async ({
  method = "GET",
  url,
  data,
  params,
  headers = {},
}) => {
  try {
    const res = await api({
      method,
      url,
      data,
      params,
      headers,
    });

    return res.data;
  } catch (err) {
    const message =
      err?.response?.data?.message || err.message || "Something went wrong";

    console.error("API ERROR:", message);

    throw message; // 🔥 clean error
  }
};