interface ParsedResume {
  success: boolean;
  text: string;
  numPages: number;
  info: any;
  pages: any;
  previewImageBase64: string;
  error?: string;
}

export class PDFProcessingService {
  private static getApiBaseUrl(): string {
    return process.env.REACT_APP_ENV === "docker" ? "http://localhost:8100" : "http://localhost:8000";
  }

  static async processResume(file: File): Promise<ParsedResume> {
    const formData = new FormData();
    formData.append("resume", file);

    try {
      const response = await fetch(`${this.getApiBaseUrl()}/api/pdf/process-resume`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error processing resume:", error);
      throw error;
    }
  }

  static validatePDFFile(file: File): void {
    if (!file) {
      throw new Error("No file selected");
    }

    if (file.type !== "application/pdf") {
      throw new Error("Please select a PDF file");
    }

    // 10MB limit
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error("File size must be less than 10MB");
    }
  }
}
