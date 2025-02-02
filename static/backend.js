document.addEventListener('DOMContentLoaded', function() {
    const inputTranscript = document.getElementById('inputTranscript');
    const output = document.getElementById('output');
    const processBtn = document.getElementById('processBtn');
    const copyBtn = document.getElementById('copyBtn');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const restartBtn = document.getElementById('restartBtn');
    const hiddenSection = document.getElementById('hiddenSection');

    processBtn.addEventListener('click', processTranscript);
    copyBtn.addEventListener('click', copyTranslation);
    downloadPdfBtn.addEventListener('click', downloadPdf);
    restartBtn.addEventListener('click', restart);

    function processTranscript() {
        const input = inputTranscript.value.trim();

        if (input === '') {
            restart();
            return;
        }

        // Process the transcript
        const processedText = input
            .replace(/WEBVTT|^\d+\s*$/gm, '') // Remove WEBVTT and standalone line numbers
            .replace(/^\d+\s+/gm, '') // Remove leading numbers before each line
            .replace(/^\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}$/gm, '') // Remove timestamps
            .replace(/\r?\n/g, ' ') // Replace all line breaks with spaces
            .replace(/ +/g, ' ') // Remove multiple spaces
            .replace(/([.!?])\s+/g, '$1 ') // Ensure proper spacing after punctuation marks
            .replace(/(^|[.!?]\s+)([a-z])/g, (match, separator, letter) => {
                return separator + letter.toUpperCase(); // Capitalize the first letter of each sentence
            })
            .trim(); // Remove any leading/trailing spaces

        output.textContent = processedText;

        // Show the hidden section after processing
        hiddenSection.style.display = 'block';
    }

    function copyTranslation() {
        navigator.clipboard.writeText(output.textContent)
            .then(() => console.log('Text copied to clipboard'))
            .catch(err => console.error('Error copying text: ', err));
    }

    function downloadPdf() {
        // Check if the output contains only the placeholder text
        if (output.textContent.trim() === '' || output.textContent === 'Processed transcript will appear here...') {
            return; // Prevent PDF download if output is empty or placeholder
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const marginX = 10;
        const marginY = 30;
        const maxWidth = pageWidth - marginX * 2;
        const lineHeight = 7;
        const bottomMargin = 20;
        const availableHeight = pageHeight - marginY - bottomMargin;

        function addTitle(doc, title, yPosition) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            const titleWidth = doc.getTextWidth(title);
            const titleX = (pageWidth - titleWidth) / 2;
            doc.text(title, titleX, yPosition);
        }

        function addTextWithPagination(doc, text, startY) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(12);

            const formattedText = text.replace(/\n+/g, ' ').trim();
            const lines = doc.splitTextToSize(formattedText, maxWidth);
            let y = startY;

            lines.forEach(line => {
                if (y + lineHeight > availableHeight) {
                    doc.addPage();
                    y = marginY;
                }
                doc.text(line, marginX, y);
                y += lineHeight;
            });

            return y;
        }

        addTitle(doc, 'Original Text', 20);
        let yPosition = addTextWithPagination(doc, inputTranscript.value, marginY);

        doc.addPage();

        addTitle(doc, 'Processed Text', 20);
        addTextWithPagination(doc, output.textContent, marginY);

        doc.save('processed-transcript.pdf');
    }

    function restart() {
        inputTranscript.value = '';
        output.textContent = 'Processed transcript will appear here...';
        hiddenSection.style.display = 'none'; // Hide the section again
    }
});