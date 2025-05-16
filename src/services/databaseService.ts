// Database service for handling all database operations
import { toast } from "@/components/ui/use-toast";
import { OCRResult } from "@/types/scraper";
import type { Json } from '@/integrations/supabase/types';
import { createClient } from '@supabase/supabase-js';

// Supabase credentials - use environment variables with fallbacks
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://commvqgpjibmtwwpissd.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvbW12cWdwamlibXR3d3Bpc3NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzMzc2MzMsImV4cCI6MjA2MTkxMzYzM30.z5qIDU337Y60zmyzNL8ZH2zlSZ4g_POOQWW447rnX6k";
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvbW12cWdwamlibXR3d3Bpc3NkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjMzNzYzMywiZXhwIjoyMDYxOTEzNjMzfQ.y7e3OYj4cGzRbkZGKKfG7dB8a5LMFeMEeVOK4ifG-IM";

// Create Supabase clients
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log("Database Service: Initialized with direct Supabase clients");

// Interface for database operations
interface DatabaseService {
  saveProcessingResult(result: OCRResult): Promise<string | null>;
  getProcessingHistory(): Promise<any[]>;
  deleteHistoryItem(id: string): Promise<boolean>;
  clearAllHistory(): Promise<boolean>;
  ensureTableExists(): Promise<boolean>;
}

// Implementation of the database service
class SupabaseDatabaseService implements DatabaseService {

  // Create the documents table if it doesn't exist
  async ensureTableExists(): Promise<boolean> {
    try {
      console.log("Ensuring documents table exists...");

      // First, check if the table exists by trying to query it
      try {
        console.log("Checking if documents table exists...");
        const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/documents?limit=1`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': SUPABASE_SERVICE_ROLE_KEY
          }
        });

        if (checkResponse.ok) {
          console.log("Documents table already exists");
          return true;
        } else {
          console.log("Documents table doesn't exist, response:", await checkResponse.text());

          // Show a message to the user
          toast({
            title: "Database Table Missing",
            description: "The documents table doesn't exist. Please run the SQL script in the Supabase dashboard.",
            variant: "destructive"
          });

          return false;
        }
      } catch (checkError) {
        console.error("Error checking if table exists:", checkError);
      }

      // If we get here, the table doesn't exist
      toast({
        title: "Database Setup Required",
        description: "Please follow the instructions in supabase_setup_instructions.md to set up the database.",
        variant: "destructive"
      });

      return false;
    } catch (error) {
      console.error("Error ensuring table exists:", error);

      toast({
        title: "Database Error",
        description: "Error checking database: " + (error.message || "Unknown error"),
        variant: "destructive"
      });

      return false;
    }
  }

  // Save a processing result to the database
  async saveProcessingResult(result: OCRResult): Promise<string | null> {
    try {
      console.log("Saving processing result to database:", result);

      // Ensure the table exists
      const tableExists = await this.ensureTableExists();
      if (!tableExists) {
        console.error("Table does not exist and could not be created");
        throw new Error("Could not create database table");
      }

      // Extract SUID from the result
      const suid = result.entities?.suid ||
                  (result.detailedData && 'SUID' in result.detailedData ? result.detailedData.SUID : null);

      // Create a combined data object that includes both detailedData and entities
      const combinedData = {
        detailedData: result.detailedData || {},
        entities: result.entities || {},
        text: result.text || ""
      };

      // Convert the result to a JSON-compatible format
      const extractedData: Json = JSON.parse(JSON.stringify(combinedData));

      console.log("Saving to database with SUID:", suid);
      console.log("File name:", result.fileName);

      // Prepare the data to save
      const dataToSave = {
        file_name: result.fileName,
        suid: suid,
        extracted_data: extractedData,
        status: 'completed'
      };

      // Insert the data using direct fetch
      const response = await fetch(`${SUPABASE_URL}/rest/v1/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(dataToSave)
      });

      if (!response.ok) {
        console.error("Error saving to database:", await response.text());

        // Try using SQL as a fallback
        try {
          const insertSQL = `
            INSERT INTO documents (file_name, suid, extracted_data, status)
            VALUES ('${result.fileName.replace(/'/g, "''")}',
                    ${suid ? `'${suid.replace(/'/g, "''")}'` : 'NULL'},
                    '${JSON.stringify(extractedData).replace(/'/g, "''")}'::jsonb,
                    'completed')
            RETURNING id;
          `;

          const sqlResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/pgrest_exec`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              'apikey': SUPABASE_SERVICE_ROLE_KEY
            },
            body: JSON.stringify({ query: insertSQL })
          });

          if (!sqlResponse.ok) {
            console.error("SQL insert error:", await sqlResponse.text());
            throw new Error("Failed to insert data using SQL");
          }

          console.log("Successfully saved to database using SQL");

          toast({
            title: "Saved to Database",
            description: `Successfully saved ${result.fileName} to history`,
          });

          return "saved-with-sql";
        } catch (sqlError) {
          console.error("SQL insert error:", sqlError);
          throw new Error("Failed to save data to database");
        }
      }

      // Parse the response
      const data = await response.json();
      console.log("Successfully saved to database:", data);

      toast({
        title: "Saved to Database",
        description: `Successfully saved ${result.fileName} to history`,
      });

      return data?.[0]?.id || null;
    } catch (error) {
      console.error("Error saving processing result:", error);
      toast({
        title: "Database Error",
        description: `Failed to save to database: ${error.message}`,
        variant: "destructive"
      });
      return null;
    }
  }

  // Get all processing history
  async getProcessingHistory(): Promise<any[]> {
    try {
      console.log("Getting processing history...");

      // Ensure the table exists
      await this.ensureTableExists();

      // Get all records using direct fetch
      const response = await fetch(`${SUPABASE_URL}/rest/v1/documents?select=*&order=created_at.desc`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': SUPABASE_SERVICE_ROLE_KEY
        }
      });

      if (!response.ok) {
        console.error("Error getting processing history:", await response.text());

        // Try using SQL as a fallback
        try {
          const selectSQL = `SELECT * FROM documents ORDER BY created_at DESC;`;

          const sqlResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/pgrest_exec`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              'apikey': SUPABASE_SERVICE_ROLE_KEY
            },
            body: JSON.stringify({ query: selectSQL })
          });

          if (!sqlResponse.ok) {
            console.error("SQL query error:", await sqlResponse.text());
            throw new Error("Failed to get processing history using SQL");
          }

          console.log("Successfully got processing history using SQL");

          // Parse the SQL result
          const rpcData = await sqlResponse.json();
          const parsedData = rpcData?.result?.rows || [];

          // Map the SQL result to match what the UI expects
          return parsedData.map((row: any) => ({
            id: row.id,
            file_name: row.file_name,
            extracted_data: typeof row.extracted_data === 'string'
              ? JSON.parse(row.extracted_data)
              : row.extracted_data,
            status: row.status,
            processed_at: row.created_at,
            suid: row.suid
          }));
        } catch (sqlError) {
          console.error("SQL query error:", sqlError);
          throw new Error("Failed to get processing history");
        }
      }

      // Parse the response
      const data = await response.json();
      console.log("Successfully got processing history:", data?.length || 0, "records");
      return data || [];
    } catch (error) {
      console.error("Error getting processing history:", error);
      toast({
        title: "Database Error",
        description: `Failed to get processing history: ${error.message}`,
        variant: "destructive"
      });
      return [];
    }
  }

  // Delete a history item
  async deleteHistoryItem(id: string): Promise<boolean> {
    try {
      console.log("Deleting history item:", id);

      // Delete the record using direct fetch
      const response = await fetch(`${SUPABASE_URL}/rest/v1/documents?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': SUPABASE_SERVICE_ROLE_KEY
        }
      });

      if (!response.ok) {
        console.error("Error deleting history item:", await response.text());

        // Try using SQL as a fallback
        try {
          const deleteSQL = `DELETE FROM documents WHERE id = '${id}';`;

          const sqlResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/pgrest_exec`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              'apikey': SUPABASE_SERVICE_ROLE_KEY
            },
            body: JSON.stringify({ query: deleteSQL })
          });

          if (!sqlResponse.ok) {
            console.error("SQL delete error:", await sqlResponse.text());
            throw new Error("Failed to delete history item using SQL");
          }

          console.log("Successfully deleted history item using SQL");
        } catch (sqlError) {
          console.error("SQL delete error:", sqlError);
          throw new Error("Failed to delete history item");
        }
      }

      console.log("Successfully deleted history item");
      toast({
        title: "Record Deleted",
        description: "Processing history record has been removed",
      });
      return true;
    } catch (error) {
      console.error("Error deleting history item:", error);
      toast({
        title: "Database Error",
        description: `Failed to delete history item: ${error.message}`,
        variant: "destructive"
      });
      return false;
    }
  }

  // Clear all history
  async clearAllHistory(): Promise<boolean> {
    try {
      console.log("Clearing all history...");

      // Use the Supabase client directly for better reliability
      const { error } = await adminSupabase
        .from('documents')
        .delete()
        .neq('id', '');

      if (error) {
        console.error("Error clearing all history with Supabase client:", error);

        // Try using direct fetch as a fallback
        try {
          console.log("Trying direct fetch to clear history...");
          const response = await fetch(`${SUPABASE_URL}/rest/v1/documents?id=neq.`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              'apikey': SUPABASE_SERVICE_ROLE_KEY
            }
          });

          if (!response.ok) {
            console.error("Error clearing all history with direct fetch:", await response.text());

            // Try using a simple DELETE query as a last resort
            try {
              console.log("Trying simple DELETE query...");

              // Use a simple DELETE query without any conditions
              const { error: deleteError } = await adminSupabase
                .from('documents')
                .delete()
                .gte('id', '00000000-0000-0000-0000-000000000000');

              if (deleteError) {
                console.error("Error with simple DELETE query:", deleteError);
                throw new Error("Failed to clear history with simple DELETE");
              }

              console.log("Successfully cleared all history with simple DELETE");
            } catch (deleteError) {
              console.error("Error with simple DELETE:", deleteError);
              throw new Error("Failed to clear all history");
            }
          } else {
            console.log("Successfully cleared all history with direct fetch");
          }
        } catch (fetchError) {
          console.error("Error with direct fetch:", fetchError);
          throw new Error("Failed to clear all history");
        }
      } else {
        console.log("Successfully cleared all history with Supabase client");
      }

      console.log("Successfully cleared all history");
      toast({
        title: "History Cleared",
        description: "All processing history has been removed",
      });
      return true;
    } catch (error) {
      console.error("Error clearing all history:", error);
      toast({
        title: "Database Error",
        description: `Failed to clear all history: ${error.message}`,
        variant: "destructive"
      });
      return false;
    }
  }
}

// Export the database service
export const databaseService = new SupabaseDatabaseService();

// Removed automatic table initialization to prevent connection tests on each load
