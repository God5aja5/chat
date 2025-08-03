import React, { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Upload, X, FileText, Image as ImageIcon, File } from "lucide-react";

interface FileUploadProps {
  onFileSelect: (files: FileList) => void;
  onCancel: () => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
  className?: string;
}

export function FileUpload({
  onFileSelect,
  onCancel,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB default
  acceptedTypes = ["*/*"],
  className,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateFiles = (files: File[]): File[] => {
    const validFiles: File[] = [];
    
    for (const file of files) {
      // Check file size
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than ${formatFileSize(maxSize)}`,
          variant: "destructive",
        });
        continue;
      }

      // Check file type if acceptedTypes is specified and not wildcard
      if (acceptedTypes.length > 0 && !acceptedTypes.includes("*/*")) {
        const isAccepted = acceptedTypes.some(type => {
          if (type.endsWith("/*")) {
            return file.type.startsWith(type.slice(0, -1));
          }
          return file.type === type || file.name.toLowerCase().endsWith(type);
        });

        if (!isAccepted) {
          toast({
            title: "File type not supported",
            description: `${file.name} is not a supported file type`,
            variant: "destructive",
          });
          continue;
        }
      }

      validFiles.push(file);
    }

    // Check max files limit
    if (validFiles.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `You can only upload up to ${maxFiles} files at once`,
        variant: "destructive",
      });
      return validFiles.slice(0, maxFiles);
    }

    return validFiles;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const validFiles = validateFiles(files);
    
    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
    }
  }, [maxFiles, maxSize, acceptedTypes, toast]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validFiles = validateFiles(files);
      
      if (validFiles.length > 0) {
        setSelectedFiles(validFiles);
      }
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    if (selectedFiles.length > 0) {
      const dt = new DataTransfer();
      selectedFiles.forEach(file => dt.items.add(file));
      onFileSelect(dt.files);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return ImageIcon;
    if (file.type.startsWith("text/")) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-6">
        {/* Drop Zone */}
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
            dragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <div className="space-y-2">
            <p className="text-lg font-medium">
              Drag and drop files here
            </p>
            <p className="text-sm text-muted-foreground">
              or click to browse files
            </p>
            <p className="text-xs text-muted-foreground">
              Max {maxFiles} files, up to {formatFileSize(maxSize)} each
            </p>
          </div>
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="font-medium">Selected Files</h3>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => {
                const IconComponent = getFileIcon(file);
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveFile(index)}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedFiles.length === 0}
          >
            Upload {selectedFiles.length > 0 ? `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}` : ''}
          </Button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(",")}
          onChange={handleFileInput}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}
