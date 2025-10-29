import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Progress } from './ui/progress';
import { ArrowLeft, Video, Mic, Download, Circle, Square } from 'lucide-react';
import { Button } from './ui/button';
import HalloweenDecoration from './HalloweenDecoration';
import FloatingFeedbackButton from './FloatingFeedbackButton';
import ChangelogModal from './ChangelogModal';
import { logPageVisit, logButtonClick, logAction, logError } from '../utils/analytics';

// Build version - Update this with each change
const BUILD_VERSION = '1.5.0';

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
  const [recordingTime, setRecordingTime] = useState(0);
  const [permissionError, setPermissionError] = useState('');
  
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

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
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

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

  const startRecording = () => {
    if (!stream) return;

    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      setRecordedChunks(chunksRef.current);
    };

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
    setRecordingTime(0);

    // Log recording start
    logAction('wea', 'Webcam & Audio Test', 'recording_started', {
      camera: devices.camera,
      microphone: devices.microphone
    });

    // Start timer
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Log recording stop
      logAction('wea', 'Webcam & Audio Test', 'recording_stopped', {
        duration_seconds: recordingTime
      });
    }
  };

  const downloadVideo = () => {
    if (recordedChunks.length === 0) return;
    
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recording-${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
    
    // Log video download
    logAction('wea', 'Webcam & Audio Test', 'video_downloaded', {
      file_size_kb: Math.round(blob.size / 1024),
      duration_seconds: recordingTime
    });
  };

  const downloadAudio = async () => {
    if (recordedChunks.length === 0) return;

    // Extract audio from video
    const videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(videoBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audio-${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
    
    // Log audio download
    logAction('wea', 'Webcam & Audio Test', 'audio_downloaded', {
      file_size_kb: Math.round(videoBlob.size / 1024),
      duration_seconds: recordingTime
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
    };
  }, [stream]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#202124] flex flex-col items-center justify-center p-8">
        <HalloweenDecoration />
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
              <h2 className="text-2xl font-bold text-[#e8eaed] mb-2">Webcam & Audio Test</h2>
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
              <h2 className="text-2xl font-bold text-[#e8eaed] mb-2">Webcam & Audio Test</h2>
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
                <li>• Klik om camera en microfoon te activeren</li>
                <li>• Geef toestemming voor camera en microfoon</li>
                <li>• Test uw beeld en geluid</li>
                <li>• Neem op en download de opname</li>
                <li>• Download video en audio apart of samen</li>
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

  if (showPermissionRequest) {
    return (
      <div className="min-h-screen bg-[#202124] flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="bg-[#303134] backdrop-blur-sm rounded-lg shadow-2xl p-8 border border-[#5f6368]">
            <div className="mb-6 flex flex-col items-center">
              <img 
                src="https://customer-assets.emergentagent.com/job_053c424a-d7ee-4a13-a916-f7596c34862b/artifacts/qy7ga8qf_2025_Logo_127.png" 
                alt="127 Logo" 
                className="w-32 h-auto mb-4 brightness-110"
              />
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

      {/* Video Display */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="relative">
          <video 
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="border-4 border-[#5f6368] rounded-lg shadow-2xl max-w-full"
            style={{ maxHeight: '70vh' }}
          />
          {isRecording && (
            <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full flex items-center gap-2 animate-pulse">
              <Circle className="w-3 h-3 fill-current" />
              <span className="text-sm font-medium">OPNAME</span>
            </div>
          )}
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

export default WebcamAudioTest;