import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CameraGalleryCapture } from '../camera-gallery-capture'

describe('CameraGalleryCapture', () => {
  const mockOnImageCapture = jest.fn()
  const mockOnError = jest.fn()
  let mockGetUserMedia: jest.Mock
  
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset the mock for each test
    mockGetUserMedia = jest.fn()
    navigator.mediaDevices.getUserMedia = mockGetUserMedia
    // Mock console.error to suppress expected error logs
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders initial selection mode with Camera and Gallery buttons', () => {
    render(<CameraGalleryCapture onImageCapture={mockOnImageCapture} />)
    
    expect(screen.getByRole('button', { name: /take photo with camera/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /select photo from gallery/i })).toBeInTheDocument()
    expect(screen.getByText(/ready to scan your menu/i)).toBeInTheDocument()
  })

  it('switches to camera mode when camera button is clicked', async () => {
    const mockStream = {
      getTracks: jest.fn(() => [{ stop: jest.fn() }]),
    } as unknown as MediaStream
    
    mockGetUserMedia.mockResolvedValue(mockStream)

    render(<CameraGalleryCapture onImageCapture={mockOnImageCapture} onError={mockOnError} />)
    
    const cameraButton = screen.getByRole('button', { name: /take photo with camera/i })
    fireEvent.click(cameraButton)

    await waitFor(() => {
      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
    })
  })

  it('handles camera permission denial and falls back to gallery', async () => {
    jest.useFakeTimers()
    
    mockGetUserMedia.mockRejectedValue(
      Object.assign(new Error('Permission denied'), { name: 'NotAllowedError' })
    )

    render(<CameraGalleryCapture onImageCapture={mockOnImageCapture} onError={mockOnError} />)
    
    const cameraButton = screen.getByRole('button', { name: /take photo with camera/i })
    fireEvent.click(cameraButton)

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(
        expect.stringContaining('Camera permission denied')
      )
    })

    // Fast-forward time to trigger gallery fallback with act
    await act(async () => {
      jest.advanceTimersByTime(2000)
    })

    await waitFor(() => {
      expect(screen.getByText(/select image from gallery/i)).toBeInTheDocument()
    })
    
    jest.useRealTimers()
  })

  it('handles no camera found error gracefully', async () => {
    jest.useFakeTimers()
    
    mockGetUserMedia.mockRejectedValue(
      Object.assign(new Error('No camera found'), { name: 'NotFoundError' })
    )

    render(<CameraGalleryCapture onImageCapture={mockOnImageCapture} onError={mockOnError} />)
    
    const cameraButton = screen.getByRole('button', { name: /take photo with camera/i })
    fireEvent.click(cameraButton)

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(
        expect.stringContaining('No camera found')
      )
    })
    
    jest.useRealTimers()
  })

  it('switches to gallery mode when gallery button is clicked', () => {
    render(<CameraGalleryCapture onImageCapture={mockOnImageCapture} />)
    
    const galleryButton = screen.getByRole('button', { name: /select photo from gallery/i })
    fireEvent.click(galleryButton)

    expect(screen.getByText(/select image from gallery/i)).toBeInTheDocument()
  })

  it('processes file selection from gallery correctly', async () => {
    render(<CameraGalleryCapture onImageCapture={mockOnImageCapture} />)

    const file = new File(['dummy image'], 'test.jpg', { type: 'image/jpeg' })
    
    // Mock FileReader
    interface MockFileReader {
      readAsDataURL: jest.Mock
      onload: ((event: { target: { result: string } }) => void) | null
    }
    
    const mockFileReader: MockFileReader = {
      readAsDataURL: jest.fn(function(this: MockFileReader) {
        setTimeout(() => {
          this.onload?.({ target: { result: 'data:image/jpeg;base64,testdata' } })
        }, 0)
      }),
      onload: null,
    }
    
    global.FileReader = jest.fn(() => mockFileReader) as unknown as typeof FileReader

    // Simulate file selection by triggering the gallery button which triggers file input click
    const galleryButton = screen.getByRole('button', { name: /select photo from gallery/i })
    fireEvent.click(galleryButton)

    // Wait for gallery mode to render
    await waitFor(() => {
      expect(screen.getByText(/select image from gallery/i)).toBeInTheDocument()
    })

    // Find and trigger the hidden file input
    const fileInputs = document.querySelectorAll('input[type="file"]')
    const fileInput = fileInputs[fileInputs.length - 1] as HTMLInputElement // Get the last one
    
    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(mockOnImageCapture).toHaveBeenCalledWith('data:image/jpeg;base64,testdata')
      })
    }
  })

  it('allows navigation back to selection mode from gallery', () => {
    render(<CameraGalleryCapture onImageCapture={mockOnImageCapture} />)
    
    const galleryButton = screen.getByRole('button', { name: /select photo from gallery/i })
    fireEvent.click(galleryButton)

    expect(screen.getByText(/select image from gallery/i)).toBeInTheDocument()

    const backButton = screen.getByRole('button', { name: /back to options/i })
    fireEvent.click(backButton)

    expect(screen.getByText(/ready to scan your menu/i)).toBeInTheDocument()
  })
})