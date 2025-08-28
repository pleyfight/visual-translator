import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, Image, Settings, Download, Check, X, AlertCircle } from 'lucide-react';

export default function DesignShowcase() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Visual Translator Design System
          </h1>
          <p className="text-lg text-gray-600">
            Complete UI component showcase and design patterns
          </p>
        </div>

        {/* Color Palette */}
        <Card>
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-20 bg-blue-500 rounded-lg"></div>
                <p className="text-sm font-medium">Primary Blue</p>
                <p className="text-xs text-gray-500">#3b82f6</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 bg-gray-900 rounded-lg"></div>
                <p className="text-sm font-medium">Dark Gray</p>
                <p className="text-xs text-gray-500">#111827</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 bg-green-500 rounded-lg"></div>
                <p className="text-sm font-medium">Success Green</p>
                <p className="text-xs text-gray-500">#22c55e</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 bg-red-500 rounded-lg"></div>
                <p className="text-sm font-medium">Error Red</p>
                <p className="text-xs text-gray-500">#ef4444</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Typography */}
        <Card>
          <CardHeader>
            <CardTitle>Typography Scale</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Heading 1 - 4xl Bold</h1>
              <p className="text-sm text-gray-500">Used for main page titles</p>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Heading 2 - 2xl Bold</h2>
              <p className="text-sm text-gray-500">Used for section headers</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Heading 3 - lg Semibold</h3>
              <p className="text-sm text-gray-500">Used for component titles</p>
            </div>
            <div>
              <p className="text-base text-gray-900">Body Text - base Regular</p>
              <p className="text-sm text-gray-500">Standard body text and descriptions</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Caption Text - sm Regular</p>
              <p className="text-sm text-gray-500">Used for help text and captions</p>
            </div>
          </CardContent>
        </Card>

        {/* Button Variants */}
        <Card>
          <CardHeader>
            <CardTitle>Button Components</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button className="w-full">
                <Upload className="w-4 h-4 mr-2" />
                Primary
              </Button>
              <Button variant="outline" className="w-full">
                <Settings className="w-4 h-4 mr-2" />
                Outline
              </Button>
              <Button variant="ghost" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Ghost
              </Button>
              <Button variant="destructive" className="w-full">
                <X className="w-4 h-4 mr-2" />
                Destructive
              </Button>
            </div>
            
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button size="sm" className="w-full">Small</Button>
              <Button size="default" className="w-full">Default</Button>
              <Button size="lg" className="w-full">Large</Button>
              <Button disabled className="w-full">Disabled</Button>
            </div>
          </CardContent>
        </Card>

        {/* Form Elements */}
        <Card>
          <CardHeader>
            <CardTitle>Form Components</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="text-input">Text Input</Label>
                <Input id="text-input" placeholder="Enter text here..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file-input">File Input</Label>
                <Input id="file-input" type="file" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Progress Indicator</Label>
              <Progress value={65} className="w-full" />
              <p className="text-sm text-gray-500">65% complete</p>
            </div>
          </CardContent>
        </Card>

        {/* Status Messages */}
        <Card>
          <CardHeader>
            <CardTitle>Status Messages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-md">
              <Check className="w-4 h-4 text-green-600" />
              <p className="text-sm text-green-600">Translation completed successfully!</p>
            </div>
            
            <div className="flex items-center space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <p className="text-sm text-amber-600">Please add your API key to continue</p>
            </div>
            
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <X className="w-4 h-4 text-red-600" />
              <p className="text-sm text-red-600">File upload failed. Please try again.</p>
            </div>
            
            <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-blue-600">Processing your document...</p>
            </div>
          </CardContent>
        </Card>

        {/* Tab Component */}
        <Card>
          <CardHeader>
            <CardTitle>Tab Navigation</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="documents" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="documents" className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Documents</span>
                </TabsTrigger>
                <TabsTrigger value="images" className="flex items-center space-x-2">
                  <Image className="w-4 h-4" />
                  <span>Images</span>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="documents" className="mt-4">
                <p className="text-gray-600">Document translation interface would be displayed here.</p>
              </TabsContent>
              <TabsContent value="images" className="mt-4">
                <p className="text-gray-600">Image translation interface would be displayed here.</p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* File Upload Area Demo */}
        <Card>
          <CardHeader>
            <CardTitle>File Upload Component</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Upload a document
              </p>
              <p className="text-sm text-gray-500 mb-2">
                Drag and drop your file here, or click to browse
              </p>
              <p className="text-xs text-gray-400">
                Supports: PDF, DOC, DOCX, TXT
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card Variations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Default Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Standard card with subtle shadow and border.</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Elevated Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Enhanced shadow for emphasis.</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Interactive Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Hover effect for clickable cards.</p>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
