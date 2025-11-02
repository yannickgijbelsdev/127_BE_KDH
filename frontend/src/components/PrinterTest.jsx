import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Progress } from './ui/progress';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import AutumnDecoration from './AutumnDecoration';
import FloatingFeedbackButton from './FloatingFeedbackButton';
import ChangelogModal from './ChangelogModal';
import ToolStatusWrapper from './ToolStatusWrapper';
import LanguageToggle from './LanguageToggle';
import { useLanguage } from '../contexts/LanguageContext';
import { logPageVisit, logAction, logButtonClick } from '../utils/analytics';

// Build version - Update this with each change
const BUILD_VERSION = '1.8.3';

const PrinterTest = () => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState('');
  
  // Test options
  const [numPages, setNumPages] = useState(1);
  const [includeText, setIncludeText] = useState(false);
  const [includeColorBars, setIncludeColorBars] = useState(false);
  const [includeLines, setIncludeLines] = useState(false);
  const [includeAlignment, setIncludeAlignment] = useState(false);

  // Fetch random background image from Pexels
  useEffect(() => {
    const fetchBackgroundImage = async () => {
      try {
        // Random page between 1-10 for variety - tech/working/networking theme
        const randomPage = Math.floor(Math.random() * 10) + 1;
        const response = await fetch(
          `https://api.pexels.com/v1/search?query=technology+data+circuit+board+server+network+digital&orientation=landscape&per_page=15&page=${randomPage}`,
          {
            headers: {
              Authorization: 'SBv6ZOHirhcApz4iLkxYd7c2RDXBWJPKbc8AWDku666r3zU6Tdc2sOih'
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.photos && data.photos.length > 0) {
            const randomPhoto = data.photos[Math.floor(Math.random() * data.photos.length)];
            setBackgroundImage(randomPhoto.src.large);
          }
        }
      } catch (error) {
        console.error('Error fetching Pexels image:', error);
        setBackgroundImage('');
      }
    };

    fetchBackgroundImage();
  }, []);

  // Log page visit
  useEffect(() => {
    logPageVisit('printer', 'Printer Tester');
  }, []);

  // Loading animation (1 second)
  useEffect(() => {
    const duration = 1000;
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
      logButtonClick('printer', 'Printer Tester', 'start_config');
      setShowInstructions(false);
      setShowConfig(true);
    }
  };

  const handlePrint = () => {
    if (!includeText && !includeColorBars && !includeLines && !includeAlignment) {
      alert(t('Selecteer minimaal één testoptie', 'Select at least one test option'));
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
          <img src="https://customer-assets.emergentagent.com/job_tool-metrics/artifacts/w5126i9x_127_2025_Official_Logo.png" alt="127 Logo"  draggable="false"/>
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
      logAction('printer', 'Printer Tester', 'print_started', {
        num_pages: numPages,
        include_random_text: includeText,
        include_color_bars: includeColorBars,
        include_lines: includeLines,
        include_alignment: includeAlignment
      });
      printWindow.print();
    }, 1000);
  };

  if (isLoading) {
    return (
      <>
      <div className="min-h-screen relative overflow-hidden">
        {/* Pexels Background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {backgroundImage ? (
            <div
              className="w-full h-full bg-cover bg-center"
              style={{
                backgroundImage: `url(${backgroundImage})`,
                filter: 'blur(1.5px) brightness(0.95)',
                transform: 'scale(1.05)',
                width: '105%',
                height: '105%',
                marginLeft: '-2.5%',
                marginTop: '-2.5%'
              }}
            />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                filter: 'blur(1.5px) brightness(0.95)',
                transform: 'scale(1.05)'
              }}
            />
          )}
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        </div>

        {/* 127 Logo Top Left */}
        <div className="absolute top-8 left-8 z-30">
          <Link to="/">
            <img 
              src="https://customer-assets.emergentagent.com/job_tool-metrics/artifacts/w5126i9x_127_2025_Official_Logo.png" 
              alt="127 Logo" 
              className="h-12 w-auto brightness-110 cursor-pointer hover:brightness-125 transition-all"
              draggable="false"
            />
          </Link>
        </div>

        {/* Loading Content */}
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div 
            className="w-full max-w-md p-12 rounded-3xl"
            style={{
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)'
            }}
          >
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">Printer Tester</h2>
              </div>
              <Progress value={loadingProgress} className="h-3" />
              <p className="text-center text-lg text-white text-opacity-80">{Math.round(loadingProgress)}%</p>
              <div className="text-center">
                <button
                  onClick={() => setShowChangelog(true)}
                  className="text-xs cursor-pointer hover:opacity-100 transition-opacity"
                  style={{
                    color: '#8fa8ff',
                    opacity: 0.8
                  }}
                >
                  Build {BUILD_VERSION}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Changelog Modal */}
      <ChangelogModal 
        isOpen={showChangelog} 
        onClose={() => setShowChangelog(false)}
        currentVersion={BUILD_VERSION}
      />
      </>
    );
  }

  if (showInstructions) {
    return (
      <>
      <div className="min-h-screen relative overflow-hidden">
        {/* Pexels Background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {backgroundImage ? (
            <div
              className="w-full h-full bg-cover bg-center"
              style={{
                backgroundImage: `url(${backgroundImage})`,
                filter: 'blur(1.5px) brightness(0.95)',
                transform: 'scale(1.05)',
                width: '105%',
                height: '105%',
                marginLeft: '-2.5%',
                marginTop: '-2.5%'
              }}
            />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                filter: 'blur(1.5px) brightness(0.95)',
                transform: 'scale(1.05)'
              }}
            />
          )}
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        </div>

        {/* 127 Logo Top Left */}
        <div className="absolute top-8 left-8 z-30">
          <Link to="/">
            <img 
              src="https://customer-assets.emergentagent.com/job_tool-metrics/artifacts/w5126i9x_127_2025_Official_Logo.png" 
              alt="127 Logo" 
              className="h-12 w-auto brightness-110 cursor-pointer hover:brightness-125 transition-all"
              draggable="false"
            />
          </Link>
        </div>

        {/* Instructions Content */}
        <div 
          onClick={handleClick}
          className="relative z-10 min-h-screen flex items-center justify-center p-4"
          style={{ cursor: 'pointer' }}
        >
          <div 
            className="w-full max-w-lg p-12 rounded-3xl"
            style={{
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)'
            }}
          >
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">Printer Tester</h2>
                <p className="text-white text-opacity-70">{t('Klik om te starten', 'Click to start')}</p>
              </div>
              
              <div 
                className="p-6 rounded-2xl text-left"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                <h3 className="font-semibold text-white text-lg mb-3">{t('Instructies:', 'Instructions:')}</h3>
                <ul className="text-white text-opacity-80 space-y-2">
                  <li>• {t('Klik om de configuratie te openen', 'Click to open configuration')}</li>
                  <li>• {t('Kies het aantal pagina\'s (1-10)', 'Choose number of pages (1-10)')}</li>
                  <li>• {t('Selecteer de gewenste testen', 'Select desired tests')}</li>
                  <li>• {t('Klik op "Genereer en Print"', 'Click "Generate and Print"')}</li>
                  <li>• {t('Controleer de afdruk op kwaliteit', 'Check print quality')}</li>
                </ul>
              </div>

              <Link to="/" onClick={(e) => e.stopPropagation()}>
                <button 
                  className="w-full px-6 py-4 rounded-full font-medium transition-all flex items-center justify-center gap-2"
                  style={{
                    background: 'rgba(150, 180, 255, 0.25)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: '1px solid rgba(150, 180, 255, 0.15)',
                    color: '#cfe1ff'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(150, 180, 255, 0.35)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(150, 180, 255, 0.25)';
                  }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('Bekijk ook andere tools', 'Check out other tools')}
                </button>
              </Link>

              <div className="text-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowChangelog(true);
                  }}
                  className="text-xs cursor-pointer hover:opacity-100 transition-opacity"
                  style={{
                    color: '#8fa8ff',
                    opacity: 0.8
                  }}
                >
                  Build {BUILD_VERSION}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Changelog Modal */}
      <ChangelogModal 
        isOpen={showChangelog} 
        onClose={() => setShowChangelog(false)}
        currentVersion={BUILD_VERSION}
      />
    );
  }

  if (showConfig) {
    return (
      <div className="min-h-screen bg-[#202124] py-8 px-4">
        {/* 127 Logo Top Left */}
        <div className="absolute top-8 left-8 z-30">
          <Link to="/">
            <img 
              src="https://customer-assets.emergentagent.com/job_tool-metrics/artifacts/w5126i9x_127_2025_Official_Logo.png" 
              alt="127 Logo" 
              className="h-12 w-auto brightness-110 cursor-pointer hover:brightness-125 transition-all"
              draggable="false"
            />
          </Link>
        </div>

        {/* Config Content */}
        <div className="flex items-center justify-center min-h-screen">
          <div 
            className="w-full max-w-2xl p-12 rounded-3xl"
            style={{
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">Printer Tester</h2>
                <p className="text-white text-opacity-70">{t('Test uw printer op kwaliteit', 'Test your printer quality')}</p>
              </div>

              {/* Number of pages */}
              <div>
                <Label htmlFor="pages" className="text-white mb-2 block text-lg">{t('Aantal pagina\'s', 'Number of pages')}</Label>
                <Input
                  id="pages"
                  type="number"
                  min="1"
                  max="10"
                  value={numPages}
                  onChange={(e) => setNumPages(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    fontSize: '16px',
                    fontWeight: '500'
                  }}
                />
              </div>

              {/* Test options */}
              <div 
                className="p-6 rounded-2xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                <h3 className="font-semibold text-white text-lg mb-4">{t('Selecteer testen:', 'Select tests:')}</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Checkbox 
                      id="text"
                      checked={includeText}
                      onCheckedChange={(checked) => {
                        setIncludeText(checked);
                        logAction('printer', 'Printer Tester', 'option_toggled', {
                          option: 'text_test',
                          enabled: checked
                        });
                      }}
                      className="border-white border-opacity-30"
                    />
                    <label htmlFor="text" className="text-white text-opacity-80 cursor-pointer">
                      {t('Teksttest (verschillende groottes)', 'Text test (different sizes)')}
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox 
                      id="colors"
                      checked={includeColorBars}
                      onCheckedChange={(checked) => {
                        setIncludeColorBars(checked);
                        logAction('printer', 'Printer Tester', 'option_toggled', {
                          option: 'color_bars',
                          enabled: checked
                        });
                      }}
                      className="border-white border-opacity-30"
                    />
                    <label htmlFor="colors" className="text-white text-opacity-80 cursor-pointer">
                      {t('Kleurenbalken (RGB, CMY, gradiënt)', 'Color bars (RGB, CMY, gradient)')}
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox 
                      id="lines"
                      checked={includeLines}
                      onCheckedChange={(checked) => {
                        setIncludeLines(checked);
                        logAction('printer', 'Printer Tester', 'option_toggled', {
                          option: 'line_test',
                          enabled: checked
                        });
                      }}
                      className="border-white border-opacity-30"
                    />
                    <label htmlFor="lines" className="text-white text-opacity-80 cursor-pointer">
                      {t('Lijntest (rechtheid en dikte)', 'Line test (straightness and thickness)')}
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox 
                      id="alignment"
                      checked={includeAlignment}
                      onCheckedChange={(checked) => {
                        setIncludeAlignment(checked);
                        logAction('printer', 'Printer Tester', 'option_toggled', {
                          option: 'alignment_grid',
                          enabled: checked
                        });
                      }}
                      className="border-white border-opacity-30"
                    />
                    <label htmlFor="alignment" className="text-white text-opacity-80 cursor-pointer">
                      {t('Uitlijningsraster (marges en centering)', 'Alignment grid (margins and centering)')}
                    </label>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-3">
                <button 
                  onClick={handlePrint}
                  className="w-full px-6 py-4 rounded-full font-medium transition-all flex items-center justify-center gap-2"
                  style={{
                    background: 'rgba(150, 180, 255, 0.25)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: '1px solid rgba(150, 180, 255, 0.15)',
                    color: '#cfe1ff'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(150, 180, 255, 0.35)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(150, 180, 255, 0.25)';
                  }}
                >
                  <Printer className="w-4 h-4" />
                  {t('Genereer en Print', 'Generate and Print')}
                </button>
                
                <Link to="/">
                  <button 
                    className="w-full px-6 py-4 rounded-full font-medium transition-all flex items-center justify-center gap-2"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      color: '#ffffff'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {t('Bekijk ook andere tools', 'Check out other tools')}
                  </button>
                </Link>
              </div>

              <div className="text-center">
                <button
                  onClick={() => setShowChangelog(true)}
                  className="text-xs cursor-pointer hover:opacity-100 transition-opacity"
                  style={{
                    color: '#8fa8ff',
                    opacity: 0.8
                  }}
                >
                  Build {BUILD_VERSION}
                </button>
              </div>
            </div>
          </div>
          
          {/* Changelog Modal */}
          <ChangelogModal 
            isOpen={showChangelog} 
            onClose={() => setShowChangelog(false)}
            currentVersion={BUILD_VERSION}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <FloatingFeedbackButton />
      <LanguageToggle />
      <ChangelogModal 
        isOpen={showChangelog} 
        onClose={() => setShowChangelog(false)}
        currentVersion={BUILD_VERSION}
      />
    </>
  );
};

export default function WrappedPrinterTest() {
  return (
    <ToolStatusWrapper toolId="printer">
      <PrinterTest />
    </ToolStatusWrapper>
  );
}