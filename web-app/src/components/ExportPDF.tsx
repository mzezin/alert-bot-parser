import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportPDFProps {
  chartRef: React.RefObject<HTMLDivElement | null>;
  data: {
    totalMessages: number;
    exportDate: string;
  };
}

export const ExportPDF = ({ chartRef, data }: ExportPDFProps) => {
  const exportToPDF = async () => {
    if (!chartRef.current) return;

    try {
      const canvas = await html2canvas(chartRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      
      // Размеры A4 в landscape: 297x210mm
      const pdfWidth = 297;
      const pdfHeight = 210;
      const imgWidth = pdfWidth - 20; // отступы
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.text('Отчет по сообщениям Telegram', 20, 20);
      pdf.text(`Дата экспорта: ${new Date(data.exportDate).toLocaleString('ru-RU')}`, 20, 30);
      pdf.text(`Всего сообщений: ${data.totalMessages}`, 20, 40);

      pdf.addImage(imgData, 'PNG', 10, 50, imgWidth, imgHeight);

      pdf.save('telegram-messages-report.pdf');
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