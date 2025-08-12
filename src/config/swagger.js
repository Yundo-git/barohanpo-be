const swaggerJSDoc = require("swagger-jsdoc");
const path = require('path');
// Using built-in __dirname for CommonJS

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "BaroHanpo API",
      version: "1.0.0",
      description: "BaroHanpo 백엔드 API 문서",
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "개발 서버"
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    path.join(__dirname, "../api/**/*.js"),
    path.join(__dirname, "../api/**/*.js"),
  ],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
