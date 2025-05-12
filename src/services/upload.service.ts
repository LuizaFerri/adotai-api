import cloudinary from '../config/cloudinary';
import fs from 'fs';

export class UploadService {

  async uploadFromUrl(imageUrl: string): Promise<string> {
    try {
      const result = await cloudinary.uploader.upload(imageUrl, {
        folder: 'adotai/pets',
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto' }
        ]
      });
      
      return result.secure_url;
    } catch (error) {
      console.error('Erro ao enviar imagem para o Cloudinary:', error);
      throw new Error('Falha ao fazer upload da imagem');
    }
  }

  async uploadFromFile(filePath: string): Promise<string> {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'adotai/pets',
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto' }
        ]
      });
      

      fs.unlinkSync(filePath);
      
      return result.secure_url;
    } catch (error) {
      console.error('Erro ao enviar imagem para o Cloudinary:', error);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      throw new Error('Falha ao fazer upload da imagem');
    }
  }


  async uploadFromBase64(base64Image: string): Promise<string> {
    try {
      const result = await cloudinary.uploader.upload(base64Image, {
        folder: 'adotai/pets',
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto' }
        ]
      });
      
      return result.secure_url;
    } catch (error) {
      console.error('Erro ao enviar imagem para o Cloudinary:', error);
      throw new Error('Falha ao fazer upload da imagem');
    }
  }
} 