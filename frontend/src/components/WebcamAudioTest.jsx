import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Progress } from './ui/progress';
import { ArrowLeft, Video, Mic, Download, Circle, Square } from 'lucide-react';
import { Button } from './ui/button';
import AutumnDecoration from './AutumnDecoration';
import FloatingFeedbackButton from './FloatingFeedbackButton';
import ChangelogModal from './ChangelogModal';
import ToolStatusWrapper from './ToolStatusWrapper';
import { logPageVisit, logButtonClick, logAction, logError } from '../utils/analytics';

// Build version - Update this with each change
const BUILD_VERSION = '1.7.0';

const WebcamAudioTest = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showPermissionRequest, setShowPermissionRequest] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [stream, setStream] = useState(null);
  const [devices, setDevices] = useState({ camera: 'Unknown', microphone: 'Unknown' });
  const [isRecording, setIsRecording] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [recordedAudioChunks, setRecordedAudioChunks] = useState([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [permissionError, setPermissionError] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordedMimeType, setRecordedMimeType] = useState('video/webm');
  const [backgroundImage, setBackgroundImage] = useState('');
  
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const canvasRef = useRef(null);

  // Fetch random background image from Pexels
  useEffect(() => {
    const fetchBackgroundImage = async () => {
      try {
        // Random page between 1-20 for much more variety
        const randomPage = Math.floor(Math.random() * 20) + 1;
        const response = await fetch(
          `https://api.pexels.com/v1/search?query=abstract+technology+minimal&orientation=landscape&per_page=15&page=${randomPage}`,
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
        setTimeout(() => {
          setIsLoading(false);
          // Log page visit when loading completes
          logPageVisit('wea', 'Webcam & Audio Test');
        }, 200);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const handleClick = async () => {
    if (showInstructions) {
      logButtonClick('wea', 'Webcam & Audio Test', 'start_instructions');
      setShowInstructions(false);
      setShowPermissionRequest(true);
    }
  };

  const requestPermissions = async () => {
    setPermissionError('');
    logButtonClick('wea', 'Webcam & Audio Test', 'request_permissions');
    await startCamera();
  };

  const startCamera = async () => {
    try {
      console.log('Requesting camera and microphone access...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1920, height: 1080 }, 
        audio: true 
      });
      
      console.log('Media stream obtained:', mediaStream);
      console.log('Video tracks:', mediaStream.getVideoTracks());
      console.log('Audio tracks:', mediaStream.getAudioTracks());
      
      // Set stream - the useEffects will handle video and audio setup
      setStream(mediaStream);

      // Get device info
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevice = devices.find(d => d.kind === 'videoinput');
      const audioDevice = devices.find(d => d.kind === 'audioinput');
      
      setDevices({
        camera: videoDevice?.label || 'Default Camera',
        microphone: audioDevice?.label || 'Default Microphone',
      });

      // Log successful permission grant
      logAction('wea', 'Webcam & Audio Test', 'permission_granted', {
        camera: videoDevice?.label || 'Default Camera',
        microphone: audioDevice?.label || 'Default Microphone'
      });

      setShowPermissionRequest(false);
      setIsRunning(true);
    } catch (error) {
      console.error('Error accessing media devices:', error);
      
      let errorMessage = 'Kon geen toegang krijgen tot camera/microfoon.';
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Toestemming geweigerd. Geef toestemming voor camera en microfoon in uw browserinstellingen.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'Geen camera of microfoon gevonden. Controleer uw apparaten.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'Camera of microfoon wordt al gebruikt door een ander programma.';
      }
      
      // Log permission error as both action and error
      logAction('wea', 'Webcam & Audio Test', 'permission_denied', {
        error_name: error.name,
        error_message: errorMessage
      });
      
      logError('wea', 'Webcam & Audio Test', 'media_access_failed', {
        error_name: error.name,
        error_message: error.message,
        user_message: errorMessage
      });
      
      setPermissionError(errorMessage);
    }
  };

  const setupAudioVisualizer = (mediaStream) => {
    try {
      console.log('Setting up audio visualizer...');
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(mediaStream);
      
      analyser.fftSize = 256;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      console.log('Audio context created, starting visualization...');
      
      // Start visualization immediately since canvas is now ready
      visualizeAudio();
    } catch (error) {
      console.error('Error setting up audio visualizer:', error);
    }
  };

  const visualizeAudio = () => {
    if (!analyserRef.current) {
      console.error('Analyser not ready');
      return;
    }
    
    if (!canvasRef.current) {
      console.error('Canvas not available!');
      return;
    }
    
    console.log('Starting audio visualization');
    
    const canvas = canvasRef.current;
    const canvasContext = canvas.getContext('2d');
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      
      analyser.getByteFrequencyData(dataArray);
      
      // Clear canvas
      canvasContext.fillStyle = '#202124';
      canvasContext.fillRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;
      
      // Draw frequency bars
      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;
        
        // Create gradient from blue to green based on intensity
        const intensity = dataArray[i] / 255;
        if (intensity > 0.7) {
          canvasContext.fillStyle = '#34d399'; // Green
        } else if (intensity > 0.4) {
          canvasContext.fillStyle = '#8ab4f8'; // Blue
        } else {
          canvasContext.fillStyle = '#5f6368'; // Gray
        }
        
        canvasContext.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
      
      // Calculate average audio level
      const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
      setAudioLevel(Math.round((average / 255) * 100));
    };
    
    draw();
  };

  const startRecording = () => {
    if (!stream) return;

    // Clear previous chunks
    chunksRef.current = [];
    audioChunksRef.current = [];
    setRecordedChunks([]);
    setRecordedAudioChunks([]);
    
    // Check for supported MIME types - prefer MP4 if available
    let mimeType = 'video/webm;codecs=vp9';
    if (MediaRecorder.isTypeSupported('video/mp4')) {
      mimeType = 'video/mp4';
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
      mimeType = 'video/webm;codecs=h264';
    }
    
    console.log('Using MIME type:', mimeType);
    setRecordedMimeType(mimeType);
    
    // Create video recorder (video + audio)
    const mediaRecorder = new MediaRecorder(stream, { mimeType });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        console.log('Video chunk received:', event.data.size, 'bytes');
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      console.log('Video recording stopped, total chunks:', chunksRef.current.length);
      setRecordedChunks([...chunksRef.current]);
    };

    mediaRecorder.start(100);
    mediaRecorderRef.current = mediaRecorder;

    // Create audio-only recorder
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length > 0) {
      const audioStream = new MediaStream(audioTracks);
      const audioMimeType = mimeType.includes('mp4') ? 'audio/mp4' : 'audio/webm';
      
      const audioRecorder = new MediaRecorder(audioStream, { 
        mimeType: audioMimeType 
      });

      audioRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log('Audio chunk received:', event.data.size, 'bytes');
          audioChunksRef.current.push(event.data);
        }
      };

      audioRecorder.onstop = () => {
        console.log('Audio recording stopped, total chunks:', audioChunksRef.current.length);
        setRecordedAudioChunks([...audioChunksRef.current]);
      };

      audioRecorder.start(100);
      audioRecorderRef.current = audioRecorder;
    }

    setIsRecording(true);
    setRecordingTime(0);

    console.log('Recording started with', mimeType);

    // Log recording start
    logAction('wea', 'Webcam & Audio Test', 'recording_started', {
      camera: devices.camera,
      microphone: devices.microphone,
      mime_type: mimeType
    });

    // Start timer
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    console.log('Stop recording called');
    
    // Stop video recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      console.log('Stopping video recorder...');
      mediaRecorderRef.current.stop();
    }
    
    // Stop audio recorder
    if (audioRecorderRef.current && audioRecorderRef.current.state !== 'inactive') {
      console.log('Stopping audio recorder...');
      audioRecorderRef.current.stop();
    }
    
    setIsRecording(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    console.log('Recording stopped after', recordingTime, 'seconds');
    
    // Log recording stop
    logAction('wea', 'Webcam & Audio Test', 'recording_stopped', {
      duration_seconds: recordingTime,
      video_chunks_count: chunksRef.current.length,
      audio_chunks_count: audioChunksRef.current.length
    });
  };

  const downloadVideo = () => {
    if (recordedChunks.length === 0) return;
    
    // Determine file extension based on MIME type
    const extension = recordedMimeType.includes('mp4') ? 'mp4' : 'webm';
    
    const blob = new Blob(recordedChunks, { type: recordedMimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `video-${Date.now()}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log(`Downloaded video as ${extension}, size: ${Math.round(blob.size / 1024)}KB`);
    
    // Log video download
    logAction('wea', 'Webcam & Audio Test', 'video_downloaded', {
      file_size_kb: Math.round(blob.size / 1024),
      duration_seconds: recordingTime,
      format: extension
    });
  };

  const downloadAudio = () => {
    if (recordedAudioChunks.length === 0) {
      console.log('No audio chunks available');
      return;
    }

    // Use the audio-only recording chunks
    const audioMimeType = recordedMimeType.includes('mp4') ? 'audio/mp4' : 'audio/webm';
    
    const blob = new Blob(recordedAudioChunks, { type: audioMimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audio-${Date.now()}.mp3`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log(`Downloaded audio-only as mp3, size: ${Math.round(blob.size / 1024)}KB`);
    
    // Log audio download
    logAction('wea', 'Webcam & Audio Test', 'audio_downloaded', {
      file_size_kb: Math.round(blob.size / 1024),
      duration_seconds: recordingTime,
      format: 'mp3',
      audio_only: true
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stream]);

  // Setup video when stream and videoRef are both ready
  useEffect(() => {
    if (stream && videoRef.current && isRunning) {
      console.log('Setting up video with stream...');
      videoRef.current.srcObject = stream;
      videoRef.current.play().then(() => {
        console.log('Video started playing successfully');
      }).catch(err => {
        console.error('Error playing video:', err);
      });
    }
  }, [stream, isRunning]);

  // Setup audio visualizer when stream, canvas, and isRunning are ready
  useEffect(() => {
    if (stream && canvasRef.current && isRunning && !audioContextRef.current) {
      console.log('Setting up audio visualizer with stream...');
      setupAudioVisualizer(stream);
    }
  }, [stream, isRunning]);

  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Pexels Background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {backgroundImage ? (
            <div
              className="w-full h-full bg-cover bg-center"
              style={{
                backgroundImage: `url(${backgroundImage})`,
                filter: 'blur(1.5px) brightness(0.7)',
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
                filter: 'blur(1.5px) brightness(0.7)',
                transform: 'scale(1.05)'
              }}
            />
          )}
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
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
                <h2 className="text-3xl font-bold text-white mb-2">Webcam & Audio Test</h2>
              </div>
              <Progress value={loadingProgress} className="h-3" />
              <p className="text-center text-lg text-white text-opacity-80">{Math.round(loadingProgress)}%</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showInstructions) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Pexels Background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {backgroundImage ? (
            <div
              className="w-full h-full bg-cover bg-center"
              style={{
                backgroundImage: `url(${backgroundImage})`,
                filter: 'blur(1.5px) brightness(0.7)',
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
                filter: 'blur(1.5px) brightness(0.7)',
                transform: 'scale(1.05)'
              }}
            />
          )}
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
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
                <h2 className="text-3xl font-bold text-white mb-2">Webcam & Audio Test</h2>
                <p className="text-white text-opacity-70">Klik om te starten</p>
              </div>
              
              <div 
                className="p-6 rounded-2xl text-left"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                <h3 className="font-semibold text-white text-lg mb-3">Instructies:</h3>
                <ul className="text-white text-opacity-80 space-y-2">
                  <li>• Klik om camera en microfoon te activeren</li>
                  <li>• Geef toestemming voor camera en microfoon</li>
                  <li>• Test uw beeld en geluid</li>
                  <li>• Neem op en download de opname</li>
                  <li>• Download video en audio apart of samen</li>
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
                  Bekijk ook andere tools
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
    );
  }

  if (showPermissionRequest) {
    return (
      <div className="min-h-screen bg-[#202124] flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="bg-[#303134] backdrop-blur-sm rounded-lg shadow-2xl p-8 border border-[#5f6368]">
            <div className="mb-6 flex flex-col items-center">
              <img 
                src="https://customer-assets.emergentagent.com/job_tool-metrics/artifacts/w5126i9x_127_2025_Official_Logo.png" 
                alt="127 Logo" 
                className="w-32 h-auto mb-4 brightness-110"
               draggable="false"/>
              <h2 className="text-2xl font-bold text-[#e8eaed] mb-2">Toestemming Vereist</h2>
              <p className="text-[#9aa0a6] text-center">We hebben toegang nodig tot uw camera en microfoon</p>
            </div>

            <div className="bg-[#202124] border border-[#5f6368] rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3 mb-3">
                <Video className="w-5 h-5 text-[#8ab4f8] mt-0.5" />
                <div>
                  <p className="text-[#e8eaed] font-medium text-sm">Camera</p>
                  <p className="text-[#9aa0a6] text-xs">Voor video preview en opname</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mic className="w-5 h-5 text-[#8ab4f8] mt-0.5" />
                <div>
                  <p className="text-[#e8eaed] font-medium text-sm">Microfoon</p>
                  <p className="text-[#9aa0a6] text-xs">Voor audio opname</p>
                </div>
              </div>
            </div>

            {permissionError && (
              <div className="bg-red-900/30 border border-red-600 rounded-lg p-4 mb-4">
                <p className="text-red-300 text-sm">{permissionError}</p>
              </div>
            )}

            <div className="space-y-3">
              <Button 
                onClick={requestPermissions}
                className="w-full bg-[#8ab4f8] hover:bg-[#aac8f9] text-[#202124] font-medium"
              >
                Geef Toestemming
              </Button>
              <Link to="/" onClick={(e) => e.stopPropagation()}>
                <Button 
                  variant="outline"
                  className="w-full border-[#5f6368] text-[#e8eaed] hover:bg-[#3c4043]"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Annuleren
                </Button>
              </Link>
            </div>

            <p className="text-xs text-[#9aa0a6] mt-4 text-center">
              Uw privacy is belangrijk. Deze tool bewaart geen opnames op onze servers.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Only show main interface when running
  if (!isRunning) {
    return null;
  }

  return (
    <>
    <div className="min-h-screen bg-[#202124] flex flex-col">
      {/* Control Panel */}
      <div className="bg-[#303134] border-b border-[#5f6368] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Video className="w-8 h-8 text-[#8ab4f8]" />
              <div>
                <h1 className="text-2xl font-bold text-[#e8eaed]">Webcam & Audio Test</h1>
                <p className="text-sm text-[#9aa0a6]">Test uw camera en microfoon</p>
                <button 
                  onClick={() => setShowChangelog(true)}
                  className="text-xs text-[#8ab4f8] hover:text-[#aac8f9] cursor-pointer underline"
                >
                  Build {BUILD_VERSION}
                </button>
              </div>
            </div>
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

          {/* Device Info */}
          <div className="bg-[#202124] border border-[#5f6368] rounded-lg p-4 mb-4">
            <h3 className="text-sm font-semibold text-[#8ab4f8] mb-3">Apparaat Informatie</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Video className="w-5 h-5 text-[#8ab4f8]" />
                <div>
                  <p className="text-[#9aa0a6] text-xs">Camera</p>
                  <p className="text-[#e8eaed] text-sm font-medium">{devices.camera}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mic className="w-5 h-5 text-[#8ab4f8]" />
                <div>
                  <p className="text-[#9aa0a6] text-xs">Microfoon</p>
                  <p className="text-[#e8eaed] text-sm font-medium">{devices.microphone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recording Controls */}
          <div className="flex items-center gap-3">
            {!isRecording ? (
              <Button 
                onClick={startRecording}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Circle className="w-4 h-4 mr-2 fill-current" />
                Start Opname
              </Button>
            ) : (
              <>
                <Button 
                  onClick={stopRecording}
                  className="bg-gray-600 hover:bg-gray-700 text-white"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Stop Opname
                </Button>
                <div className="bg-red-600 text-white px-4 py-2 rounded-lg font-mono">
                  {formatTime(recordingTime)}
                </div>
              </>
            )}

            {recordedChunks.length > 0 && !isRecording && (
              <>
                <Button 
                  onClick={downloadVideo}
                  className="bg-[#8ab4f8] hover:bg-[#aac8f9] text-[#202124]"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Video
                </Button>
                <Button 
                  onClick={downloadAudio}
                  variant="outline"
                  className="border-[#5f6368] text-[#e8eaed] hover:bg-[#3c4043]"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Audio
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Video and Audio Display */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
        {/* Video Display - Large */}
        <div className="relative w-full max-w-4xl">
          <video 
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full border-4 border-[#5f6368] rounded-lg shadow-2xl bg-[#000]"
            style={{ aspectRatio: '16/9' }}
          />
          {isRecording && (
            <div className="absolute top-4 left-4 bg-red-600 text-white px-4 py-2 rounded-full flex items-center gap-2 animate-pulse">
              <Circle className="w-4 h-4 fill-current" />
              <span className="font-medium">OPNAME {formatTime(recordingTime)}</span>
            </div>
          )}
        </div>

        {/* Audio Visualizer */}
        <div className="w-full max-w-4xl">
          <div className="bg-[#303134] p-6 rounded-lg border border-[#5f6368]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-[#8ab4f8]" />
                <span className="text-[#e8eaed] font-medium">Audio Niveau</span>
              </div>
              <span className="text-[#8ab4f8] font-mono text-lg">{audioLevel}%</span>
            </div>
            <canvas 
              ref={canvasRef}
              width={800}
              height={100}
              className="w-full h-24 rounded border border-[#5f6368]"
            />
          </div>
        </div>
      </div>
    </div>
    
    <FloatingFeedbackButton />
    <ChangelogModal 
      isOpen={showChangelog} 
      onClose={() => setShowChangelog(false)}
      currentVersion={BUILD_VERSION}
    />
    </>
  );
};

export default function WrappedWebcamAudioTest() {
  return (
    <ToolStatusWrapper toolId="wea">
      <WebcamAudioTest />
    </ToolStatusWrapper>
  );
}