import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileImage, FileScan, FolderOpen, FileText, Table, Loader2 } from "lucide-react";
import { ocrService, OCRResult, BulkUploadJob } from "@/services/ocrService";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";

interface OCRFormProps {
  onProcessingComplete: (results: OCRResult[]) => void;
  processedFiles: string[];
}

export const OCRForm = ({ onProcessingComplete, processedFiles }: OCRFormProps) => {
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [extractionType, setExtractionType] = useState("all");
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileProcessingProgress, setFileProcessingProgress] = useState(0);
  const [exportToSheets, setExportToSheets] = useState(false);

  // Bulk upload state
  const [folderFiles, setFolderFiles] = useState<File[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkUploadJob, setBulkUploadJob] = useState<BulkUploadJob | null>(null);
  const [bulkUploadProgress, setBulkUploadProgress] = useState(0);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Debug log for progress values
  useEffect(() => {
    if (fileProcessingProgress > 0) {
      console.log(`File processing progress updated: ${fileProcessingProgress}%`);
    }
  }, [fileProcessingProgress]);

  useEffect(() => {
    if (bulkUploadProgress > 0) {
      console.log(`Bulk upload progress updated: ${bulkUploadProgress}%`);
    }
  }, [bulkUploadProgress]);

  // Status polling interval
  const [statusPollingInterval, setStatusPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files);
      const duplicates = fileArray.filter(file => processedFiles.includes(file.name));

      if (duplicates.length > 0) {
        toast({
          title: "Duplicate files detected",
          description: `${duplicates.map(f => f.name).join(", ")} ${duplicates.length === 1 ? 'has' : 'have'} already been processed`,
          variant: "destructive"
        });

        // Only add non-duplicate files
        const newFiles = fileArray.filter(file => !processedFiles.includes(file.name));
        setFiles(prevFiles => [...prevFiles, ...newFiles]);

        if (newFiles.length > 0) {
          toast({
            title: "Files added",
            description: `${newFiles.length} new ${newFiles.length === 1 ? 'file' : 'files'} added for processing`,
          });
        }
      } else {
        setFiles(prevFiles => [...prevFiles, ...fileArray]);
        toast({
          title: "Files added successfully",
          description: `${fileArray.length} files ready for processing`,
        });
      }
    }
  };

  const clearFiles = () => {
    setFiles([]);
    toast({
      title: "Files cleared",
      description: "All files have been removed from the queue",
    });
  };

  const processFiles = async () => {
    if (files.length === 0) {
      toast({
        title: "No files to process",
        description: "Please upload files first",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setFileProcessingProgress(0);

    try {
      // Process files one by one to track progress
      const allResults = [];

      // Set initial progress
      setFileProcessingProgress(5);

      // Simulate initial progress to show movement
      await new Promise(resolve => setTimeout(resolve, 500));
      setFileProcessingProgress(10);

      for (let i = 0; i < files.length; i++) {
        // Calculate progress - start at 10% and go to 90% during processing
        // This leaves room for initial and final animations
        const progressPerFile = 80 / files.length;
        const startProgress = 10 + (i * progressPerFile);

        // Set progress at the start of processing this file
        setFileProcessingProgress(Math.round(startProgress));
        console.log(`Starting to process file ${i+1}/${files.length}, progress: ${Math.round(startProgress)}%`);

        // Process current file
        const fileResult = await ocrService.processFiles({
          extractionType,
          files: [files[i]]
        });

        // Add results to the collection
        if (fileResult && fileResult.length > 0) {
          allResults.push(...fileResult);
        }

        // Update progress after file is processed
        const endProgress = 10 + ((i + 1) * progressPerFile);
        setFileProcessingProgress(Math.round(endProgress));
        console.log(`Finished processing file ${i+1}/${files.length}, progress: ${Math.round(endProgress)}%`);

        // Small delay to make progress visible
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Complete the progress with animation
      setFileProcessingProgress(95);
      await new Promise(resolve => setTimeout(resolve, 300));
      setFileProcessingProgress(100);

      // Pass all results to parent component
      onProcessingComplete(allResults);

      toast({
        title: "Processing complete",
        description: `Successfully processed ${files.length} files`,
      });

      // Export to Google Sheets if the option is selected
      if (exportToSheets && allResults.length > 0) {
        toast({
          title: "Exporting to Google Sheets",
          description: "This may take a moment..."
        });

        const success = await ocrService.saveToGoogleSheets(allResults);

        if (success) {
          toast({
            title: "Export successful",
            description: "Data has been exported to Google Sheets"
          });
        }
      }
    } catch (error) {
      console.error("Error processing files:", error);
      toast({
        title: "Processing failed",
        description: "An error occurred while processing files",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      // Reset progress after a short delay to show 100% completion
      setTimeout(() => setFileProcessingProgress(0), 1000);
    }
  };

  // Handle folder selection
  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files);

      // Filter out non-supported files
      const supportedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.tiff'];
      const supportedFiles = fileArray.filter(file => {
        const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        return supportedExtensions.includes(extension);
      });

      // Check for duplicates
      const duplicates = supportedFiles.filter(file => processedFiles.includes(file.name));

      if (duplicates.length > 0) {
        toast({
          title: "Duplicate files detected",
          description: `${duplicates.length} files have already been processed and will be skipped`,
          variant: "warning"
        });
      }

      // Set the folder files
      setFolderFiles(supportedFiles);

      toast({
        title: "Folder selected",
        description: `${supportedFiles.length} files ready for processing`,
      });
    }
  };

  // Clear folder files
  const clearFolderFiles = () => {
    setFolderFiles([]);
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
    }
    toast({
      title: "Folder files cleared",
      description: "All files have been removed from the queue",
    });
  };

  // Process folder files
  const processFolderFiles = async () => {
    if (folderFiles.length === 0) {
      toast({
        title: "No files to process",
        description: "Please select a folder with files first",
        variant: "destructive"
      });
      return;
    }

    setIsBulkProcessing(true);
    setBulkUploadProgress(0);

    // Set initial progress to show movement
    setTimeout(() => setBulkUploadProgress(5), 300);

    try {
      // Start bulk upload job
      const job = await ocrService.processFolderFiles({
        extractionType,
        files: folderFiles
      });

      setBulkUploadJob(job);

      // Start polling for status
      const interval = setInterval(async () => {
        try {
          const status = await ocrService.checkBulkUploadStatus(job.job_id);
          setBulkUploadJob(status);

          // Calculate progress - scale from 5% to 95% to show movement
          let progress = 5; // Start at 5%

          if (status.total_files > 0) {
            // Scale from 5% to 95% based on processed files
            progress = 5 + Math.round((status.processed_files / status.total_files) * 90);
          }

          console.log(`Bulk upload progress: ${progress}%, Processed: ${status.processed_files}/${status.total_files}`);
          setBulkUploadProgress(progress);

          // If completed or failed, stop polling
          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(interval);
            setStatusPollingInterval(null);
            setIsBulkProcessing(false);

            // If completed, notify user and update results
            if (status.status === 'completed' && status.results) {
              // Set progress to 100% for completion
              setBulkUploadProgress(100);

              toast({
                title: "Bulk processing complete",
                description: `Successfully processed ${status.processed_files} files`,
              });

              // Pass results to parent component
              onProcessingComplete(status.results);
            } else if (status.status === 'failed') {
              toast({
                title: "Bulk processing failed",
                description: "An error occurred during processing",
                variant: "destructive"
              });
            }
          }
        } catch (error) {
          console.error("Error polling for status:", error);
          clearInterval(interval);
          setStatusPollingInterval(null);
          setIsBulkProcessing(false);

          toast({
            title: "Error checking status",
            description: "Failed to check processing status",
            variant: "destructive"
          });
        }
      }, 1000); // Poll every 1 second for more responsive updates

      setStatusPollingInterval(interval);

    } catch (error) {
      console.error("Error processing folder files:", error);
      setIsBulkProcessing(false);

      toast({
        title: "Processing failed",
        description: "An error occurred while starting bulk processing",
        variant: "destructive"
      });
    }
  };

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (statusPollingInterval) {
        clearInterval(statusPollingInterval);
      }
    };
  }, [statusPollingInterval]);

  return (
    <Card className="border-purple-500/20 shadow-lg shadow-purple-500/10">
      <CardHeader className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <FileScan className="h-6 w-6 text-purple-400" />
          File Processing
        </CardTitle>
        <CardDescription>
          Upload and process documents to extract information
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs defaultValue="upload">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="flex items-center gap-1">
              <FileImage className="h-4 w-4" />
              Upload Files
            </TabsTrigger>
            <TabsTrigger value="folder" className="flex items-center gap-1">
              <FolderOpen className="h-4 w-4" />
              From Folder
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4 pt-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="files">Upload PDF or Image Files</Label>
              <Input
                id="files"
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.tiff"
                onChange={handleFileUpload}
                className="cursor-pointer"
              />
            </div>

            {/* Extraction Type and Export to Google Sheets removed as requested */}

            {isProcessing && (
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-sm">
                  <span>Processing files...</span>
                  <span>{Math.round(fileProcessingProgress)}%</span>
                </div>
                <Progress value={fileProcessingProgress} className="h-3 bg-purple-100" />
                <p className="text-xs text-muted-foreground">
                  Status: {fileProcessingProgress < 100 ? "Processing" : "Completing..."} (Progress value: {fileProcessingProgress})
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                onClick={processFiles}
                disabled={files.length === 0 || isProcessing}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  "Process Files"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={clearFiles}
                disabled={files.length === 0 || isProcessing}
              >
                Clear
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="folder" className="space-y-4 pt-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="folder">Select Folder with PDF or Image Files</Label>
              <Input
                id="folder"
                type="file"
                webkitdirectory="true"
                directory=""
                multiple
                ref={folderInputRef}
                onChange={handleFolderSelect}
                className="cursor-pointer"
                disabled={isBulkProcessing}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Supported formats: PDF, PNG, JPG, JPEG, TIFF
              </p>
            </div>

            {bulkUploadJob && isBulkProcessing && (
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-sm">
                  <span>Processing files...</span>
                  <span>{bulkUploadJob.processed_files} of {bulkUploadJob.total_files}</span>
                </div>
                <Progress value={bulkUploadProgress} className="h-3 bg-purple-100" />
                <p className="text-xs text-muted-foreground">
                  Status: {bulkUploadJob.status} (Progress value: {bulkUploadProgress})
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                onClick={processFolderFiles}
                disabled={folderFiles.length === 0 || isBulkProcessing}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                {isBulkProcessing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  "Process Folder"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={clearFolderFiles}
                disabled={folderFiles.length === 0 || isBulkProcessing}
              >
                Clear
              </Button>
            </div>

            {folderFiles.length > 0 && !isBulkProcessing && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Files from Folder ({folderFiles.length})</h3>
                <div className="max-h-40 overflow-y-auto rounded-md border p-2">
                  {folderFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 py-1 text-sm">
                      {file.type.includes("image") ? (
                        <FileImage className="h-4 w-4 text-blue-500" />
                      ) : file.type.includes("pdf") ? (
                        <FileText className="h-4 w-4 text-red-500" />
                      ) : (
                        <FileText className="h-4 w-4 text-green-500" />
                      )}
                      <span className="truncate">{file.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {files.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-2">Files Ready for Processing ({files.length})</h3>
            <div className="max-h-40 overflow-y-auto rounded-md border p-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center gap-2 py-1 text-sm">
                  {file.type.includes("image") ? (
                    <FileImage className="h-4 w-4 text-blue-500" />
                  ) : file.type.includes("pdf") ? (
                    <FileText className="h-4 w-4 text-red-500" />
                  ) : (
                    <FileText className="h-4 w-4 text-green-500" />
                  )}
                  <span className="truncate">{file.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
