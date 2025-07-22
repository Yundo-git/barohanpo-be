import { authModel } from "./auth.Model.js";

export const signup = async (email, password, name, phone) => {
  try {
    const row = await authModel.signup(email, password, name, phone);
    return row;
  } catch (error) {
    console.error("Error in authService.signup:", error);
    throw error;
  }
};

export default signup;
