# Barohanpo Backend

Backend service for the Barohanpo application, built with Node.js, Express, and MySQL. This service provides RESTful APIs for user authentication, profile management, and other core functionalities.

## Features

- **JWT Authentication** with access and refresh tokens
- **Secure Cookie-based** refresh token handling
- **Token Rotation** for enhanced security
- **Rate Limiting** on authentication endpoints
- **CORS** with secure configuration
- **API Documentation** with Swagger/OpenAPI
- **Environment-based** configuration
- **Input Validation** and sanitization
- **Error Handling** with consistent response format
- **Logging** with configurable levels
- **Database Migrations**
- **Integration Tests**

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/barohanpo-be.git
cd barohanpo-be
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Set Up Environment Variables

Copy the example environment file and update the values:

```bash
cp .env.example .env
```

Edit the `.env` file with your database credentials and other settings.

### 4. Database Setup

Create a MySQL database and run migrations:

```bash
# Create the database (replace with your database name)
mysql -u root -p -e "CREATE DATABASE barohanpo;"

# Run migrations
npm run migrate
```

### 5. Start the Development Server

```bash
npm run dev
# or
yarn dev
```

The server will start on `http://localhost:5000` by default.

## API Documentation

API documentation is available at `/api-docs` when the server is running in development mode.

## Authentication Flow

1. **Login**:
   - Send a POST request to `/api/auth/login` with email and password
   - Receive an access token in the response body
   - A refresh token is set as an HTTP-only cookie

2. **Access Protected Routes**:
   - Include the access token in the `Authorization` header: `Bearer <token>`

3. **Refresh Token**:
   - When the access token expires, send a POST request to `/api/auth/refresh-token`
   - The refresh token is automatically sent via cookie
   - A new access token and refresh token are returned

4. **Logout**:
   - Send a POST request to `/api/auth/logout`
   - The refresh token is invalidated
   - The refresh token cookie is cleared

## Environment Variables

See `.env.example` for all available environment variables.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Run coverage report
npm run test:coverage
```

## Project Structure

```
src/
├── api/                    # API routes
│   └── auth/               # Authentication routes and controllers
│       ├── auth.controller.js
│       ├── auth.middleware.js
│       ├── auth.route.js
│       ├── auth.service.js
│       └── auth.types.js
├── config/                 # Configuration files
│   ├── database.js
│   ├── jwt.config.js
│   └── swagger.js
├── migrations/             # Database migrations
├── models/                 # Database models
├── utils/                  # Utility functions
│   ├── errorHandler.js
│   └── logger.js
└── app.js                  # Express app setup
```

## Security Best Practices

- **Never store tokens** in `localStorage` or `sessionStorage`
- Always use **HTTPS** in production
- Set appropriate **CORS** policies
- Use **secure, HTTP-only cookies** for refresh tokens
- Implement **rate limiting** on authentication endpoints
- Keep dependencies updated
- Use environment variables for sensitive data

## Contributing

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository.
