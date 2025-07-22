import signupService from "./auth.servise.js";

export const signup = async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;

    console.log("auth controller >> ", req.body);
    const newUser = await signupService(email, password, name, phone);
    res.json({ success: true, data: newUser });
  } catch (error) {
    console.error("Error in authController.signup:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
