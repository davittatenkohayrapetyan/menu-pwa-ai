// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock navigator.mediaDevices for camera tests
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn(),
  },
  writable: true,
})

// Mock FileReader
global.FileReader = class FileReader {
  readAsDataURL() {
    this.onload?.({ target: { result: 'data:image/jpeg;base64,mockImageData' } })
  }
}
