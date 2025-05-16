
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { OCRForm } from "@/components/ocr/OCRForm";
import { OCRSearch } from "@/components/ocr/OCRSearch";
import { OCRHistory } from "@/components/ocr/OCRHistory";
import { OCRDataDisplay } from "@/components/ocr/OCRDataDisplay";
import { OCRResult, ocrService } from "@/services/ocrService";
import { databaseService } from "@/services/databaseService";
import { Trash2, Database } from "lucide-react";
import { setupDatabase } from "@/utils/createTable";

const OCRPage = () => {
  const { toast } = useToast();
  const [extractedData, setExtractedData] = useState<OCRResult[]>([]);
  const [processingHistory, setProcessingHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [highlightedFileName, setHighlightedFileName] = useState<string>();

  useEffect(() => {
    loadProcessingHistory();
  }, []);

  const loadProcessingHistory = async () => {
    try {
      const history = await ocrService.getProcessingHistory();
      setProcessingHistory(history);
    } catch (error) {
      console.error("Error loading history:", error);
      toast({
        title: "Error loading history",
        description: "Could not load processing history",
        variant: "destructive"
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleDeleteHistoryItem = async (id: string) => {
    try {
      console.log("Deleting record with ID:", id);

      // Delete using database service
      const success = await databaseService.deleteHistoryItem(id);

      if (!success) {
        throw new Error("Failed to delete record");
      }

      console.log("Successfully deleted record from database");

      // Reload the history data after deletion
      await loadProcessingHistory();

      // If the currently displayed data is the one that was deleted, clear it
      if (extractedData.length === 1 && extractedData[0].id === id) {
        setExtractedData([]);
      }
    } catch (error: any) {
      console.error("Error deleting record:", error);
      toast({
        title: "Delete failed",
        description: "Could not delete the processing record",
        variant: "destructive"
      });
    }
  };

  const handleClearAllHistory = async () => {
    if (confirm("Are you sure you want to delete all processing history? This action cannot be undone.")) {
      try {
        await ocrService.clearAllHistory();

        toast({
          title: "History cleared",
          description: "All processing history has been removed",
        });

        // Reload the history data after clearing
        await loadProcessingHistory();

        // Clear any displayed data
        setExtractedData([]);
      } catch (error: any) {
        console.error("Error clearing history:", error);
        toast({
          title: "Clear failed",
          description: "Could not clear the processing history",
          variant: "destructive"
        });
      }
    }
  };

  // Function to set up the database with sample data
  const handleSetupDatabase = async () => {
    try {
      toast({
        title: "Setting up database",
        description: "Creating table and inserting sample data...",
      });

      // Use our setupDatabase utility function
      const success = await setupDatabase();

      if (success) {
        toast({
          title: "Database setup complete",
          description: "Sample data has been inserted successfully",
        });

        // Reload the history data
        await loadProcessingHistory();
      } else {
        toast({
          title: "Database setup failed",
          description: "Could not set up the database",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Error setting up database:", error);
      toast({
        title: "Database setup failed",
        description: `Error: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleProcessingComplete = async (results: OCRResult[]) => {
    setExtractedData(results);
    await loadProcessingHistory();
  };

  const handleExport = async (format: string) => {

    if (extractedData.length === 0 && (format === 'txt' || format === 'csv')) {
      toast({
        title: "No data to export",
        description: "Process files first",
        variant: "destructive"
      });
      return;
    }

    if (format === 'csv') {
      try {
        toast({
          title: "Preparing CSV",
          description: "Fetching all user data from database...",
        });

        // Get the API URL from environment variables or use default
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

        // Fetch the CSV file from the backend
        const response = await fetch(`${apiUrl.replace(/\/api$/, '')}/api/users/csv`);

        if (!response.ok) {
          throw new Error(`Failed to fetch CSV: ${response.statusText}`);
        }

        // Get the CSV content
        const csvContent = await response.text();

        // Create a blob and download it
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "user_data_export.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: "CSV Export",
          description: "CSV file download started",
        });
      } catch (error) {
        console.error("Error exporting to CSV:", error);
        toast({
          title: "Export failed",
          description: "Could not export to CSV file: " + (error instanceof Error ? error.message : String(error)),
          variant: "destructive"
        });
      }
    } else if (format === 'txt') {
      try {
        // Convert the extracted data to a formatted text string
        let textContent = '';

        extractedData.forEach((item, index) => {
          // Add a separator between multiple documents
          if (index > 0) {
            textContent += '\n\n' + '='.repeat(50) + '\n\n';
          }

          // Add file name and timestamp
          textContent += `File: ${item.fileName}\n`;
          textContent += `Processed: ${new Date(item.timestamp).toLocaleString()}\n\n`;

          // Add basic information
          if (item.entities.name) {
            textContent += `Name: ${item.entities.name}\n`;
          }
          if (item.entities.suid) {
            textContent += `SUID: ${item.entities.suid}\n`;
          }

          // Add ID information
          if (item.entities.aadhar) {
            textContent += `Aadhar: ${item.entities.aadhar}\n`;
          }
          if (item.entities.pan) {
            textContent += `PAN: ${item.entities.pan}\n`;
          }
          // Only include voter ID if it's not from a sample document
          if (item.entities.epic &&
              !item.fileName.includes("Sample_Document") &&
              item.fileName !== "test_document.pdf") {
            textContent += `Voter ID: ${item.entities.epic}\n`;
          }

          // Add detailed data if available
          if (item.detailedData) {
            textContent += '\nDetailed Information:\n';

            // Personal information
            if (item.detailedData.Form_Responses?.Sections?.Personal) {
              textContent += '\nPersonal Information:\n';
              const personal = item.detailedData.Form_Responses.Sections.Personal;
              Object.entries(personal).forEach(([key, value]) => {
                textContent += `${key}: ${value}\n`;
              });
            }

            // ID Cards
            if (item.detailedData.ID_Cards && item.detailedData.ID_Cards.length > 0) {
              // Filter out Election Commission cards from sample documents
              const isSampleDocument = item.fileName.includes("Sample_Document") || item.fileName === "test_document.pdf";
              const filteredCards = item.detailedData.ID_Cards.filter(card => {
                if (isSampleDocument && card.ID_Type === "Election Commission of India") {
                  return false;
                }
                return true;
              });

              if (filteredCards.length > 0) {
                textContent += '\nID Cards:\n';
                filteredCards.forEach((card, cardIndex) => {
                  textContent += `\nCard ${cardIndex + 1} - ${card.ID_Type}:\n`;
                  Object.entries(card).forEach(([key, value]) => {
                    if (key !== 'ID_Type') {
                      textContent += `${key}: ${value}\n`;
                    }
                  });
                });
              }
            }

            // Page Details
            if (item.detailedData.Page_Details) {
              textContent += '\nPage Details:\n';
              Object.entries(item.detailedData.Page_Details).forEach(([page, details]) => {
                textContent += `\n${page}:\n`;
                Object.entries(details as Record<string, any>).forEach(([key, value]) => {
                  if (typeof value === 'string') {
                    textContent += `${key}: ${value}\n`;
                  }
                });
              });
            }
          }
        });

        // Create a blob and download it
        const blob = new Blob([textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        // Use SUID_NAME pattern for the filename
        let fileName = 'OCR_Data';
        if (extractedData.length === 1) {
          // If there's only one document, use its SUID and name
          const item = extractedData[0];
          if (item.entities.suid && item.entities.name) {
            // Clean up the name to make it file-system friendly
            const cleanName = item.entities.name.replace(/[\\/:*?"<>|]/g, '_').trim();
            fileName = `${item.entities.suid}_${cleanName}`;
          } else if (item.entities.suid) {
            fileName = item.entities.suid;
          } else if (item.entities.name) {
            const cleanName = item.entities.name.replace(/[\\/:*?"<>|]/g, '_').trim();
            fileName = cleanName;
          }
        } else {
          // If there are multiple documents, use a generic name with timestamp
          fileName = `OCR_Data_${new Date().toISOString().slice(0, 10)}`;
        }

        a.download = `${fileName}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: "TXT Export",
          description: "Text file download started",
        });
      } catch (error) {
        console.error("Error exporting to TXT:", error);
        toast({
          title: "Export failed",
          description: "Could not export to TXT file",
          variant: "destructive"
        });
      }
    }
  };

  const handleHistoryItemClick = (historyItem: any) => {
    if (historyItem.extracted_data) {
      console.log("Loading history item:", historyItem);

      // Check if the extracted_data contains entities directly or needs to be constructed
      const hasEntities = historyItem.extracted_data.entities !== undefined;

      const result: OCRResult = {
        id: historyItem.id,
        fileName: historyItem.file_name,
        timestamp: historyItem.processed_at,
        text: historyItem.extracted_data.text || "",
        entities: hasEntities ? historyItem.extracted_data.entities : {
          name: historyItem.extracted_data?.Name || null,
          suid: historyItem.extracted_data?.SUID || null,
          pan: historyItem.extracted_data?.ID_Cards?.find((card: any) => card.ID_Type === "Income Tax Department")?.PAN_Number || null,
          epic: historyItem.extracted_data?.ID_Cards?.find((card: any) => card.ID_Type === "Election Commission of India")?.EPIC_Number || null,
          aadhar: historyItem.extracted_data?.ID_Cards?.find((card: any) => card.ID_Type === "Government of India")?.Aadhar_Number || null,
          age: historyItem.extracted_data?.Form_Responses?.Sections?.Personal?.Age || null,
          dob: historyItem.extracted_data?.Form_Responses?.Sections?.Personal?.DOB || null,
          gender: historyItem.extracted_data?.Form_Responses?.Sections?.Personal?.Gender || null,
          address: historyItem.extracted_data?.Form_Responses?.Sections?.Personal?.Address || null,
          phone: historyItem.extracted_data?.Form_Responses?.Sections?.Personal?.Phone || null
        },
        detailedData: hasEntities ? historyItem.extracted_data.detailedData : historyItem.extracted_data
      };

      console.log("Constructed result from history:", result);
      setExtractedData([result]);

      toast({
        title: "History item loaded",
        description: `Loaded data from "${historyItem.file_name}"`,
      });
    } else {
      toast({
        title: "No data available",
        description: "This history item has no extracted data",
        variant: "destructive"
      });
    }
  };

  const processedFiles = processingHistory.map(item => item.file_name);

  return (
    <div className="container mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
          OCR Agent
        </h1>
        <p className="text-muted-foreground">
          Extract information from images, PDFs, and text files
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <OCRForm
          onProcessingComplete={handleProcessingComplete}
          processedFiles={processedFiles}
        />

        <div className="space-y-4">
          <OCRSearch onSearchResults={setExtractedData} />
          <OCRDataDisplay
            data={extractedData}
            onExport={handleExport}
          />
        </div>
      </div>

      <Card className="border-indigo-500/20 shadow-lg shadow-indigo-500/10 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-900/20 to-purple-900/20">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Processing History</CardTitle>
              <CardDescription>
                View your recent extraction activities
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {processingHistory.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearAllHistory}
                  className="flex items-center gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <OCRHistory
            isLoading={isLoadingHistory}
            history={processingHistory}
            onHistoryItemClick={handleHistoryItemClick}
            onDeleteItem={handleDeleteHistoryItem}
            highlightedFileName={highlightedFileName}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default OCRPage;
