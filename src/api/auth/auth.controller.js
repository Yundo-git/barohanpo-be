import * as authService from "./auth.servise.js";
/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: 새로운 사용자 회원가입
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserSignup'
 *     responses:
 *       200:
 *         description: 성공적으로 회원가입이 완료되었습니다.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: 잘못된 요청 파라미터
 *       500:
 *         description: 서버 내부 오류
 */
export const signup = async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;

    console.log("auth controller >> ", req.body);
    const newUser = await authService.signup(email, password, name, phone);
    res.json({ success: true, data: newUser });
  } catch (error) {
    console.error("Error in authController.signup:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await authService.login(email, password);
    res.json({ success: true, data: user });
  } catch (error) {
    console.error("Error in authController.login:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @swagger
// components:
//   schemas:
//     UserSignup:
//       type: object
//       required:
//         - email
//         - password
//         - name
//         - phone
//       properties:
//         email:
//           type: string
//           format: email
//           example: user@example.com
//         password:
//           type: string
//           format: password
//           minLength: 8
//           example: password123
//         name:
//           type: string
//           example: 홍길동
//         phone:
//           type: string
//           example: 01012345678
//     ApiResponse:
//       type: object
//       properties:
//         success:
//           type: boolean
//           example: true
//         data:
//           $ref: '#/components/schemas/User'
