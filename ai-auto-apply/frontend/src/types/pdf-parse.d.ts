// Type declarations for pdf-parse v1.1.4 (Node 18 compatible)

declare module 'pdf-parse' {
  interface PDFInfo {
    Title?: string;
    Author?: string;
    Subject?: string;
    Creator?: string;
    Producer?: string;
    CreationDate?: Date;
    ModDate?: Date;
    Keywords?: string;
  }

  interface PDFData {
    text: string;
    numpages: number;
    info: PDFInfo;
    metadata?: any;
    version?: string;
  }

  function pdf(buffer: Buffer | Uint8Array): Promise<PDFData>;
  
  export = pdf;
}
