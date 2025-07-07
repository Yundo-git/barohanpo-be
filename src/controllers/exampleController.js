// import { exampleModel } from "../models/exampleModel.js";

// /**
//  * 모든 예시 데이터 조회
//  * @param {Object} req - Express 요청 객체
//  * @param {Object} res - Express 응답 객체
//  * @param {Function} next - 다음 미들웨어 함수
//  */
// export const getAllExamples = async (req, res, next) => {
//   try {
//     const examples = await exampleModel.findAll();
//     res.status(200).json({
//       success: true,
//       count: examples.length,
//       data: examples,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// /**
//  * 단일 예시 데이터 조회
//  * @param {Object} req - Express 요청 객체
//  * @param {Object} res - Express 응답 객체
//  * @param {Function} next - 다음 미들웨어 함수
//  */
// export const getExampleById = async (req, res, next) => {
//   try {
//     const { id } = req.params;

//     if (!id) {
//       return res.status(400).json({
//         success: false,
//         message: "ID is required",
//       });
//     }

//     const example = await exampleModel.findById(id);

//     if (!example) {
//       return res.status(404).json({
//         success: false,
//         message: "Example not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: example,
//     });
//   } catch (error) {
//     next(error);
//   }
// };
