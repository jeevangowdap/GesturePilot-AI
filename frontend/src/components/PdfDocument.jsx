import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function PdfDocument({
    currentPage = 1,
    setCurrentPage = () => { },
    onDocumentLoaded = () => { },
}) {
    const canvasRef = useRef(null);
    const documentRef = useRef(null);
    const [totalPages, setTotalPages] = useState(0);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleUpload(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        setError('');

        if (file.type !== 'application/pdf' &&
            !file.name.toLowerCase().endsWith('.pdf')) {
            setError('Please select a PDF file.');
            event.target.value = '';
            return;
        }

        if (file.size > 20 * 1024 * 1024) {
            setError('Please choose a PDF smaller than 20 MB.');
            event.target.value = '';
            return;
        }

        setLoading(true);

        try {
            const data = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data }).promise;

            documentRef.current = pdf;
            setTotalPages(pdf.numPages);
            setCurrentPage(1);
            onDocumentLoaded({ filename: file.name, totalPages: pdf.numPages });
        } catch (err) {
            console.error(err);
            setError('Could not open this PDF. Please try another file.');
        } finally {
            setLoading(false);
            event.target.value = '';
        }
    }

    useEffect(() => {
        let cancelled = false;

        async function renderPage() {
            const pdf = documentRef.current;
            const canvas = canvasRef.current;

            if (!pdf || !canvas || currentPage < 1 || currentPage > pdf.numPages) {
                return;
            }

            try {
                const page = await pdf.getPage(currentPage);
                if (cancelled) return;

                const viewport = page.getViewport({ scale: 1.3 });
                const context = canvas.getContext('2d');

                canvas.width = viewport.width;
                canvas.height = viewport.height;

                await page.render({ canvasContext: context, viewport }).promise;
            } catch (err) {
                if (!cancelled) {
                    console.error(err);
                    setError('Unable to render this PDF page.');
                }
            }
        }

        renderPage();
        return () => {
            cancelled = true;
        };
    }, [currentPage, totalPages]);

    return (
        <section className="pdf-document">
            <label>
                <strong>Upload PDF</strong>
                <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleUpload}
                />
            </label>

            {loading && <p>Loading PDF...</p>}
            {error && <p role="alert">{error}</p>}

            {totalPages > 0 && (
                <>
                    <p>
                        Page {currentPage} of {totalPages}
                    </p>
                    <canvas
                        ref={canvasRef}
                        style={{ maxWidth: '100%', height: 'auto' }}
                    />
                </>
            )}
        </section>
    );
}