'use client'

import { useState } from 'react'
import { Camera, Upload, Edit, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  const [currentStep, setCurrentStep] = useState<'capture' | 'parse' | 'edit' | 'enrich'>('capture')

  const steps = [
    { id: 'capture', title: 'Capture Menu', icon: Camera, description: 'Take a photo of the restaurant menu' },
    { id: 'parse', title: 'Parse Menu', icon: Upload, description: 'AI extracts dishes from the image' },
    { id: 'edit', title: 'Edit Items', icon: Edit, description: 'Review and modify extracted items' },
    { id: 'enrich', title: 'AI Enrichment', icon: Sparkles, description: 'Enhance with detailed descriptions' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Menu PWA AI
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            AI-powered PWA that scans restaurant menus via camera, extracts dishes with descriptions, 
            and lets users edit items. Backend enriches entries with detailed descriptions and nutrition info.
          </p>
        </div>

        {/* Workflow Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = steps.findIndex(s => s.id === currentStep) > index
            
            return (
              <Card 
                key={step.id}
                className={`transition-all duration-300 ${
                  isActive 
                    ? 'ring-2 ring-primary shadow-lg scale-105' 
                    : isCompleted 
                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                    : 'hover:shadow-md'
                }`}
              >
                <CardHeader className="text-center">
                  <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                    isActive 
                      ? 'bg-primary text-primary-foreground'
                      : isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {step.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            )
          })}
        </div>

        {/* Main Content Area */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>
              {steps.find(s => s.id === currentStep)?.title}
            </CardTitle>
            <CardDescription>
              {steps.find(s => s.id === currentStep)?.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 'capture' && (
              <div className="text-center py-12">
                <Camera className="w-24 h-24 mx-auto mb-6 text-gray-400" />
                <h3 className="text-xl font-semibold mb-4">Ready to Scan Your Menu</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                  Take a clear photo of the restaurant menu. Make sure the text is readable and well-lit.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    onClick={() => setCurrentStep('parse')}
                    className="w-full sm:w-auto"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Take Photo
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => setCurrentStep('parse')}
                    className="w-full sm:w-auto"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Upload Image
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 'parse' && (
              <div className="text-center py-12">
                <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-6"></div>
                <h3 className="text-xl font-semibold mb-4">Analyzing Menu...</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  AI is extracting menu items and prices from your image.
                </p>
                <Button 
                  onClick={() => setCurrentStep('edit')}
                  disabled
                  className="animate-pulse"
                >
                  Processing...
                </Button>
              </div>
            )}

            {currentStep === 'edit' && (
              <div className="py-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">Extracted Menu Items</h3>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit All
                  </Button>
                </div>
                
                <div className="space-y-4 mb-8">
                  {/* Sample extracted items */}
                  {[
                    { name: 'Caesar Salad', price: 12.99, category: 'Appetizers' },
                    { name: 'Grilled Salmon', price: 24.99, category: 'Main Courses' },
                    { name: 'Chocolate Cake', price: 8.99, category: 'Desserts' },
                  ].map((item, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{item.name}</h4>
                          <p className="text-sm text-gray-500">{item.category}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-primary">${item.price}</span>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-center">
                  <Button 
                    size="lg"
                    onClick={() => setCurrentStep('enrich')}
                  >
                    Continue to AI Enrichment
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 'enrich' && (
              <div className="text-center py-12">
                <Sparkles className="w-24 h-24 mx-auto mb-6 text-yellow-500" />
                <h3 className="text-xl font-semibold mb-4">AI Enhancement Complete!</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                  Menu items have been enriched with detailed descriptions, nutritional information, and generated images.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg"
                    onClick={() => setCurrentStep('capture')}
                  >
                    Scan Another Menu
                  </Button>
                  <Button variant="outline" size="lg">
                    View Full Menu
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Camera className="w-5 h-5 mr-2 text-primary" />
                Camera Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Seamless camera integration for capturing menu photos with optimal image quality.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-primary" />
                AI-Powered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Advanced AI algorithms extract and enrich menu items with detailed information.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Edit className="w-5 h-5 mr-2 text-primary" />
                Full Offline Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Works offline with local storage and syncs when connection is restored.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
