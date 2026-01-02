import React, { useEffect, useRef, useState } from 'react';
import QRCodeLib from 'qrcode';
import { Download, Printer, Copy, Check } from 'lucide-react';
import { Button } from '../ui';

interface QRPreviewProps {
  code: string;
  size?: number;
  showActions?: boolean;
  className?: string;
  url?: string; // URL personalizada, si no se proporciona usa la por defecto
}

export const QRPreview: React.FC<QRPreviewProps> = ({
  code,
  size = 256,
  showActions = true,
  className = '',
  url
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrUrl, setQrUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // URL por defecto para el QR
  const defaultUrl = `${window.location.origin}/qr/${code}`;
  const finalUrl = url || defaultUrl;

  useEffect(() => {
    generateQR();
  }, [code, size, finalUrl]);

  const generateQR = async () => {
    if (!canvasRef.current) return;

    try {
      // Generar QR con configuración personalizada
      await QRCodeLib.toCanvas(canvasRef.current, finalUrl, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      
      // Generar URL para descarga
      const dataUrl = canvasRef.current.toDataURL('image/png');
      setQrUrl(dataUrl);
    } catch (error) {
      console.error('Error generando QR:', error);
    }
  };



  const handleDownload = () => {
    if (!qrUrl) return;

    const link = document.createElement('a');
    link.download = `AFPets-QR-${code}.png`;
    link.href = qrUrl;
    link.click();
  };

  const handlePrint = () => {
    if (!qrUrl) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Imprimir QR - ${code}</title>
          <style>
            body { 
              margin: 0; 
              padding: 20px; 
              text-align: center; 
              font-family: Arial, sans-serif; 
            }
            .qr-container { 
              page-break-inside: avoid; 
              margin: 20px auto;
              max-width: 300px;
            }
            .qr-code { 
              width: 200px; 
              height: 200px; 
              margin: 0 auto 10px; 
            }
            .qr-info { 
              font-size: 12px; 
              color: #666; 
            }
            @media print {
              body { margin: 0; padding: 10px; }
              .qr-container { margin: 10px auto; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <img src="${qrUrl}" alt="QR Code" class="qr-code" />
            <div class="qr-info">
              <strong>AFPets QR</strong><br/>
              Código: ${code}<br/>
              Escanea para contactar al dueño<br/>
              afpets.com
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(finalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copiando URL:', error);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* QR Code Canvas */}
      <div className="flex justify-center">
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <canvas
            ref={canvasRef}
            className="block"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>
      </div>

      {/* QR Info */}
      <div className="text-center space-y-2">
        <p className="text-sm font-medium text-gray-900">Código: {code}</p>
        <p className="text-xs text-gray-600">URL: {finalUrl}</p>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            icon={<Download className="h-4 w-4" />}
          >
            Descargar PNG
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            icon={<Printer className="h-4 w-4" />}
          >
            Imprimir
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyUrl}
            icon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          >
            {copied ? 'Copiado' : 'Copiar URL'}
          </Button>
        </div>
      )}
    </div>
  );
};