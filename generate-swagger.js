import swaggerJsdoc from 'swagger-jsdoc';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Barohanpo API',
      version: '1.0.0',
      description: 'Barohanpo API Documentation',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/api/**/*.routes.js'], // API 라우트 파일 경로
};

const specs = swaggerJsdoc(options);

// docs 디렉토리가 없으면 생성
const docsDir = path.join(__dirname, 'docs');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// swagger.json 파일로 저장
fs.writeFileSync(
  path.join(docsDir, 'swagger.json'),
  JSON.stringify(specs, null, 2)
);

console.log('Swagger JSON file has been generated!');
