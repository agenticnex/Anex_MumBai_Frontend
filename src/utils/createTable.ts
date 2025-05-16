// Utility to create the documents table programmatically
import { adminSupabase } from '@/integrations/supabase/client';

// Get Supabase credentials from environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://commvqgpjibmtwwpissd.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvbW12cWdwamlibXR3d3Bpc3NkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjMzNzYzMywiZXhwIjoyMDYxOTEzNjMzfQ.y7e3OYj4cGzRbkZGKKfG7dB8a5LMFeMEeVOK4ifG-IM";

// Function to create the documents table programmatically
export async function createDocumentsTable() {
  console.log("Creating documents table programmatically...");

  try {
    // Try a simpler approach - use the REST API directly
    console.log("Using direct REST API to create table");

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
      }
    } catch (checkError) {
      console.error("Error checking if table exists:", checkError);
    }

    // Create the table using SQL
    console.log("Creating documents table with SQL...");
    const createTableSQL = `
      -- Create the extension for UUID generation if it doesn't exist
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        file_name TEXT NOT NULL,
        suid TEXT,
        extracted_data JSONB,
        status TEXT DEFAULT 'completed',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        pdf_data BYTEA
      );

      -- Add indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_documents_file_name ON documents(file_name);
      CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);
      CREATE INDEX IF NOT EXISTS idx_documents_suid ON documents(suid);

      -- Set up RLS policies
      ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Allow public access for development" ON documents;
      CREATE POLICY "Allow public access for development"
        ON documents
        FOR ALL
        USING (true);
    `;

    // Execute the SQL using direct fetch
    const sqlResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/pgrest_exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({ query: createTableSQL })
    });

    if (!sqlResponse.ok) {
      const errorText = await sqlResponse.text();
      console.error("Error creating table with SQL:", errorText);

      // If the error is that the function doesn't exist, we need to use a different approach
      if (errorText.includes("function") && errorText.includes("does not exist")) {
        console.log("pgrest_exec function doesn't exist, trying direct table creation");

        // Try to create a test record to force table creation
        const testData = {
          file_name: "test_document.pdf",
          suid: "test-suid",
          extracted_data: {},
          status: "test"
        };

        const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/documents`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(testData)
        });

        if (!insertResponse.ok) {
          console.error("Error creating table with direct insert:", await insertResponse.text());
          return false;
        } else {
          console.log("Successfully created table with direct insert");
          return true;
        }
      }

      return false;
    } else {
      console.log("Successfully created table with SQL");

      // Try to insert a test record to verify the table exists
      const testData = {
        file_name: "test_document.pdf",
        suid: "test-suid",
        extracted_data: {},
        status: "test"
      };

      const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(testData)
      });

      if (!insertResponse.ok) {
        console.error("Error inserting test record:", await insertResponse.text());
        return false;
      } else {
        console.log("Successfully inserted test record");
        return true;
      }
    }
  } catch (error) {
    console.error("Error creating documents table:", error);
    return false;
  }
}

// Export a function to create the table and insert sample data
export async function setupDatabase() {
  // First ensure the table exists
  await createDocumentsTable();

  // Sample data
  const sampleData1 = {
    file_name: "Sample_Document.pdf",
    suid: "4/9/2/127A_U/G/14_1",
    extracted_data: {
      Name: "John Doe",
      SUID: "4/9/2/127A_U/G/14_1",
      Form_Responses: {
        Sections: {
          Personal: {
            Age: "35",
            DOB: "15/05/1988",
            Gender: "Male",
            Address: "123 Main St, Mumbai, India"
          }
        }
      },
      ID_Cards: [
        {
          ID_Type: "Government of India",
          Card_Holder_Name: "John Doe",
          Aadhar_Number: "1234 5678 9012",
          Gender: "Male",
          Address: "123 Main St, Mumbai, India"
        },
        {
          ID_Type: "Income Tax Department",
          Card_Holder_Name: "John Doe",
          PAN_Number: "ABCDE1234F"
        }
      ],
      Page_Details: {
        Page_1: {
          Text: "Sample text from page 1",
          Extracted_Name: "John Doe",
          Extracted_SUID: "4/9/2/127A_U/G/14_1"
        }
      }
    },
    status: "completed"
  };

  const sampleData2 = {
    file_name: "Sample_Document_2.pdf",
    suid: "5/10/3/128B_V/H/15_2",
    extracted_data: {
      Name: "Jane Smith",
      SUID: "5/10/3/128B_V/H/15_2",
      Form_Responses: {
        Sections: {
          Personal: {
            Age: "28",
            DOB: "22/09/1995",
            Gender: "Female",
            Address: "456 Park Ave, Delhi, India"
          }
        }
      },
      ID_Cards: [
        {
          ID_Type: "Government of India",
          Card_Holder_Name: "Jane Smith",
          Aadhar_Number: "9876 5432 1098",
          Gender: "Female",
          Address: "456 Park Ave, Delhi, India"
        },
        {
          ID_Type: "Election Commission of India",
          Card_Holder_Name: "Jane Smith",
          EPIC_Number: "MT/10/053/017854"
        }
      ],
      Page_Details: {
        Page_1: {
          Text: "Sample text from page 1",
          Extracted_Name: "Jane Smith",
          Extracted_SUID: "5/10/3/128B_V/H/15_2"
        }
      }
    },
    status: "completed"
  };

  // Insert sample data
  try {
    const { error: error1 } = await adminSupabase
      .from('documents')
      .insert(sampleData1);

    if (error1) {
      console.error("Error inserting sample data 1:", error1);
    } else {
      console.log("Successfully inserted sample data 1");
    }

    const { error: error2 } = await adminSupabase
      .from('documents')
      .insert(sampleData2);

    if (error2) {
      console.error("Error inserting sample data 2:", error2);
    } else {
      console.log("Successfully inserted sample data 2");
    }

    return !error1 && !error2;
  } catch (error) {
    console.error("Error setting up database:", error);
    return false;
  }
}
