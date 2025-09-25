'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Camera, Upload, Square, RotateCcw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CameraGalleryCaptureProps {
  onImageCapture: (imageData: string) => void
  onError?: (error: string) => void
}

type CaptureMode = 'selection' | 'camera' | 'gallery'

export function CameraGalleryCapture({ onImageCapture, onError }: CameraGalleryCaptureProps) {
  const [mode, setMode] = useState<CaptureMode>('selection')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Stop video tracks and cleanup
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }, [stream])

  // Trigger file input
  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // Handle gallery mode selection
  const handleGalleryMode = useCallback(() => {
    setMode('gallery')
    triggerFileInput()
  }, [triggerFileInput])

  // Initialize camera - with enhanced mobile support
  const initializeCamera = useCallback(async () => {
    try {
      setPermissionError(null)
      
      // Check if mediaDevices is available (important for older browsers)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser')
      }
      
      // Try different camera configurations for better mobile support
      let mediaStream: MediaStream | null = null
      
      // First try: Environment camera (back camera)
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { exact: 'environment' },
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 }
          }
        })
      } catch (envError) {
        console.warn('Environment camera not available, trying user camera:', envError)
        
        // Second try: User camera (front camera) or any available camera
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'user',
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 }
            }
          })
        } catch (userError) {
          console.warn('User camera not available, trying any camera:', userError)
          
          // Third try: Any available camera
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 }
            }
          })
        }
      }
      
      if (!mediaStream) {
        throw new Error('No camera stream available')
      }
      
      setStream(mediaStream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      console.error('Camera access error:', error)
      
      let errorMessage = 'Camera access denied or not available'
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera permission denied. Please allow camera access in your browser settings and try again, or use gallery instead.'
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera found on this device. Please use gallery instead.'
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Camera is already in use by another application. Please close other camera apps and try again, or use gallery instead.'
        } else if (error.name === 'OverconstrainedError') {
          errorMessage = 'Camera settings not supported. Please use gallery instead.'
        } else if (error.message.includes('not supported')) {
          errorMessage = 'Camera not supported in this browser. Please use gallery instead.'
        }
      }
      
      setPermissionError(errorMessage)
      onError?.(errorMessage)
      
      // Fallback to gallery on error
      setTimeout(() => {
        setMode('gallery')
      }, 2000)
    }
  }, [onError])

  // Handle camera mode selection
  const handleCameraMode = useCallback(() => {
    setMode('camera')
    initializeCamera()
  }, [initializeCamera])

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result
        if (typeof result === 'string') {
          onImageCapture(result)
        }
      }
      reader.readAsDataURL(file)
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [onImageCapture])

  // Capture photo from video stream
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return
    
    setIsCapturing(true)
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    
    if (!context) return
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // Convert to base64
    const imageData = canvas.toDataURL('image/jpeg', 0.9)
    
    // Stop camera after capture
    stopCamera()
    
    onImageCapture(imageData)
    setIsCapturing(false)
  }, [onImageCapture, stopCamera])

  // Reset to selection mode
  const resetToSelection = useCallback(() => {
    stopCamera()
    setMode('selection')
    setPermissionError(null)
    setIsCapturing(false)
  }, [stopCamera])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  // Selection mode - show toggle buttons
  if (mode === 'selection') {
    return (
      <div className="text-center py-12">
        <Camera className="w-24 h-24 mx-auto mb-6 text-gray-400" />
        <h3 className="text-xl font-semibold mb-4">Ready to Scan Your Menu</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          Take a clear photo of the restaurant menu or select an existing image from your gallery.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            onClick={handleCameraMode}
            className="w-full sm:w-auto"
            aria-label="Take photo with camera"
          >
            <Camera className="w-5 h-5 mr-2" />
            Camera
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            onClick={handleGalleryMode}
            className="w-full sm:w-auto"
            aria-label="Select photo from gallery"
          >
            <Upload className="w-5 h-5 mr-2" />
            Gallery
          </Button>
        </div>
      </div>
    )
  }

  // Camera mode - show live video feed with capture UI
  if (mode === 'camera') {
    if (permissionError) {
      return (
        <div className="text-center py-12">
          <X className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h3 className="text-xl font-semibold mb-4 text-red-600">Camera Access Error</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            {permissionError}
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Redirecting to gallery in a moment...
          </p>
          <Button 
            variant="outline"
            onClick={resetToSelection}
            className="mr-4"
          >
            Back to Options
          </Button>
          <Button onClick={triggerFileInput}>
            <Upload className="w-4 h-4 mr-2" />
            Open Gallery
          </Button>
        </div>
      )
    }

    return (
      <div className="relative">
        {/* Video Container */}
        <div className="relative bg-black rounded-lg overflow-hidden mb-4">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-auto max-h-96 object-cover"
            aria-label="Camera preview"
          />
          
          {/* Capture Overlay */}
          <div className="absolute inset-0 flex items-end justify-center p-6 bg-gradient-to-t from-black/50 to-transparent">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={resetToSelection}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                aria-label="Back to options"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              
              <Button
                size="lg"
                onClick={capturePhoto}
                disabled={!stream || isCapturing}
                className="bg-white text-black hover:bg-gray-100 rounded-full w-16 h-16 p-0"
                aria-label="Capture photo"
              >
                <Square className="w-8 h-8 fill-current" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  stopCamera()
                  setMode('gallery')
                  triggerFileInput()
                }}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                aria-label="Switch to gallery"
              >
                <Upload className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Position the menu in the viewfinder and tap the capture button
        </p>
        
        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    )
  }

  // Gallery mode - handled by file input, return to selection if no file chosen
  if (mode === 'gallery') {
    return (
      <div className="text-center py-12">
        <Upload className="w-24 h-24 mx-auto mb-6 text-gray-400" />
        <h3 className="text-xl font-semibold mb-4">Select Image from Gallery</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          Choose a clear photo of the restaurant menu from your device.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg"
            onClick={triggerFileInput}
            className="w-full sm:w-auto"
            aria-label="Select image file"
          >
            <Upload className="w-5 h-5 mr-2" />
            Choose File
          </Button>
          <Button 
            variant="outline"
            size="lg"
            onClick={resetToSelection}
            className="w-full sm:w-auto"
            aria-label="Back to options"
          >
            Back
          </Button>
        </div>
        {/* Hidden file input - always rendered for gallery mode */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="File input for gallery selection"
        />
      </div>
    )
  }

  // Hidden file input - fallback for any other mode
  return (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      capture="environment"
      onChange={handleFileSelect}
      className="hidden"
      aria-label="File input for gallery selection"
    />
  )
}