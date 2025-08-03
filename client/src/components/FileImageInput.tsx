import React, { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Upload, 
  Image, 
  File, 
  X, 
  Camera, 
  FileText,
  Music,
  Video,
  Archive,
  AlertCircle
} from 'lucide-react';
import { formatFileSize } from '@/lib/utils';

interface FileData {
  id: string;
  file: File;
  type: 'image' | 'document' | 'audio' | 'video' | 'archive' | 'other';
  preview?: string;
  uploadProgress?: number;
  error?: string;
}

interface FileImageInputProps {
  onFilesChange: (files: FileData[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  acceptedTypes?: string[];
  disabled?: boolean;
  className?: string;
}

const DEFAULT_ACCEPTED_TYPES = [
  'image/*',
  'application/pdf',
  'text/*',
  '.doc,.docx',
  '.xls,.xlsx',
  '.ppt,.pptx',
  'audio/*',
  'video/*',
  '.zip,.rar,.7z'
];

const FILE_TYPE_ICONS = {
  image: Image,
  document: FileText,
  audio: Music,
  video: Video,
  archive: Archive,
  other: File,
};

export default function FileImageInput({
  onFilesChange,
  maxFiles = 10,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  disabled = false,
  className = '',
}: FileImageInputProps) {
  const [files, setFiles] = useState<FileData[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const getFileType = (file: File): FileData['type'] => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text')) return 'document';
    if (file.name.match(/\.(zip|rar|7z|tar|gz)$/i)) return 'archive';
    return 'other';
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File size must be less than ${formatFileSize(maxFileSize)}`;
    }

    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    const isTypeAccepted = acceptedTypes.some(type => {
      if (type.includes('*')) {
        return file.type.startsWith(type.replace('*', ''));
      }
      return type.includes(fileExtension);
    });

    if (!isTypeAccepted) {
      return 'File type not supported';
    }

    return null;
  };

  const createPreview = async (file: File): Promise<string | undefined> => {
    if (file.type.startsWith('image/')) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
    }
    return undefined;
  };

  const processFiles = useCallback(async (fileList: FileList) => {
    if (disabled || isUploading) return;

    const newFiles: FileData[] = [];
    const errors: string[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      
      if (files.length + newFiles.length >= maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
        break;
      }

      const validationError = validateFile(file);
      if (validationError) {
        errors.push(`${file.name}: ${validationError}`);
        continue;
      }

      const preview = await createPreview(file);
      const fileData: FileData = {
        id: `${Date.now()}-${i}`,
        file,
        type: getFileType(file),
        preview,
        uploadProgress: 0,
      };

      newFiles.push(fileData);
    }

    if (errors.length > 0) {
      toast({
        title: 'File Upload Errors',
        description: errors.join(', '),
        variant: 'destructive',
      });
    }

    if (newFiles.length > 0) {
      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      onFilesChange(updatedFiles);
    }
  }, [files, maxFiles, maxFileSize, acceptedTypes, disabled, isUploading, onFilesChange]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList) {
      processFiles(fileList);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;

    const fileList = e.dataTransfer.files;
    if (fileList) {
      processFiles(fileList);
    }
  };

  const removeFile = (fileId: string) => {
    const updatedFiles = files.filter(f => f.id !== fileId);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <Card 
        className={`
          border-2 border-dashed transition-colors cursor-pointer
          ${isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50'}
        `}
        onClick={triggerFileSelect}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-6 text-center">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
            data-testid="input-file-upload"
          />
          
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-muted">
              {isMobile ? (
                <Camera className="h-8 w-8 text-muted-foreground" />
              ) : (
                <Upload className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {isMobile ? 'Take Photo or Upload Files' : 'Upload Files'}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                {isMobile 
                  ? 'Tap to select files or take a photo'
                  : 'Drag and drop files here, or click to select'
                }
              </p>
              <p className="text-xs text-muted-foreground">
                Max {maxFiles} files, up to {formatFileSize(maxFileSize)} each
              </p>
            </div>

            <Button 
              variant="outline" 
              size="sm"
              disabled={disabled}
              data-testid="button-select-files"
            >
              {isMobile ? 'Select Files' : 'Browse Files'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Selected Files ({files.length})</h4>
          <div className="grid grid-cols-1 gap-2">
            {files.map((fileData) => {
              const IconComponent = FILE_TYPE_ICONS[fileData.type];
              
              return (
                <Card key={fileData.id} className="p-3">
                  <div className="flex items-center gap-3">
                    {fileData.preview ? (
                      <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-muted">
                        <img 
                          src={fileData.preview} 
                          alt={fileData.file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded flex items-center justify-center bg-muted flex-shrink-0">
                        <IconComponent className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" title={fileData.file.name}>
                        {fileData.file.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {fileData.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(fileData.file.size)}
                        </span>
                      </div>
                      
                      {fileData.uploadProgress !== undefined && fileData.uploadProgress < 100 && (
                        <Progress value={fileData.uploadProgress} className="mt-2" />
                      )}
                      
                      {fileData.error && (
                        <div className="flex items-center gap-1 mt-1 text-destructive text-xs">
                          <AlertCircle className="h-3 w-3" />
                          {fileData.error}
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(fileData.id);
                      }}
                      disabled={disabled}
                      data-testid={`button-remove-file-${fileData.id}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* File Type Info */}
      <div className="text-xs text-muted-foreground">
        <p>Supported formats: Images, PDF, Documents, Audio, Video, Archives</p>
      </div>
    </div>
  );
}