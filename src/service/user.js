import USER_API from "../api/user_api.js";

export const getUser = async (id) => {
  const response = await USER_API.get(`/user/${id}`);
  return response.data;
};
