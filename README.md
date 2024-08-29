# 0x04. Files manager

## Project Overview

This project is a simple file management system that allows users to authenticate, upload, view, and manage files. It is built using Node.js, Express, MongoDB, and Redis. The project is designed as a learning exercise to demonstrate the integration of various back-end technologies including user authentication, file storage, and background processing.

## Features

- **User Authentication:** Users can register and log in using a token-based authentication system.
- **File Upload:** Users can upload files to the server.
- **File Listing:** Users can view a list of all files they have uploaded.
- **File Permission Management:** Users can change the permission of a file to be either public or private.
- **File Viewing:** Users can view files, with support for generating thumbnails for image files.
- **Background Processing:** Thumbnail generation is handled as a background task using a worker process.

## Technologies Used

- **Node.js:** JavaScript runtime used to build the server.
- **Express.js:** Web framework for handling routes and requests.
- **MongoDB:** NoSQL database for storing user and file data.
- **Redis:** In-memory data structure store, used for temporary data like authentication tokens.
- **Bull:** A library for handling background jobs (e.g., thumbnail generation).
- **Multer:** Middleware for handling file uploads.
- **Image-Thumbnail:** Library for generating thumbnails of images.
- **Mocha & Chai:** Testing framework and assertion library.
- **ESLint:** Linter for ensuring code quality and consistency.

## API Endpoints

- **User Registration:** `POST /api/register`
- **User Login:** `POST /api/login`
- **Upload File:** `POST /api/files/upload`
- **List Files:** `GET /api/files`
- **Change File Permission:** `PUT /api/files/:id/permission`
- **View File:** `GET /api/files/:id`

# License

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.
