"use client";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import React, { useCallback, useRef, useState } from "react";
import { useAsyncEffect, useOnceEffect } from "@reactuses/core";
import { StaticImageData } from "next/image";

import { pdfjs } from "react-pdf";
import { clsx } from "clsx";

import ImagePreview from "@/components/feature/ImagePreview";
import downloadPDF from "@/utils/downloadPDF";

const fetchSignatureImage = async (): Promise<StaticImageData | null> => {
  try {
    return (await import("@/../public/assets/images/signature.png"))
      .default as unknown as StaticImageData;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    console.log("No signature image found");
    return null;
  }
};

const getImageDimensionsFromFile = (
  file: File,
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      URL.revokeObjectURL(url); // 避免記憶體洩漏
      resolve({ width, height });
    };

    img.onerror = (error) => {
      URL.revokeObjectURL(url);
      reject(error);
    };

    img.src = url;
  });
};

const convertFileToStaticImageData = async (
  file: File,
): Promise<StaticImageData | null> => {
  const { width, height } = await getImageDimensionsFromFile(file);
  const src = URL.createObjectURL(file);

  return {
    src,
    width,
    height,
  };
};

export default function PdfPreviewPage() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [rawImages, setRawImages] = useState<string[][]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [signatureFile, setSignatureFile] = useState<StaticImageData | null>(
    null,
  );
  const [hasDefaultSignature, setHasDefaultSignature] = useState(false);

  useOnceEffect(() => {
    if (typeof window !== "undefined") {
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    }
  }, []);

  useAsyncEffect(
    async () => {
      const signatureFile = await fetchSignatureImage();
      setSignatureFile(signatureFile);
      setHasDefaultSignature(signatureFile !== null);
    },
    () => {},
    [],
  );

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
      event.target.value = "";
    },
    [renderPdfToImages],
  );

  const handleSignatureFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const signatureFile = await convertFileToStaticImageData(file);
      setSignatureFile(signatureFile);
      event.target.value = "";
    },
    [],
  );

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">PDF Signature Generator</h1>

      <div className={clsx("flex space-x-4", "mb-6")}>
        <UploadButton
          disabled={!signatureFile}
          id={"pdf-file"}
          accept={"application/pdf"}
          multiple
          onChange={handleFileUpload}
          className={clsx("bg-green-600")}
          name={"Upload PDFs"}
        />
        {!hasDefaultSignature && (
          <UploadButton
            id={"signature"}
            accept={"image/*"}
            name={"Upload Signature"}
            className={clsx("bg-blue-600")}
            onChange={handleSignatureFileUpload}
          />
        )}
      </div>

      {isLoading && <p className="text-blue-600">Rendering images...</p>}

      {rawImages.map((images, fileIdx) => {
        const fileName = uploadedFiles[fileIdx]?.name.replace(/\.[^/.]+$/, "");
        return (
          <Group key={fileIdx} fileName={fileName}>
            {images.map((src, idx) => (
              <ImagePreview
                key={idx}
                src={src}
                index={idx}
                fileName={fileName}
                signatureFile={signatureFile}
              />
            ))}
          </Group>
        );
      })}
    </main>
  );
}

const UploadButton: React.FC<React.JSX.IntrinsicElements["input"]> = ({
  className,
  ...props
}) => {
  return (
    <label
      htmlFor={props.id}
      className={clsx(
        "py-3 px-4",
        "rounded-lg",
        className,
        props.disabled && ["opacity-50", "cursor-not-allowed"],
      )}
    >
      <span>{props.name}</span>
      <input
        type="file"
        onChange={props.onChange}
        className={"hidden invisible"}
        {...props}
      />
    </label>
  );
};

const Group: React.FC<{
  children: React.ReactNode;
  className?: string;
  fileName?: string;
}> = ({ children, className, fileName = "" }) => {
  const groupRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(async () => {
    const children = groupRef.current?.children;
    if (!children) return;
    await downloadPDF(Array.from(children) as HTMLElement[], fileName);
  }, [fileName]);

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-medium">{fileName}</h3>
      <button
        onClick={handleClick}
        className={clsx(
          "px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700",
          "w-full",
        )}
      >
        下載整份 PDF
      </button>
      <div className={clsx("space-y-4", className)} ref={groupRef}>
        {children}
      </div>
    </div>
  );
};
