import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { X, Download, Printer } from 'lucide-react';

export default function QRCodeModal({ isOpen, onClose, weapon }) {
  const canvasRef = useRef(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState(null);

  useEffect(() => {
    if (isOpen && weapon && canvasRef.current) {
      // The exact JSON string required by the mobile scanner
      const qrData = {
        type: 'DEFENCE_WEAPON',
        weaponId: weapon.id,
        weaponName: weapon.name,
        serialNumber: weapon.serialNumber,
        category: weapon.category || 'RIFLE',
        baseId: 'base-northern-001',
        generatedAt: new Date().toISOString(),
        systemVersion: '1.0'
      };

      const qrString = JSON.stringify(qrData);

      QRCode.toCanvas(canvasRef.current, qrString, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      }, (error) => {
        if (error) console.error('Failed to generate QR code', error);
      });

      // Also generate a data URL for the download feature
      QRCode.toDataURL(qrString, {
        width: 400,
        margin: 2
      }, (error, url) => {
        if (!error) {
          setQrCodeDataUrl(url);
        }
      });
    }
  }, [isOpen, weapon]);

  if (!isOpen || !weapon) return null;

  const handleDownload = () => {
    if (!qrCodeDataUrl) return;
    const link = document.createElement('a');
    link.download = `${weapon.id}-qrcode.png`;
    link.href = qrCodeDataUrl;
    link.click();
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code - ${weapon.id}</title>
          <style>
            body { font-family: monospace; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .container { text-align: center; padding: 20px; border: 2px dashed #000; }
            img { max-width: 400px; }
            h2, p { margin: 5px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>${weapon.name}</h2>
            <p>ID: ${weapon.id}</p>
            <p>S/N: ${weapon.serialNumber}</p>
            <img src="${qrCodeDataUrl}" />
          </div>
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">Generated QR Code</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-md transition-colors text-gray-500">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 flex flex-col items-center">
          <div className="text-center mb-6">
            <h4 className="text-xl font-bold text-gray-900">{weapon.name}</h4>
            <p className="text-sm text-gray-500 font-mono mt-1">S/N: {weapon.serialNumber}</p>
          </div>
          
          <div className="mb-8 p-2 border border-gray-100 rounded-lg shadow-sm">
            <canvas ref={canvasRef} className="max-w-[300px] max-h-[300px] w-full h-full" />
          </div>
          
          <div className="flex w-full gap-3">
            <button 
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white py-2.5 rounded-lg font-medium transition-all"
            >
              <Download size={18} />
              Download PNG
            </button>
            <button 
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-medium transition-all"
            >
              <Printer size={18} />
              Print Label
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
