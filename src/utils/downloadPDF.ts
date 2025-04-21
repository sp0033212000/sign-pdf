const downloadPDF = async (nodes: HTMLElement[], name: string) => {
  const html2canvas = (await import("html2canvas-pro")).default;
  const { jsPDF } = await import("jspdf");

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const canvas = await html2canvas(node, {
      scale: 2,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/jpeg", 1.0);
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    if (i !== 0) pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
  }

  pdf.save(`${name}_signed.pdf`);
};

export default downloadPDF;
