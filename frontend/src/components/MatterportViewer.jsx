import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Maximize2, Minimize2, RotateCcw, Eye } from 'lucide-react';

export default function MatterportViewer({ matterportId, title }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (!matterportId) {
    return (
      <Card data-testid="matterport-placeholder" className="border-dashed border-2 border-gray-300 bg-gray-50">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Eye className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">3D Virtual Tour</h3>
          <p className="text-sm text-gray-500 max-w-sm">
            No 3D tour available for this property yet. Ask the landlord to add a Matterport scan.
          </p>
        </CardContent>
      </Card>
    );
  }

  const embedUrl = matterportId.startsWith('http')
    ? matterportId
    : `https://my.matterport.com/show/?m=${matterportId}&play=1&qs=1&brand=0`;

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  return (
    <div
      data-testid="matterport-viewer"
      className={isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'relative'}
    >
      {isFullscreen && (
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Button
            data-testid="matterport-exit-fullscreen"
            variant="secondary"
            size="sm"
            onClick={toggleFullscreen}
            className="bg-white/90 hover:bg-white shadow-lg"
          >
            <Minimize2 className="w-4 h-4 mr-1" /> Exit
          </Button>
        </div>
      )}

      <Card className={`overflow-hidden ${isFullscreen ? 'h-full rounded-none border-0' : ''}`}>
        {!isFullscreen && (
          <div className="flex items-center justify-between px-4 py-3 bg-[#1A2F3A] text-white">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              <span className="text-sm font-medium">
                {title ? `3D Tour: ${title}` : '3D Virtual Tour'}
              </span>
            </div>
            <Button
              data-testid="matterport-fullscreen"
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        )}

        <CardContent className={`p-0 ${isFullscreen ? 'h-full' : ''}`}>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-5">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-[#1A2F3A] border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-500">Loading 3D Tour...</span>
              </div>
            </div>
          )}
          <iframe
            data-testid="matterport-iframe"
            src={embedUrl}
            title="Matterport 3D Tour"
            className={`w-full ${isFullscreen ? 'h-full' : 'h-[500px]'}`}
            frameBorder="0"
            allow="xr-spatial-tracking; gyroscope; accelerometer; fullscreen"
            allowFullScreen
            onLoad={() => setIsLoading(false)}
            style={{ border: 'none' }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
