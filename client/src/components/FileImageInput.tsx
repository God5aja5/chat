import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { 
  Upload, 
  Image as ImageIcon, 
  FileText, 
  X, 
  Eye,
  Download,
  Volume2,
  Mic
} from "lucide-react";

interface FileImageInputProps {
  onFilesChange: (files: File[]) => void;
  supportedTypes: {
    supportsImageInput: boolean;
    supportsAudioInput: boolean;
    supportsFileUpload: boolean;
  };
  modelName: string;
  disabled?: boolean;
}

interface FileWithPreview extends File {
  preview?: string;
  id: string;
}

export function FileImageInput({ 
  onFilesChange, 
  supportedTypes, 
  modelName, 
  disabled = false 
}: FileImageInputProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const isSupported = supportedTypes.supportsImageInput || 
                     supportedTypes.supportsAudioInput || 
                     supportedTypes.supportsFileUpload;

  const createFileWithPreview = useCallback(async (file: File): Promise<FileWithPreview> => {
    const fileWithPreview: FileWithPreview = {
      ...file,
      id: Math.random().toString(36).substr(2, 9)
    };

    if (file.type.startsWith('image/')) {
      fileWithPreview.preview = URL.createObjectURL(file);
    }

    return fileWithPreview;
  }, []);

  const handleFileSelection = useCallback(async (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: FileWithPreview[] = [];
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      // Check file type support
      const isImage = file.type.startsWith('image/');
      const isAudio = file.type.startsWith('audio/');
      const isDocument = !isImage && !isAudio;

      if (isImage && !supportedTypes.supportsImageInput) {
        toast({
          title: "File type not supported",
          description: `${modelName} doesn't support image input`,
          variant: "destructive",
        });
        continue;
      }

      if (isAudio && !supportedTypes.supportsAudioInput) {
        toast({
          title: "File type not supported",
          description: `${modelName} doesn't support audio input`,
          variant: "destructive",
        });
        continue;
      }

      if (isDocument && !supportedTypes.supportsFileUpload) {
        toast({
          title: "File type not supported",
          description: `${modelName} doesn't support file uploads`,
          variant: "destructive",
        });
        continue;
      }

      // File size check (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is too large. Maximum size is 10MB.`,
          variant: "destructive",
        });
        continue;
      }

      const fileWithPreview = await createFileWithPreview(file);
      newFiles.push(fileWithPreview);
    }

    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  }, [files, onFilesChange, createFileWithPreview, supportedTypes, modelName]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelection(e.dataTransfer.files);
  }, [handleFileSelection]);

  const removeFile = useCallback((fileId: string) => {
    const fileToRemove = files.find(f => f.id === fileId);
    if (fileToRemove?.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    
    const updatedFiles = files.filter(f => f.id !== fileId);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  }, [files, onFilesChange]);

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return ImageIcon;
    if (file.type.startsWith('audio/')) return Volume2;
    return FileText;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isSupported) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <X className="h-4 w-4" />
          <span>{modelName} doesn't support file, image, or audio input</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="file-image-input">
      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer
          ${isDragOver ? 'border-primary bg-primary/5' : 'border-gray-300 dark:border-gray-600'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        data-testid="drop-zone"
      >
        <div className="text-center">
          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Drag and drop files here, or click to browse
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            {supportedTypes.supportsImageInput && (
              <Badge variant="secondary" className="text-xs">Images</Badge>
            )}
            {supportedTypes.supportsAudioInput && (
              <Badge variant="secondary" className="text-xs">Audio</Badge>
            )}
            {supportedTypes.supportsFileUpload && (
              <Badge variant="secondary" className="text-xs">Documents</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {supportedTypes.supportsImageInput && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => imageInputRef.current?.click()}
            disabled={disabled}
            className="flex items-center gap-2"
            data-testid="button-select-images"
          >
            <ImageIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Select Images</span>
          </Button>
        )}
        
        {supportedTypes.supportsAudioInput && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => audioInputRef.current?.click()}
            disabled={disabled}
            className="flex items-center gap-2"
            data-testid="button-select-audio"
          >
            <Mic className="h-4 w-4" />
            <span className="hidden sm:inline">Select Audio</span>
          </Button>
        )}
        
        {supportedTypes.supportsFileUpload && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="flex items-center gap-2"
            data-testid="button-select-files"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Select Files</span>
          </Button>
        )}
      </div>

      {/* File Previews */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Selected Files ({files.length})</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {files.map((file) => {
              const FileIconComponent = getFileIcon(file);
              return (
                <Card key={file.id} className="overflow-hidden" data-testid={`file-preview-${file.id}`}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      {file.preview ? (
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="w-12 h-12 object-cover rounded flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center flex-shrink-0">
                          <FileIconComponent className="h-6 w-6 text-gray-500" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {file.type.split('/')[0]}
                        </Badge>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(file.id);
                        }}
                        className="h-8 w-8 p-0 flex-shrink-0"
                        data-testid={`button-remove-file-${file.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFileSelection(e.target.files)}
        accept={[
          supportedTypes.supportsImageInput ? 'image/*' : '',
          supportedTypes.supportsAudioInput ? 'audio/*' : '',
          supportedTypes.supportsFileUpload ? '.txt,.pdf,.doc,.docx,.json,.csv,.md' : ''
        ].filter(Boolean).join(',')}
      />
      
      {supportedTypes.supportsImageInput && (
        <input
          ref={imageInputRef}
          type="file"
          multiple
          className="hidden"
          accept="image/*"
          onChange={(e) => handleFileSelection(e.target.files)}
        />
      )}
      
      {supportedTypes.supportsAudioInput && (
        <input
          ref={audioInputRef}
          type="file"
          multiple
          className="hidden"
          accept="audio/*"
          onChange={(e) => handleFileSelection(e.target.files)}
        />
      )}
    </div>
  );
}