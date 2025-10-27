import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Progress } from './ui/progress';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';

// Build version - Update this with each change
const BUILD_VERSION = '1.2.6';

const PrinterTest = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  
  // Test options
  const [numPages, setNumPages] = useState(1);
  const [includeText, setIncludeText] = useState(false);
  const [includeColorBars, setIncludeColorBars] = useState(false);
  const [includeLines, setIncludeLines] = useState(false);
  const [includeAlignment, setIncludeAlignment] = useState(false);

  // Loading animation (2 seconds)
  useEffect(() => {
    const duration = 2000;
    const interval = 30;
    const steps = duration / interval;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      setLoadingProgress((step / steps) * 100);

      if (step >= steps) {
        clearInterval(timer);
        setTimeout(() => setIsLoading(false), 200);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const handleClick = () => {
    if (showInstructions) {
      setShowInstructions(false);
      setShowConfig(true);
    }
  };

  const handlePrint = () => {
    if (!includeText && !includeColorBars && !includeLines && !includeAlignment) {
      alert('Selecteer minimaal één testoptie');
      return;
    }

    // Create print window
    const printWindow = window.open('', '_blank');
    let content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Printer Kwaliteitstest</title>
        <style>
          @media print {
            @page { 
              margin: 15mm;
              size: A4;
            }
            body { 
              margin: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            color: #000;
          }
          .page {
            page-break-after: always;
            min-height: 100vh;
            padding: 0;
            box-sizing: border-box;
            background: white;
          }
          .page:last-child {
            page-break-after: auto;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 3px solid #000;
            padding-bottom: 15px;
          }
          .header img {
            width: 80px;
            height: auto;
            margin-bottom: 10px;
          }
          .header h1 {
            margin: 10px 0;
            font-size: 24px;
            color: #000;
          }
          .header p {
            margin: 5px 0;
            font-size: 14px;
            color: #333;
          }
          .test-section {
            margin: 25px 0;
            padding: 15px;
            border: 2px solid #000;
            page-break-inside: avoid;
          }
          .test-section h2 {
            margin: 0 0 15px 0;
            font-size: 18px;
            color: #000;
            border-bottom: 2px solid #000;
            padding-bottom: 8px;
          }
          .color-bar {
            height: 40px;
            margin: 8px 0;
            border: 1px solid #000;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .color-label {
            font-size: 12px;
            margin: 2px 0 5px 0;
            font-weight: bold;
          }
          .test-lines .line {
            height: 2px;
            background: #000;
            margin: 15px 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .line-label {
            font-size: 11px;
            color: #333;
            margin-bottom: 3px;
          }
          .alignment-grid {
            border: 2px solid #000;
            padding: 0;
            margin: 15px 0;
          }
          .grid-lines {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 0;
          }
          .grid-cell {
            border: 1px solid #000;
            padding: 20px;
            text-align: center;
            font-weight: bold;
            font-size: 14px;
            min-height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .text-sample {
            margin: 10px 0;
          }
          .text-sample p {
            margin: 8px 0;
            line-height: 1.4;
          }
        </style>
      </head>
      <body>
    `;

    for (let i = 1; i <= numPages; i++) {
      content += `<div class="page">`;
      content += `
        <div class="header">
          <img src="https://customer-assets.emergentagent.com/job_053c424a-d7ee-4a13-a916-f7596c34862b/artifacts/qy7ga8qf_2025_Logo_127.png" alt="127 Logo" />
          <h1>Printer Kwaliteitstest</h1>
          <p><strong>Pagina ${i} van ${numPages}</strong></p>
        </div>
      `;

      // Random text test
      if (includeText) {
        content += `
          <div class="test-section">
            <h2>Tekstkwaliteitstest</h2>
            <div class="text-sample">
              <p style="font-size: 8px;"><strong>Extra Klein (8px):</strong> The quick brown fox jumps over the lazy dog. 0123456789</p>
              <p style="font-size: 10px;"><strong>Klein (10px):</strong> The quick brown fox jumps over the lazy dog. 0123456789</p>
              <p style="font-size: 12px;"><strong>Normaal (12px):</strong> The quick brown fox jumps over the lazy dog. 0123456789</p>
              <p style="font-size: 14px;"><strong>Medium (14px):</strong> The quick brown fox jumps over the lazy dog. 0123456789</p>
              <p style="font-size: 16px;"><strong>Groot (16px):</strong> The quick brown fox jumps over the lazy dog. 0123456789</p>
              <p style="font-size: 18px;"><strong>Extra Groot (18px):</strong> The quick brown fox jumps over the lazy dog. 0123456789</p>
            </div>
          </div>
        `;
      }

      // Color bars test
      if (includeColorBars) {
        content += `
          <div class="test-section">
            <h2>Kleurenkwaliteitstest</h2>
            <div class="color-label">Rood (RGB: 255, 0, 0)</div>
            <div class="color-bar" style="background: rgb(255, 0, 0);"></div>
            
            <div class="color-label">Groen (RGB: 0, 255, 0)</div>
            <div class="color-bar" style="background: rgb(0, 255, 0);"></div>
            
            <div class="color-label">Blauw (RGB: 0, 0, 255)</div>
            <div class="color-bar" style="background: rgb(0, 0, 255);"></div>
            
            <div class="color-label">Geel (RGB: 255, 255, 0)</div>
            <div class="color-bar" style="background: rgb(255, 255, 0);"></div>
            
            <div class="color-label">Magenta (RGB: 255, 0, 255)</div>
            <div class="color-bar" style="background: rgb(255, 0, 255);"></div>
            
            <div class="color-label">Cyaan (RGB: 0, 255, 255)</div>
            <div class="color-bar" style="background: rgb(0, 255, 255);"></div>
            
            <div class="color-label">Zwart naar Wit Gradiënt</div>
            <div class="color-bar" style="background: linear-gradient(to right, rgb(0,0,0), rgb(255,255,255));"></div>
          </div>
        `;
      }

      // Lines test
      if (includeLines) {
        content += `
          <div class="test-section">
            <h2>Lijn- en Rechtuidheidstest</h2>
            <div class="test-lines">
              <div class="line-label">Dunne lijn (1px)</div>
              <div class="line" style="height: 1px;"></div>
              
              <div class="line-label">Standaard lijn (2px)</div>
              <div class="line" style="height: 2px;"></div>
              
              <div class="line-label">Medium lijn (3px)</div>
              <div class="line" style="height: 3px;"></div>
              
              <div class="line-label">Dikke lijn (5px)</div>
              <div class="line" style="height: 5px;"></div>
              
              <div class="line-label">Extra dikke lijn (8px)</div>
              <div class="line" style="height: 8px;"></div>
            </div>
          </div>
        `;
      }

      // Alignment test
      if (includeAlignment) {
        content += `
          <div class="test-section">
            <h2>Uitlijnings- en Margetest</h2>
            <p style="font-size: 12px; margin-bottom: 10px;">Test de uitlijning en marges van uw printer. Alle cellen moeten gelijk zijn.</p>
            <div class="alignment-grid">
              <div class="grid-lines">
                <div class="grid-cell">LB</div>
                <div class="grid-cell">MB</div>
                <div class="grid-cell">MB</div>
                <div class="grid-cell">RB</div>
                <div class="grid-cell">LM</div>
                <div class="grid-cell">MM</div>
                <div class="grid-cell">MM</div>
                <div class="grid-cell">RM</div>
                <div class="grid-cell">LM</div>
                <div class="grid-cell">MM</div>
                <div class="grid-cell">MM</div>
                <div class="grid-cell">RM</div>
                <div class="grid-cell">LO</div>
                <div class="grid-cell">MO</div>
                <div class="grid-cell">MO</div>
                <div class="grid-cell">RO</div>
              </div>
            </div>
          </div>
        `;
      }

      content += `</div>`;
    }

    content += `
      </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#202124] flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="flex justify-center">
            <img 
              src="https://customer-assets.emergentagent.com/job_053c424a-d7ee-4a13-a916-f7596c34862b/artifacts/qy7ga8qf_2025_Logo_127.png" 
              alt="127 Logo" 
              className="w-48 h-auto brightness-110"
            />
          </div>
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[#e8eaed] mb-2">Printer Tester</h2>
            </div>
            <Progress value={loadingProgress} className="h-3 bg-[#303134]" />
            <p className="text-center text-sm text-[#9aa0a6]">{Math.round(loadingProgress)}%</p>
          </div>
        </div>
      </div>
    );
  }

  if (showInstructions) {
    return (
      <div 
        onClick={handleClick}
        className="min-h-screen bg-[#202124] flex items-center justify-center px-6"
        style={{ cursor: 'pointer' }}
      >
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 text-center">
          <div className="bg-[#303134] backdrop-blur-sm rounded-lg shadow-2xl p-8 max-w-md border border-[#5f6368]">
            <div className="mb-6 flex flex-col items-center">
              <img 
                src="https://customer-assets.emergentagent.com/job_053c424a-d7ee-4a13-a916-f7596c34862b/artifacts/qy7ga8qf_2025_Logo_127.png" 
                alt="127 Logo" 
                className="w-32 h-auto mb-4 brightness-110"
              />
              <h2 className="text-2xl font-bold text-[#e8eaed] mb-2">Printer Tester</h2>
              <p className="text-[#9aa0a6]">Klik om te starten</p>
              <p className="text-xs text-[#9aa0a6] mt-2">Build {BUILD_VERSION}</p>
            </div>
            <div className="bg-[#202124] border border-[#5f6368] rounded-lg p-4 text-left">
              <h3 className="font-semibold text-[#8ab4f8] mb-2">Instructies:</h3>
              <ul className="text-sm text-[#9aa0a6] space-y-1">
                <li>• Klik om de configuratie te openen</li>
                <li>• Kies het aantal pagina's (1-10)</li>
                <li>• Selecteer de gewenste testen</li>
                <li>• Klik op "Genereer en Print"</li>
                <li>• Controleer de afdruk op kwaliteit</li>
              </ul>
            </div>
            <div className="mt-6">
              <Link to="/" onClick={(e) => e.stopPropagation()}>
                <button className="w-full px-4 py-3 bg-[#8ab4f8] hover:bg-[#aac8f9] text-[#202124] rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Bekijk ook andere tools
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showConfig) {
    return (
      <div className="min-h-screen bg-[#202124] flex items-center justify-center px-6">
        <div className="w-full max-w-2xl">
          <div className="bg-[#303134] backdrop-blur-sm rounded-lg shadow-2xl p-8 border border-[#5f6368]">
            <div className="mb-6 flex flex-col items-center">
              <img 
                src="https://customer-assets.emergentagent.com/job_053c424a-d7ee-4a13-a916-f7596c34862b/artifacts/qy7ga8qf_2025_Logo_127.png" 
                alt="127 Logo" 
                className="w-32 h-auto mb-4 brightness-110"
              />
              <h2 className="text-2xl font-bold text-[#e8eaed] mb-2">Printer Tester</h2>
              <p className="text-[#9aa0a6]">Test uw printer op kwaliteit</p>
              <p className="text-xs text-[#9aa0a6] mt-2">Build {BUILD_VERSION}</p>
            </div>

            <div className="space-y-6">
              {/* Number of pages */}
              <div>
                <Label htmlFor="pages" className="text-[#e8eaed] mb-2 block">Aantal pagina's</Label>
                <Input
                  id="pages"
                  type="number"
                  min="1"
                  max="10"
                  value={numPages}
                  onChange={(e) => setNumPages(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="bg-[#202124] border-[#5f6368] text-[#e8eaed]"
                />
              </div>

              {/* Test options */}
              <div className="bg-[#202124] border border-[#5f6368] rounded-lg p-4">
                <h3 className="font-semibold text-[#8ab4f8] mb-3">Selecteer testen:</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="text"
                      checked={includeText}
                      onCheckedChange={setIncludeText}
                      className="border-[#5f6368]"
                    />
                    <label htmlFor="text" className="text-sm text-[#9aa0a6] cursor-pointer">
                      Teksttest (verschillende groottes)
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="colors"
                      checked={includeColorBars}
                      onCheckedChange={setIncludeColorBars}
                      className="border-[#5f6368]"
                    />
                    <label htmlFor="colors" className="text-sm text-[#9aa0a6] cursor-pointer">
                      Kleurenbalken (RGB, CMY, gradiënt)
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="lines"
                      checked={includeLines}
                      onCheckedChange={setIncludeLines}
                      className="border-[#5f6368]"
                    />
                    <label htmlFor="lines" className="text-sm text-[#9aa0a6] cursor-pointer">
                      Lijntest (rechtheid en dikte)
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="alignment"
                      checked={includeAlignment}
                      onCheckedChange={setIncludeAlignment}
                      className="border-[#5f6368]"
                    />
                    <label htmlFor="alignment" className="text-sm text-[#9aa0a6] cursor-pointer">
                      Uitlijningsraster (marges en centering)
                    </label>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-3">
                <Button 
                  onClick={handlePrint}
                  className="w-full bg-[#8ab4f8] hover:bg-[#aac8f9] text-[#202124] font-medium"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Genereer en Print
                </Button>
                
                <Link to="/" onClick={(e) => e.stopPropagation()}>
                  <Button 
                    variant="outline"
                    className="w-full border-[#5f6368] text-[#e8eaed] hover:bg-[#3c4043]"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Bekijk ook andere tools
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PrinterTest;