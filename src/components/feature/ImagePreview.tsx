"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Image, { StaticImageData } from "next/image";

import { Rnd, RndDragCallback, RndResizeCallback } from "react-rnd";

import { clsx } from "clsx";

import downloadPDF from "@/utils/downloadPDF";

const ImagePreview: React.FC<{
  src: string;
  fileName?: string;
  index: number;
  signatureFile?: StaticImageData | null;
}> = ({ src, fileName = "", index, signatureFile }) => {
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  }>({
    width: 0,
    height: 0,
  });
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  const name = useMemo(
    () => `${fileName} Page ${index + 1}`,
    [fileName, index],
  );

  useEffect(() => {
    if (!signatureFile) return;
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const aspectRatio = signatureFile.height / signatureFile.width;
      const width = containerWidth * 0.8;
      const height = containerWidth * aspectRatio * 0.8;
      setDimensions({ width, height });
    }
  }, [signatureFile]);

  const handleDragStop: RndDragCallback = useCallback((_e, d) => {
    setPosition({ x: d.x, y: d.y });
  }, []);

  const handleResizeStop: RndResizeCallback = useCallback(
    (_e, _direction, ref, _delta, newPosition) => {
      setDimensions({
        width: ref.offsetWidth,
        height: ref.offsetHeight,
      });
      setPosition(newPosition);
    },
    [],
  );

  const handleDownloadPDF = useCallback(async () => {
    if (!containerRef.current) return;

    await downloadPDF([containerRef.current], name);
  }, [name]);

  const onAnchorClick = useCallback<React.MouseEventHandler<HTMLAnchorElement>>(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();
    },
    [],
  );

  return (
    <div className={clsx("space-y-4")}>
      <button
        onClick={handleDownloadPDF}
        className={clsx(
          "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700",
          "w-full",
        )}
      >
        下載 PDF
      </button>
      <div
        className={clsx("relative inline-block", "border")}
        ref={containerRef}
      >
        <a
          onClick={onAnchorClick}
          href={src}
          download={name}
          target="_blank"
          rel="noreferrer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={name} className={"block w-full"} />
        </a>
        {dimensions.width > 0 && signatureFile && (
          <Rnd
            size={{ width: dimensions.width, height: dimensions.height }}
            position={{ x: position.x, y: position.y }}
            lockAspectRatio
            onDragStop={handleDragStop}
            onResizeStop={handleResizeStop}
            bounds="parent"
            className={clsx(
              "absolute",
              "hover:border border-dashed border-gray-400",
              "z-10 cursor-move",
            )}
          >
            <Image
              src={signatureFile}
              alt="Signature"
              className={clsx("select-none pointer-events-none")}
            />
          </Rnd>
        )}
      </div>
    </div>
  );
};

export default ImagePreview;
