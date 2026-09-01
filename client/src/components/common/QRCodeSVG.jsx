import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

export default function QRCodeSVG({
  value = 'https://jewelflow.app',
  size = 80,
  className = ''
}) {
  const [svgContent, setSvgContent] = useState('');

  useEffect(() => {
    let isMounted = true;
    if (!value) return;

    QRCode.toString(value, {
      type: 'svg',
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
      .then((svg) => {
        if (isMounted) {
          setSvgContent(svg);
        }
      })
      .catch((err) => {
        console.error('Error generating QR code SVG:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [value]);

  if (!svgContent) {
    return (
      <div
        className={`bg-slate-100 flex items-center justify-center text-[8px] text-slate-400 ${className}`}
        style={{ width: size, height: size }}
      >
        QR...
      </div>
    );
  }

  return (
    <div
      className={`inline-block select-none overflow-hidden ${className}`}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}
