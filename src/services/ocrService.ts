import { toast } from "@/hooks/use-toast";
import { databaseService } from "@/services/databaseService";

export interface OCREntity {
  name: string | null;
  suid: string | null;
  pan: string | null;
  epic: string | null;
  aadhar: string | null;
}

export interface DetailedData {
  Name: string;
  SUID: string | null;
  Form_Responses: {
    Sections: Record<string, Record<string, string>>;
  };
  ID_Cards: Array<{
    ID_Type: string;
    Card_Holder_Name: string;
    EPIC_Number?: string;
    PAN_Number?: string;
    Aadhar_Number?: string;
    Gender?: string;
    Address?: string;
  }>;
  Page_Details: Record<string, Record<string, any>>;
}

export interface OCRResult {
  id: string;
  fileName: string;
  timestamp: string;
  text: string;
  entities: OCREntity;
  detailedData?: DetailedData;
}

export interface OCRProcessOptions {
  extractionType: string;
  files: File[];
}

export interface BulkUploadJob {
  job_id: string;
  total_files: number;
  processed_files: number;
  status: string;
  results?: OCRResult[];
}

// Process files using the Supabase Edge Functions


export const ocrService = {
  async processFiles(options: OCRProcessOptions): Promise<OCRResult[]> {
    console.log("Processing files with options:", options);

    // Prepare files data
    const filesData = await Promise.all(
      options.files.map(async (file) => {
        // Read file as base64
        const fileBuffer = await file.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(fileBuffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ''
          )
        );

        return {
          name: file.name,
          type: file.type,
          size: file.size,
          content: base64 // This might be large, consider storing in Supabase storage instead
        };
      })
    );

    try {
      // Use our local API server instead of Supabase Edge Functions
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
      console.log("Using API URL:", apiUrl);

      const response = await fetch(`${apiUrl}/process-ocr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: filesData,
          extractionType: options.extractionType
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error response:", errorText);
        throw new Error(`Error processing files: ${response.statusText}`);
      }

      const data = await response.json();

      // Store processing history for each file
      try {
        console.log("Saving results to database:", data.results);

        // Save each result to the database using our database service
        for (const result of data.results) {
          console.log("Saving result to database:", result.fileName);

          // Save the result to the database
          const savedId = await databaseService.saveProcessingResult(result);

          if (savedId) {
            console.log("Successfully saved to database with ID:", savedId);
          } else {
            console.error("Failed to save to database");
          }
        }
      } catch (dbError) {
        console.error("Database error:", dbError);
        toast({
          title: "Database Error",
          description: `Failed to save results: ${dbError.message}`,
          variant: "destructive"
        });
      }

      return data.results;
    } catch (error) {
      console.error("Error calling OCR service:", error);
      throw error;
    }
  },

  async saveToGoogleSheets(results: OCRResult[]): Promise<boolean> {
    console.log("Saving results to Google Sheets:", results);

    try {
      // This functionality is not implemented yet
      console.warn("Google Sheets export is not implemented yet");
      return false;

      /* Commented out due to missing supabase reference
      const { data, error } = await supabase.functions.invoke('google-sheets-export', {
        body: { data: results }
      });

      if (error) {
        throw new Error(`Error exporting to Google Sheets: ${error.message}`);
      }

      // Update processing history with Google Sheets information
      if (data.sheetUrl) {
        await Promise.all(results.map(async (result) => {
          const { error: updateError } = await supabase
            .from('ocr_processing_history')
            .update({
              sheet_name: data.sheetName || 'OCR Results',
              sheet_url: data.sheetUrl
            })
            .eq('id', result.id);

          if (updateError) {
            console.error("Error updating processing history:", updateError);
            throw updateError;
          }
        }));

        return true;
      }

      return false;
      */
    } catch (error) {
      console.error("Error saving to Google Sheets:", error);
      toast({
        title: "Export Failed",
        description: `Error: ${error.message}`,
        variant: "destructive"
      });
      return false;
    }
  },

  async queryProcessedData(query: string): Promise<OCRResult[]> {
    // This would search through previously processed documents
    console.log("Searching for:", query);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Return mock results
    return [
      {
        id: `ocr-${Date.now()}-1`,
        fileName: "SUID4-9-2-127A_U-G-14_1_Sadanand Atmaram Sarvankar.pdf",
        timestamp: new Date().toISOString(),
        text: "Sample document text containing search term",
        entities: {
          name: "Sadanand Atmaram Sarvankar",
          suid: "4/9/2/127A/G/14_1",
          pan: "ABCDE1234F",
          epic: "XYZ1234567",
          aadhar: "XXXX XXXX 1234"
        }
      }
    ];
  },

  async getProcessingHistory(): Promise<any[]> {
    try {
      console.log("Fetching processing history from database...");

      // Get processing history from database service
      const history = await databaseService.getProcessingHistory();

      // Map the database structure to match what the UI expects
      const results = history.map(doc => ({
        id: doc.id,
        file_name: doc.file_name,
        extracted_data: doc.extracted_data,
        status: doc.status,
        processed_at: doc.created_at,
        user_id: '00000000-0000-0000-0000-000000000000',
        sheet_name: null,
        sheet_url: null
      }));

      console.log("Fetched history from database:", results.length, "records");
      return results;
    } catch (error) {
      console.error("Error in getProcessingHistory:", error);
      toast({
        title: "Error Loading History",
        description: "Could not load processing history. Please try again.",
        variant: "destructive"
      });
      // Return empty array instead of throwing to prevent UI errors
      return [];
    }
  },

  async clearAllHistory(): Promise<void> {
    try {
      console.log("Clearing all history from database...");

      // Clear all history using database service
      const success = await databaseService.clearAllHistory();

      if (!success) {
        throw new Error("Failed to clear history");
      }

      console.log("Successfully cleared all history from database");
    } catch (error) {
      console.error("Error clearing history:", error);
      toast({
        title: "Error Clearing History",
        description: `Failed to clear history: ${error.message}`,
        variant: "destructive"
      });
      throw error;
    }
  },

  async processFolderFiles(options: OCRProcessOptions): Promise<BulkUploadJob> {
    console.log("Processing folder files with options:", options);

    // Prepare files data
    const filesData = await Promise.all(
      options.files.map(async (file) => {
        // Read file as base64
        const fileBuffer = await file.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(fileBuffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ''
          )
        );

        return {
          name: file.name,
          content: base64
        };
      })
    );

    try {
      // Use our local API server
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
      console.log("Using API URL for bulk upload:", apiUrl);

      const response = await fetch(`${apiUrl}/bulk-upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: filesData,
          extractionType: options.extractionType
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error response:", errorText);
        throw new Error(`Error starting bulk upload: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Bulk upload job started:", data);

      return {
        job_id: data.job_id,
        total_files: data.total_files,
        processed_files: 0,
        status: 'uploading'
      };
    } catch (error) {
      console.error("Error starting bulk upload:", error);
      throw error;
    }
  },

  async checkBulkUploadStatus(jobId: string): Promise<BulkUploadJob> {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

      const response = await fetch(`${apiUrl}/bulk-upload/${jobId}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error response:", errorText);
        throw new Error(`Error checking bulk upload status: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Bulk upload status:", data);

      return {
        job_id: data.job_id,
        total_files: data.total_files,
        processed_files: data.processed_files,
        status: data.status,
        results: data.results
      };
    } catch (error) {
      console.error("Error checking bulk upload status:", error);
      throw error;
    }
  }
};
