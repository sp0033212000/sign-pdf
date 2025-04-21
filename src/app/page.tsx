"use client";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import React, { useCallback, useState } from "react";
import { useOnceEffect } from "@reactuses/core";

import { pdfjs } from "react-pdf";
import ImagePreview from "@/components/feature/ImagePreview";

export default function PdfPreviewPage() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [rawImages, setRawImages] = useState<string[][]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useOnceEffect(() => {
    if (typeof window !== "undefined") {
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    }
  }, []);

  const renderPageToImage = useCallback(
    async (page: pdfjs.PDFPageProxy): Promise<string> => {
      const scale = window.devicePixelRatio * 2;
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) throw new Error("Failed to get 2D context");

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: context, viewport }).promise;
      return canvas.toDataURL();
    },
    [],
  );

  const renderPdfToImages = useCallback(
    async (file: File): Promise<string[]> => {
      const pdf = await pdfjs.getDocument(await file.arrayBuffer()).promise;
      const totalPages = pdf.numPages;
      const images: string[] = [];

      for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const image = await renderPageToImage(page);
        images.push(image);
      }

      return images;
    },
    [renderPageToImage],
  );

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      if (files.length === 0) return;

      setIsLoading(true);
      setUploadedFiles(files);
      setRawImages([]);

      Promise.all(files.map(renderPdfToImages)).then((allImages) => {
        setRawImages(allImages);
        setIsLoading(false);
      });
    },
    [renderPdfToImages],
  );

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">PDF to Image Converter</h1>

      <input
        type="file"
        accept="application/pdf"
        multiple
        onChange={handleFileUpload}
        className="mb-6"
      />

      {isLoading && <p className="text-blue-600">Rendering images...</p>}

      {rawImages.map((images, fileIdx) => (
        <div key={fileIdx} className="space-y-2">
          <h3 className="text-lg font-medium">
            {uploadedFiles[fileIdx]?.name.replace(/\.[^/.]+$/, "")}
          </h3>
          {images.map((src, idx) => (
            <ImagePreview
              key={idx}
              src={src}
              index={idx}
              fileName={uploadedFiles[fileIdx]?.name.replace(/\.[^/.]+$/, "")}
            />
          ))}
        </div>
      ))}
    </main>
  );
}
