import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Progress } from './ui/progress';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';

// Build version - Update this with each change
const BUILD_VERSION = '1.1.9';

const PrinterTest = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  
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
        <title>Printer Test - 127.be</title>
        <style>
          @media print {
            @page { margin: 0; }
            body { margin: 1cm; }
          }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
          }
          .page {
            page-break-after: always;
            min-height: 100vh;
            padding: 20px;
            box-sizing: border-box;
          }
          .page:last-child {
            page-break-after: auto;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }
          .color-bar {
            height: 50px;
            margin: 10px 0;
          }
          .test-lines {
            margin: 20px 0;
          }
          .line {
            height: 2px;
            background: #000;
            margin: 20px 0;
          }
          .alignment-grid {
            border: 2px solid #000;
            padding: 20px;
            margin: 20px 0;
          }
          .grid-lines {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
          }
          .grid-cell {
            border: 1px solid #000;
            padding: 10px;
            text-align: center;
          }
          .text-sample {
            margin: 20px 0;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
    `;

    for (let i = 1; i <= numPages; i++) {
      content += `<div class="page">`;
      content += `
        <div class="header">
          <h1>Printer Test - Pagina ${i}/${numPages}</h1>
          <p>127.be Printer Tester</p>
        </div>
      `;

      // Random text test
      if (includeText) {
        content += `
          <div class="text-sample">
            <h2>Teksttest</h2>
            <p><strong>Lorem ipsum dolor sit amet</strong>, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
            <p style="font-size: 8px;">Extra kleine tekst (8px) - The quick brown fox jumps over the lazy dog</p>
            <p style="font-size: 10px;">Kleine tekst (10px) - The quick brown fox jumps over the lazy dog</p>
            <p style="font-size: 12px;">Normale tekst (12px) - The quick brown fox jumps over the lazy dog</p>
            <p style="font-size: 14px;">Medium tekst (14px) - The quick brown fox jumps over the lazy dog</p>
            <p style="font-size: 16px;">Grote tekst (16px) - The quick brown fox jumps over the lazy dog</p>
          </div>
        `;
      }

      // Color bars test
      if (includeColorBars) {
        content += `
          <div style="margin: 20px 0;">
            <h2>Kleurentest</h2>
            <div class="color-bar" style="background: #FF0000;"></div>
            <div class="color-bar" style="background: #00FF00;"></div>
            <div class="color-bar" style="background: #0000FF;"></div>
            <div class="color-bar" style="background: #FFFF00;"></div>
            <div class="color-bar" style="background: #FF00FF;"></div>
            <div class="color-bar" style="background: #00FFFF;"></div>
            <div class="color-bar" style="background: linear-gradient(to right, #000000, #FFFFFF);"></div>
          </div>
        `;
      }

      // Lines test
      if (includeLines) {
        content += `
          <div class="test-lines">
            <h2>Lijntest (rechtheid)</h2>
            <div class="line"></div>
            <div class="line"></div>
            <div class="line"></div>
            <div class="line" style="height: 1px;"></div>
            <div class="line" style="height: 3px;"></div>
            <div class="line" style="height: 5px;"></div>
          </div>
        `;
      }

      // Alignment test
      if (includeAlignment) {
        content += `
          <div class="alignment-grid">
            <h2>Uitlijningstest</h2>
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
    }, 500);
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