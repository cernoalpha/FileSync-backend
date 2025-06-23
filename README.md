# FileSync Backend

This is the backend server for FileSync that handles file uploads to ImageKit.

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

1. Copy the environment example file:
```bash
cp env.example .env
```

2. Edit `.env` and add your ImageKit credentials:
```env
# ImageKit Configuration
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_endpoint

# Server Configuration
PORT=8080
NODE_ENV=development
```

### 3. Get ImageKit Credentials

1. Sign up at [ImageKit.io](https://imagekit.io/)
2. Create a new project
3. Go to Settings > API Keys
4. Copy your Public Key, Private Key, and URL Endpoint

### 4. Run the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will run on `http://localhost:8080`

## API Endpoints

### Health Check
- `GET /health` - Check if server is running

### File Upload
- `POST /api/upload` - Upload file to ImageKit
  - Body: FormData with `file`, `roomCode`, `senderId`, `senderName`
  - Returns: File information with ImageKit URL

### File Delete
- `DELETE /api/delete/:fileId` - Delete file from ImageKit
  - Params: `fileId` (ImageKit file ID)

### File Details
- `GET /api/file/:fileId` - Get file details from ImageKit
  - Params: `fileId` (ImageKit file ID)

## Features

- File upload to ImageKit with 5MB size limit
- Automatic file organization by room code
- File deletion from ImageKit
- CORS enabled for frontend integration
- Error handling and logging 