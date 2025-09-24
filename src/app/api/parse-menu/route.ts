import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    const { image, imageUrl } = await request.json();

    if (!image && !imageUrl) {
      return NextResponse.json(
        { error: 'Image data or URL is required' },
        { status: 400 }
      );
    }

    // Use OpenAI Vision API to extract text and structure from menu image
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this restaurant menu image and extract all menu items. Return a JSON array of menu items with the following structure:
              {
                "items": [
                  {
                    "name": "item name",
                    "description": "item description if available",
                    "price": "price as number or null",
                    "category": "category/section name"
                  }
                ]
              }
              
              If you can't clearly read an item, skip it. Focus on accuracy over completeness.`
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl || `data:image/jpeg;base64,${image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content returned from OpenAI');
    }

    // Try to parse the JSON response
    let parsedData;
    try {
      // Remove any markdown formatting that might be present
      const cleanContent = content.replace(/```json|```/g, '').trim();
      parsedData = JSON.parse(cleanContent);
    } catch {
      console.error('Failed to parse OpenAI response:', content);
      return NextResponse.json(
        { error: 'Failed to parse menu data from image' },
        { status: 500 }
      );
    }

    // Validate the structure
    if (!parsedData.items || !Array.isArray(parsedData.items)) {
      return NextResponse.json(
        { error: 'Invalid menu data structure' },
        { status: 500 }
      );
    }

    // Clean and validate each item
    const menuItems = parsedData.items.map((item: {
      name?: string;
      description?: string;
      price?: number | string;
      category?: string;
    }) => ({
      id: Math.random().toString(36).substr(2, 9), // Generate temporary ID
      name: item.name || 'Unknown Item',
      description: item.description || null,
      price: typeof item.price === 'number' ? item.price : null,
      category: item.category || 'Other',
      imageUrl: null,
      nutrition: null,
      aiEnriched: false,
    }));

    return NextResponse.json({
      success: true,
      items: menuItems,
      totalItems: menuItems.length
    });

  } catch (error) {
    console.error('Menu parsing error:', error);
    
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured properly' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to parse menu image' },
      { status: 500 }
    );
  }
}