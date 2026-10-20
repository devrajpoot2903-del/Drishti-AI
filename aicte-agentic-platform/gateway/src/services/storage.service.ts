import fs from "fs";
import path from "path";
import crypto from "crypto";

const STORAGE_ROOT = path.resolve(__dirname, "../../../storage");
const DOCUMENTS_DIR = path.join(STORAGE_ROOT, "documents");
const EVIDENCE_DIR = path.join(STORAGE_ROOT, "evidence");

export interface StoredDocument {
  id: string;
  originalFilename: string;
  storageFilename: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  uploadedAt: string;
}

export class StorageService {
  private static ensureDirs() {
    if (!fs.existsSync(DOCUMENTS_DIR)) {
      fs.mkdirSync(DOCUMENTS_DIR, { recursive: true });
    }
    if (!fs.existsSync(EVIDENCE_DIR)) {
      fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
    }
  }

  public static async saveUploadedBuffer(
    buffer: Buffer,
    originalFilename: string,
    mimeType: string
  ): Promise<StoredDocument> {
    this.ensureDirs();

    const allowedMimes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    const ext = path.extname(originalFilename).toLowerCase();
    const allowedExts = [".pdf", ".png", ".jpg", ".jpeg"];

    if (!allowedExts.includes(ext)) {
      throw new Error(`Unsupported file extension: ${ext}. Supported: PDF, PNG, JPG, JPEG`);
    }

    const docId = `doc_${crypto.randomUUID().slice(0, 12)}`;
    const storageFilename = `${docId}${ext}`;
    const storagePath = path.join(DOCUMENTS_DIR, storageFilename);

    const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");

    fs.writeFileSync(storagePath, buffer);

    return {
      id: docId,
      originalFilename: path.basename(originalFilename),
      storageFilename,
      storagePath,
      mimeType: mimeType || (ext === ".pdf" ? "application/pdf" : "image/jpeg"),
      sizeBytes: buffer.length,
      sha256,
      uploadedAt: new Date().toISOString()
    };
  }

  public static getDocumentPath(storageFilename: string): string | null {
    this.ensureDirs();
    // Path traversal prevention: enforce strictly matching basename
    const safeName = path.basename(storageFilename);
    const resolvedPath = path.join(DOCUMENTS_DIR, safeName);
    if (!fs.existsSync(resolvedPath)) {
      return null;
    }
    return resolvedPath;
  }

  public static getEvidencePath(filename: string): string | null {
    this.ensureDirs();
    const safeName = path.basename(filename);
    const resolvedPath = path.join(EVIDENCE_DIR, safeName);
    if (!fs.existsSync(resolvedPath)) {
      return null;
    }
    return resolvedPath;
  }
}
