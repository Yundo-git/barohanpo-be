// import pool from '../config/database.js';

// /**
//  * 예시 모델
//  */
// export const exampleModel = {
//   /**
//    * 모든 예시 데이터 조회
//    * @returns {Promise<Array>} 예시 데이터 배열
//    */
//   findAll: async () => {
//     try {
//       const [rows] = await pool.query('SELECT * FROM example_table');
//       return rows;
//     } catch (error) {
//       console.error('Error in exampleModel.findAll:', error);
//       throw error;
//     }
//   },

//   /**
//    * ID로 단일 예시 데이터 조회
//    * @param {string|number} id - 조회할 데이터의 ID
//    * @returns {Promise<Object|null>} 조회된 예시 데이터 또는 null
//    */
//   findById: async (id) => {
//     try {
//       const [rows] = await pool.query(
//         'SELECT * FROM example_table WHERE id = ?',
//         [id]
//       );
//       return rows[0] || null;
//     } catch (error) {
//       console.error('Error in exampleModel.findById:', error);
//       throw error;
//     }
//   }
// };

// export default exampleModel;
