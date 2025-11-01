import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Progress } from './ui/progress';
import { ArrowLeft, Zap, Play, Square } from 'lucide-react';
import { Button } from './ui/button';
import FloatingFeedbackButton from './FloatingFeedbackButton';
import ChangelogModal from './ChangelogModal';

// Build version - Update this with each change
const BUILD_VERSION = '1.7.0';

const BenchmarkTest = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [currentTest, setCurrentTest] = useState('');
  const [testProgress, setTestProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [fps, setFps] = useState(0);
  const [showChangelog, setShowChangelog] = useState(false);
  const canvasRef = useRef(null);
  const glRef = useRef(null);
  const animationFrameRef = useRef(null);
  const fpsCounterRef = useRef(0);
  const fpsLastUpdateRef = useRef(Date.now());

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
      setIsRunning(true);
    }
  };

  const startBenchmark = async () => {
    setIsTesting(true);
    setResults(null);
    setTestProgress(0);

    const testResults = {};

    // Test 1: Low complexity
    setCurrentTest('Lage complexiteit (1000 driehoeken)');
    await runTest(1000, (score) => {
      testResults.lowComplexity = score;
      setTestProgress(33);
    });

    // Test 2: Medium complexity
    setCurrentTest('Gemiddelde complexiteit (5000 driehoeken)');
    await runTest(5000, (score) => {
      testResults.mediumComplexity = score;
      setTestProgress(66);
    });

    // Test 3: High complexity
    setCurrentTest('Hoge complexiteit (10000 driehoeken)');
    await runTest(10000, (score) => {
      testResults.highComplexity = score;
      setTestProgress(100);
    });

    // Calculate final score
    const avgFps = (testResults.lowComplexity + testResults.mediumComplexity + testResults.highComplexity) / 3;
    const finalScore = Math.round(avgFps * 10);

    setResults({
      ...testResults,
      avgFps: Math.round(avgFps),
      score: finalScore,
      rating: getRating(finalScore),
    });

    setIsTesting(false);
    setCurrentTest('');
  };

  const runTest = (triangles, callback) => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        callback(0);
        resolve();
        return;
      }

      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        callback(0);
        resolve();
        return;
      }

      const startTime = Date.now();
      const testDuration = 3000; // 3 seconds per test
      let frameCount = 0;
      let rotation = 0;

      // Simple shader setup
      const vertexShaderSource = `
        attribute vec3 position;
        uniform float rotation;
        void main() {
          float c = cos(rotation);
          float s = sin(rotation);
          mat3 rotMatrix = mat3(
            c, -s, 0.0,
            s, c, 0.0,
            0.0, 0.0, 1.0
          );
          vec3 rotated = rotMatrix * position;
          gl_Position = vec4(rotated * 0.5, 1.0);
        }
      `;

      const fragmentShaderSource = `
        precision mediump float;
        void main() {
          gl_FragColor = vec4(0.2, 0.6, 1.0, 1.0);
        }
      `;

      const vertexShader = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vertexShader, vertexShaderSource);
      gl.compileShader(vertexShader);

      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fragmentShader, fragmentShaderSource);
      gl.compileShader(fragmentShader);

      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      gl.useProgram(program);

      // Generate vertices for triangles
      const vertices = [];
      const triangleCount = Math.floor(triangles / 3);
      for (let i = 0; i < triangleCount; i++) {
        const angle = (i / triangleCount) * Math.PI * 2;
        const radius = 0.5 + Math.random() * 0.5;
        vertices.push(
          Math.cos(angle) * radius, Math.sin(angle) * radius, 0,
          Math.cos(angle + 0.1) * radius, Math.sin(angle + 0.1) * radius, 0,
          0, 0, 0
        );
      }

      const vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

      const positionLocation = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

      const rotationLocation = gl.getUniformLocation(program, 'rotation');

      const animate = () => {
        const now = Date.now();
        const elapsed = now - startTime;

        if (elapsed >= testDuration) {
          const avgFps = Math.round((frameCount / testDuration) * 1000);
          callback(avgFps);
          resolve();
          return;
        }

        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        rotation += 0.01;
        gl.uniform1f(rotationLocation, rotation);
        gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 3);

        frameCount++;
        requestAnimationFrame(animate);
      };

      animate();
    });
  };

  const getRating = (score) => {
    if (score >= 5000) return { text: 'Uitstekend', color: '#00ff00' };
    if (score >= 3000) return { text: 'Goed', color: '#8ab4f8' };
    if (score >= 1500) return { text: 'Gemiddeld', color: '#ffff00' };
    if (score >= 800) return { text: 'Matig', color: '#ff8800' };
    return { text: 'Zwak', color: '#ff0000' };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#202124] flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="flex justify-center">
            <img 
              src="https://customer-assets.emergentagent.com/job_tool-metrics/artifacts/w5126i9x_127_2025_Official_Logo.png" 
              alt="127 Logo" 
              className="w-48 h-auto brightness-110"
             draggable="false"/>
          </div>
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[#e8eaed] mb-2">GPU Benchmark</h2>
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
                src="https://customer-assets.emergentagent.com/job_tool-metrics/artifacts/w5126i9x_127_2025_Official_Logo.png" 
                alt="127 Logo" 
                className="w-32 h-auto mb-4 brightness-110"
               draggable="false"/>
              <h2 className="text-2xl font-bold text-[#e8eaed] mb-2">GPU Benchmark</h2>
              <p className="text-[#9aa0a6]">Klik om te starten</p>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowChangelog(true);
                }}
                className="text-xs text-[#8ab4f8] hover:text-[#aac8f9] mt-2 cursor-pointer underline"
              >
                Build {BUILD_VERSION}
              </button>
            </div>
            <div className="bg-[#202124] border border-[#5f6368] rounded-lg p-4 text-left">
              <h3 className="font-semibold text-[#8ab4f8] mb-2">Instructies:</h3>
              <ul className="text-sm text-[#9aa0a6] space-y-1">
                <li>• Klik om de configuratie te openen</li>
                <li>• Klik op "Start Benchmark"</li>
                <li>• Test duurt ~10 seconden</li>
                <li>• Browser-based (minder accuraat dan native)</li>
                <li>• Sluit andere programma's voor beste resultaten</li>
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

  return (
    <div className="min-h-screen bg-[#202124] flex flex-col">
      {/* Control Panel */}
      <div className="bg-[#303134] border-b border-[#5f6368] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-[#8ab4f8]" />
              <div>
                <h1 className="text-2xl font-bold text-[#e8eaed]">GPU Benchmark</h1>
                <p className="text-sm text-[#9aa0a6]">Test de prestaties van uw GPU</p>
              </div>
            </div>
            <div className="flex gap-3">
              {!isTesting && (
                <Button 
                  onClick={startBenchmark}
                  className="bg-[#8ab4f8] hover:bg-[#aac8f9] text-[#202124]"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Benchmark
                </Button>
              )}
              <Link to="/">
                <Button 
                  variant="outline"
                  className="border-[#5f6368] text-[#e8eaed] hover:bg-[#3c4043]"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Terug
                </Button>
              </Link>
            </div>
          </div>

          {/* Test Progress */}
          {isTesting && (
            <div className="bg-[#202124] border border-[#5f6368] rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-[#e8eaed]">{currentTest}</p>
                <p className="text-sm text-[#8ab4f8]">{testProgress}%</p>
              </div>
              <Progress value={testProgress} className="h-2 bg-[#303134]" />
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="bg-[#202124] border border-[#5f6368] rounded-lg p-6 mt-4">
              <h3 className="text-lg font-semibold text-[#8ab4f8] mb-4">Benchmark Resultaten</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center p-4 bg-[#303134] rounded-lg">
                  <p className="text-[#9aa0a6] text-sm mb-1">Totale Score</p>
                  <p className="text-4xl font-bold text-[#e8eaed]">{results.score}</p>
                  <p className="text-sm mt-1" style={{ color: results.rating.color }}>{results.rating.text}</p>
                </div>
                <div className="text-center p-4 bg-[#303134] rounded-lg">
                  <p className="text-[#9aa0a6] text-sm mb-1">Gemiddelde FPS</p>
                  <p className="text-4xl font-bold text-[#e8eaed]">{results.avgFps}</p>
                  <p className="text-sm text-[#9aa0a6] mt-1">Frames per seconde</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="text-center p-3 bg-[#303134] rounded-lg">
                  <p className="text-[#9aa0a6] text-xs mb-1">Laag</p>
                  <p className="text-xl font-bold text-[#e8eaed]">{results.lowComplexity}</p>
                  <p className="text-xs text-[#9aa0a6]">FPS</p>
                </div>
                <div className="text-center p-3 bg-[#303134] rounded-lg">
                  <p className="text-[#9aa0a6] text-xs mb-1">Gemiddeld</p>
                  <p className="text-xl font-bold text-[#e8eaed]">{results.mediumComplexity}</p>
                  <p className="text-xs text-[#9aa0a6]">FPS</p>
                </div>
                <div className="text-center p-3 bg-[#303134] rounded-lg">
                  <p className="text-[#9aa0a6] text-xs mb-1">Hoog</p>
                  <p className="text-xl font-bold text-[#e8eaed]">{results.highComplexity}</p>
                  <p className="text-xs text-[#9aa0a6]">FPS</p>
                </div>
              </div>
              <p className="text-xs text-[#9aa0a6] mt-4 text-center">
                * Browser-based benchmark. Native software benchmarks zijn accurater.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Canvas for rendering */}
      <div className="flex-1 flex items-center justify-center p-8">
        <canvas 
          ref={canvasRef}
          width="800"
          height="600"
          className="border-2 border-[#5f6368] rounded-lg"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>
    </div>
    
    <FloatingFeedbackButton />
    <ChangelogModal 
      isOpen={showChangelog} 
      onClose={() => setShowChangelog(false)}
      currentVersion={BUILD_VERSION}
    />
  );
};

export default BenchmarkTest;