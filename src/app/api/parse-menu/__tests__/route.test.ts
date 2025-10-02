import { POST } from '../route'
import OpenAI from 'openai'

// Mock OpenAI
jest.mock('openai')

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
    })),
  },
}))

describe('POST /api/parse-menu', () => {
  const mockCreate = jest.fn()
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock OpenAI constructor and methods
    ;(OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    } as unknown as OpenAI))
    
    // Set environment variable
    process.env.OPENAI_API_KEY = 'test-api-key'
    
    // Mock console.error to suppress expected error logs in tests
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    delete process.env.OPENAI_API_KEY
    jest.restoreAllMocks()
  })

  const createMockRequest = (body: Record<string, unknown>) => ({
    json: jest.fn().mockResolvedValue(body),
  })

  it('returns error when API key is not configured', async () => {
    delete process.env.OPENAI_API_KEY

    const request = createMockRequest({ image: 'base64data' })

    const response = await POST(request as never)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('OpenAI API key not configured')
  })

  it('returns error when no image data is provided', async () => {
    const request = createMockRequest({})

    const response = await POST(request as never)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Image data or URL is required')
  })

  it('successfully parses menu with image data', async () => {
    const mockMenuData = {
      items: [
        {
          name: 'Margherita Pizza',
          description: 'Classic tomato and mozzarella',
          price: 12.99,
          category: 'Pizza',
        },
        {
          name: 'Caesar Salad',
          description: 'Romaine lettuce with Caesar dressing',
          price: 8.99,
          category: 'Salads',
        },
      ],
    }

    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify(mockMenuData),
          },
        },
      ],
    })

    const request = createMockRequest({ image: 'base64imagedata' })

    const response = await POST(request as never)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.items).toHaveLength(2)
    expect(data.items[0].name).toBe('Margherita Pizza')
    expect(data.items[0].price).toBe(12.99)
    expect(data.items[1].name).toBe('Caesar Salad')
    expect(data.totalItems).toBe(2)
  })

  it('successfully parses menu with image URL', async () => {
    const mockMenuData = {
      items: [
        {
          name: 'Burger',
          description: 'Beef burger',
          price: 10.99,
          category: 'Burgers',
        },
      ],
    }

    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify(mockMenuData),
          },
        },
      ],
    })

    const request = createMockRequest({ imageUrl: 'https://example.com/menu.jpg' })

    const response = await POST(request as never)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.items).toHaveLength(1)
    expect(data.items[0].name).toBe('Burger')
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4-vision-preview',
        messages: expect.arrayContaining([
          expect.objectContaining({
            content: expect.arrayContaining([
              expect.objectContaining({
                type: 'image_url',
                image_url: {
                  url: 'https://example.com/menu.jpg',
                },
              }),
            ]),
          }),
        ]),
      })
    )
  })

  it('handles markdown-wrapped JSON response', async () => {
    const mockMenuData = {
      items: [
        {
          name: 'Test Item',
          price: 5.99,
          category: 'Test',
        },
      ],
    }

    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: '```json\n' + JSON.stringify(mockMenuData) + '\n```',
          },
        },
      ],
    })

    const request = createMockRequest({ image: 'base64data' })

    const response = await POST(request as never)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.items).toHaveLength(1)
  })

  it('handles items without optional fields', async () => {
    const mockMenuData = {
      items: [
        {
          name: 'Simple Item',
        },
      ],
    }

    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify(mockMenuData),
          },
        },
      ],
    })

    const request = createMockRequest({ image: 'base64data' })

    const response = await POST(request as never)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.items[0].name).toBe('Simple Item')
    expect(data.items[0].description).toBeNull()
    expect(data.items[0].price).toBeNull()
    expect(data.items[0].category).toBe('Other')
  })

  it('returns error when OpenAI returns no content', async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: null,
          },
        },
      ],
    })

    const request = createMockRequest({ image: 'base64data' })

    const response = await POST(request as never)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to parse menu image')
  })

  it('returns error when OpenAI response is not valid JSON', async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: 'This is not valid JSON',
          },
        },
      ],
    })

    const request = createMockRequest({ image: 'base64data' })

    const response = await POST(request as never)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to parse menu data from image')
  })

  it('returns error when response has invalid structure', async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({ wrongKey: 'value' }),
          },
        },
      ],
    })

    const request = createMockRequest({ image: 'base64data' })

    const response = await POST(request as never)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Invalid menu data structure')
  })

  it('handles OpenAI API errors', async () => {
    mockCreate.mockRejectedValue(new Error('API Error'))

    const request = createMockRequest({ image: 'base64data' })

    const response = await POST(request as never)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to parse menu image')
  })

  it('handles API key errors specifically', async () => {
    mockCreate.mockRejectedValue(new Error('Invalid API key'))

    const request = createMockRequest({ image: 'base64data' })

    const response = await POST(request as never)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('OpenAI API key not configured properly')
  })
})
