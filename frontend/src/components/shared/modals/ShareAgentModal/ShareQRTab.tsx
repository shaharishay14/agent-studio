import { useRef, useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { ShareQRTabProps } from './types';

export function ShareQRTab({ agentLink }: ShareQRTabProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [qrSize, setQrSize] = useState(180);

  useEffect(() => {
    const handleResize = () => {
      setQrSize(window.innerWidth < 640 ? 140 : 180);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDownload = () => {
    if (!qrRef.current) return;
    
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    // Create canvas to convert SVG to PNG
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      // Download as PNG
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = 'agent-qr-code.png';
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="m-0 self-stretch text-sm text-white/72">Scan with a phone camera to open the chat. Download it to print or add to slides.</p>
      <div ref={qrRef} className="rounded-3xl bg-white p-3">
        <QRCodeSVG value={agentLink} size={qrSize} level="H" includeMargin={true} fgColor="#000000" bgColor="#ffffff" title="QR code for the public chat link" />
      </div>
      <Button variant="glass" block onClick={handleDownload}>
        <Download />
        Download PNG
      </Button>
    </div>
  );
}
