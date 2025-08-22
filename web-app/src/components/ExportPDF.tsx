import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportPDFProps {
  chartRef: React.RefObject<HTMLDivElement | null>;
  sessionsRef?: React.RefObject<HTMLDivElement | null>;
  data: {
    totalRecords: number;
    totalSessions?: number;
    exportDate: string;
  };
}

export const ExportPDF = ({ chartRef, sessionsRef }: ExportPDFProps) => {
  const exportToPDF = async () => {
    if (!chartRef.current) return;

    try {
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = 297;
      
      // Первый график - метрики по времени
      const canvas1 = await html2canvas(chartRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData1 = canvas1.toDataURL('image/png');
      const imgWidth = pdfWidth - 20;
      const imgHeight1 = (canvas1.height * imgWidth) / canvas1.width;
      
      pdf.addImage(imgData1, 'PNG', 10, 10, imgWidth, Math.min(imgHeight1, 190));

      // Второй график на новой странице (если есть)
      if (sessionsRef?.current) {
        pdf.addPage();
        
        const canvas2 = await html2canvas(sessionsRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
        });

        const imgData2 = canvas2.toDataURL('image/png');
        const imgHeight2 = (canvas2.height * imgWidth) / canvas2.width;
        
        pdf.addImage(imgData2, 'PNG', 10, 10, imgWidth, Math.min(imgHeight2, 190));
      }

      pdf.save('pan-metrics-report.pdf');
    } catch (error) {
      console.error('Ошибка при экспорте в PDF:', error);
      alert('Ошибка при создании PDF');
    }
  };

  return (
    <button
      onClick={exportToPDF}
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >
      Экспорт в PDF
    </button>
  );
};