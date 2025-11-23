import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, setDoc, getDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { storage, db } from '../firebase';
import { PDFParserService, type ProcessedResume } from './pdfParserService';

export interface FirebaseResume {
  id: string;
  userId: string;
  filename: string;
  originalFilename: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  isActive: boolean;
  processedData?: ProcessedResume;
}

export interface ResumeUploadResult {
  success: boolean;
  resumeId?: string;
  fileUrl?: string;
  error?: string;
}

export class FirebaseResumeService {
  private static storage = getStorage();
  private static db = db;

  /**
   * Upload resume file to Firebase Storage and store metadata in Firestore
   */
  static async uploadResume(
    userId: string, 
    file: File, 
    isActive: boolean = true
  ): Promise<ResumeUploadResult> {
    try {
      console.log('Uploading resume to Firebase:', file.name);
      
      // Generate unique file name
      const timestamp = Date.now();
      const fileName = `${userId}_${timestamp}_${file.name}`;
      const storageRef = ref(this.storage, `resumes/${fileName}`);
      
      // Upload file to Firebase Storage
      const uploadResult = await uploadBytes(storageRef, file);
      console.log('File uploaded to storage:', uploadResult.metadata.fullPath);
      
      // Get download URL
      const fileUrl = await getDownloadURL(storageRef);
      console.log('Download URL obtained:', fileUrl);
      
      // Store metadata in Firestore
      const resumeData: Omit<FirebaseResume, 'id'> = {
        userId,
        filename: fileName,
        originalFilename: file.name,
        fileUrl,
        fileSize: file.size,
        fileType: file.type,
        uploadedAt: new Date().toISOString(),
        isActive
      };
      
      const docRef = doc(collection(this.db, 'resumes'));
      await setDoc(docRef, resumeData);
      
      console.log('Resume metadata stored in Firestore:', docRef.id);
      
      return {
        success: true,
        resumeId: docRef.id,
        fileUrl
      };
      
    } catch (error) {
      console.error('Error uploading resume:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Get all resumes for a user
   */
  static async getUserResumes(userId: string): Promise<FirebaseResume[]> {
    try {
      console.log('Getting resumes for user:', userId);
      
      const resumesQuery = query(
        collection(this.db, 'resumes'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(resumesQuery);
      const resumes: FirebaseResume[] = [];
      
      querySnapshot.forEach((doc) => {
        resumes.push({
          id: doc.id,
          ...doc.data()
        } as FirebaseResume);
      });
      
      console.log('Found resumes:', resumes.length);
      return resumes.sort((a, b) => 
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );
      
    } catch (error) {
      console.error('Error getting user resumes:', error);
      throw new Error('Failed to get resumes: ' + (error as Error).message);
    }
  }

  /**
   * Get active resume for a user
   */
  static async getActiveResume(userId: string): Promise<FirebaseResume | null> {
    try {
      console.log('Getting active resume for user:', userId);
      
      const resumesQuery = query(
        collection(this.db, 'resumes'),
        where('userId', '==', userId),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(resumesQuery);
      
      if (querySnapshot.empty) {
        console.log('No active resume found');
        return null;
      }
      
      const activeResume = {
        id: querySnapshot.docs[0].id,
        ...querySnapshot.docs[0].data()
      } as FirebaseResume;
      
      console.log('Active resume found:', activeResume.originalFilename);
      return activeResume;
      
    } catch (error) {
      console.error('Error getting active resume:', error);
      throw new Error('Failed to get active resume: ' + (error as Error).message);
    }
  }

  /**
   * Set a resume as active (deactivates all others)
   */
  static async setActiveResume(userId: string, resumeId: string): Promise<boolean> {
    try {
      console.log('Setting active resume:', resumeId);
      
      // First, deactivate all resumes for this user
      const resumesQuery = query(
        collection(this.db, 'resumes'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(resumesQuery);
      const batch = querySnapshot.docs.map(doc => 
        setDoc(doc.ref, { isActive: false }, { merge: true })
      );
      
      await Promise.all(batch);
      
      // Then activate the selected resume
      const resumeRef = doc(this.db, 'resumes', resumeId);
      await setDoc(resumeRef, { isActive: true }, { merge: true });
      
      console.log('Resume set as active successfully');
      return true;
      
    } catch (error) {
      console.error('Error setting active resume:', error);
      throw new Error('Failed to set active resume: ' + (error as Error).message);
    }
  }

  /**
   * Delete a resume
   */
  static async deleteResume(userId: string, resumeId: string): Promise<boolean> {
    try {
      console.log('Deleting resume:', resumeId);
      
      // Get resume data to delete file from storage
      const resumeDoc = await getDoc(doc(this.db, 'resumes', resumeId));
      
      if (!resumeDoc.exists()) {
        throw new Error('Resume not found');
      }
      
      const resumeData = resumeDoc.data() as FirebaseResume;
      
      // Delete file from Firebase Storage
      const storageRef = ref(this.storage, `resumes/${resumeData.filename}`);
      await deleteObject(storageRef);
      console.log('File deleted from storage');
      
      // Delete metadata from Firestore
      await deleteDoc(doc(this.db, 'resumes', resumeId));
      console.log('Resume metadata deleted from Firestore');
      
      return true;
      
    } catch (error) {
      console.error('Error deleting resume:', error);
      throw new Error('Failed to delete resume: ' + (error as Error).message);
    }
  }

  /**
   * Process a resume (download, parse, and store processed data)
   */
  static async processResume(resume: FirebaseResume): Promise<ProcessedResume> {
    try {
      console.log('Processing resume:', resume.originalFilename);
      
      // Download file from Firebase Storage
      const response = await fetch(resume.fileUrl);
      if (!response.ok) {
        throw new Error('Failed to download resume file');
      }
      
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);
      
      // Process using PDF parser service - convert Firebase resume to expected format
      const resumeData = {
        id: resume.id,
        filename: resume.originalFilename,
        original_filename: resume.originalFilename,
        file_size: resume.fileSize,
        file_type: resume.fileType,
        is_active: resume.isActive,
        uploaded_at: resume.uploadedAt
      };
      
      const processed = await PDFParserService.processResume(
        resumeData,
        async (id: string) => blob // Return the blob directly since we already have it
      );
      
      // Store processed data back to Firestore
      const resumeRef = doc(this.db, 'resumes', resume.id);
      await setDoc(resumeRef, { 
        processedData: processed,
        processedAt: new Date().toISOString()
      }, { merge: true });
      
      console.log('Resume processed and data stored');
      return processed;
      
    } catch (error) {
      console.error('Error processing resume:', error);
      throw new Error('Failed to process resume: ' + (error as Error).message);
    }
  }

  /**
   * Get processed resume data
   */
  static async getProcessedResume(resumeId: string): Promise<ProcessedResume | null> {
    try {
      console.log('Getting processed resume data:', resumeId);
      
      const resumeDoc = await getDoc(doc(this.db, 'resumes', resumeId));
      
      if (!resumeDoc.exists()) {
        throw new Error('Resume not found');
      }
      
      const resumeData = resumeDoc.data() as FirebaseResume;
      return resumeData.processedData || null;
      
    } catch (error) {
      console.error('Error getting processed resume:', error);
      throw new Error('Failed to get processed resume: ' + (error as Error).message);
    }
  }

  /**
   * Download resume file as blob
   */
  static async downloadResume(resume: FirebaseResume): Promise<Blob> {
    try {
      console.log('Downloading resume file:', resume.originalFilename);
      
      const response = await fetch(resume.fileUrl);
      if (!response.ok) {
        throw new Error('Failed to download resume file');
      }
      
      return await response.blob();
      
    } catch (error) {
      console.error('Error downloading resume:', error);
      throw new Error('Failed to download resume: ' + (error as Error).message);
    }
  }
}
