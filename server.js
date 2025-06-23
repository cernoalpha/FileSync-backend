import express from 'express';
import cors from 'cors';
import multer from 'multer';
import ImageKit from 'imagekit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Validate required environment variables
const requiredEnvVars = ['IMAGEKIT_PUBLIC_KEY', 'IMAGEKIT_PRIVATE_KEY', 'IMAGEKIT_URL_ENDPOINT'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please check your .env file and ensure all ImageKit credentials are set.');
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Initialize ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check endpoint hit');
  res.json({ 
    status: 'OK', 
    message: 'FileSync Backend is running',
    imagekit: {
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY ? 'Configured' : 'Missing',
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY ? 'Configured' : 'Missing',
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT ? 'Configured' : 'Missing'
    }
  });
});

// Upload file to ImageKit
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { originalname, buffer, mimetype } = req.file;
    const { roomCode, senderId, senderName } = req.body;

    // Validate required fields
    if (!roomCode || !senderId || !senderName) {
      return res.status(400).json({ 
        error: 'Missing required fields: roomCode, senderId, senderName' 
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = path.extname(originalname);
    const fileName = `${roomCode}/${timestamp}-${originalname}`;

    console.log('📤 Uploading file to ImageKit:', fileName);

    // Upload to ImageKit with better error handling
    let uploadResponse;
    try {
      uploadResponse = await imagekit.upload({
        file: buffer,
        fileName: fileName,
        folder: 'filesync',
        useUniqueFileName: false,
      });
    } catch (uploadError) {
      console.error('ImageKit upload error:', uploadError);
      return res.status(500).json({ 
        error: 'Failed to upload file to ImageKit',
        details: uploadError.message 
      });
    }

    // Validate upload response
    if (!uploadResponse || !uploadResponse.fileId) {
      console.error('Invalid upload response:', uploadResponse);
      return res.status(500).json({ 
        error: 'Invalid response from ImageKit upload' 
      });
    }

    // Return file information
    const fileInfo = {
      id: uploadResponse.fileId,
      name: originalname,
      url: uploadResponse.url,
      size: buffer.length,
      type: mimetype,
      senderId: senderId,
      senderName: senderName,
      timestamp: timestamp,
      imagekitFileId: uploadResponse.fileId,
    };

    console.log('✅ File uploaded successfully:', fileInfo.id);
    res.json(fileInfo);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload file',
      details: error.message 
    });
  }
});

// Delete file from ImageKit
app.delete('/api/delete/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    if (!fileId) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    console.log('🗑️  Deleting file from ImageKit:', fileId);
    
    await imagekit.deleteFile(fileId);
    
    console.log('✅ File deleted successfully:', fileId);
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ 
      error: 'Failed to delete file',
      details: error.message 
    });
  }
});

// Get file information
app.get('/api/file/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    if (!fileId) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    console.log('📋 Getting file details from ImageKit:', fileId);
    
    const fileDetails = await imagekit.getFileDetails(fileId);
    
    console.log('✅ File details retrieved successfully');
    res.json(fileDetails);
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ 
      error: 'Failed to get file details',
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    details: error.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📁 ImageKit configuration: ${process.env.IMAGEKIT_URL_ENDPOINT ? '✅ Configured' : '❌ Missing'}`);
}); 