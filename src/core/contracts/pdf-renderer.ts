export interface PdfFile {
  file: Buffer;
  contentType: string;
  contentDisposition: string;
  contentLength?: string;
}

export interface PdfRenderer<Input> {
  execute(input: Input, requestId?: string): Promise<PdfFile>;
}
