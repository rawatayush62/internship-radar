export interface ExtractedPdfText {
  text: string;
  pageCount: number;
}

export async function extractPdfText(file: File): Promise<ExtractedPdfText> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer())
  });
  const document = await loadingTask.promise;

  try {
    const pageTexts: string[] = [];

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = content.items
        .flatMap((item) =>
          "str" in item && typeof item.str === "string" ? [item.str] : []
        )
        .join(" ");
      pageTexts.push(pageText);
      page.cleanup();
    }

    return {
      text: pageTexts.join("\n").replace(/\s+/g, " ").trim(),
      pageCount: document.numPages
    };
  } finally {
    await loadingTask.destroy();
  }
}
