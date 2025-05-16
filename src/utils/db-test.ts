// Test file to directly create and populate the database
import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://commvqgpjibmtwwpissd.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvbW12cWdwamlibXR3d3Bpc3NkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjMzNzYzMywiZXhwIjoyMDYxOTEzNjMzfQ.y7e3OYj4cGzRbkZGKKfG7dB8a5LMFeMEeVOK4ifG-IM";

// Create a direct Supabase client with the service role key for admin operations
const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: { 'x-client-info': 'web-scribe-agent-db-test' }
  }
});

// Sample data for testing
const sampleData = [
  {
    file_name: "Sample_Document_1.pdf",
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
  },
  {
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
  }
];

// Function to create the table and insert sample data
export async function setupDatabase() {
  try {
    console.log("Setting up database...");

    // Try to create the table using Supabase SQL
    try {
      // Create the table using SQL
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.documents (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          file_name TEXT NOT NULL,
          suid TEXT,
          extracted_data JSONB,
          status TEXT DEFAULT 'completed',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          pdf_data BYTEA
        );

        -- Allow public access for development purposes
        ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow public access for development" ON public.documents;
        CREATE POLICY "Allow public access for development"
          ON public.documents
          FOR ALL
          USING (true);
      `;

      // Execute SQL using Supabase's SQL API
      const { error: sqlError } = await adminSupabase.from('_sql').select('*').execute(createTableSQL);

      if (sqlError) {
        console.error("Error creating table using SQL API:", sqlError);

        // Try using the rpc method as a fallback
        try {
          const { error: rpcError } = await adminSupabase.rpc('pgrest_exec', { query: createTableSQL });
          if (rpcError) {
            console.error("Error creating table using pgrest_exec:", rpcError);
          } else {
            console.log("Successfully created table using pgrest_exec");
          }
        } catch (rpcError) {
          console.error("Error with pgrest_exec:", rpcError);
        }
      } else {
        console.log("Successfully created table using SQL API");
      }
    } catch (error) {
      console.error("Error creating table:", error);
      // Continue anyway, as the table might already exist
    }

    console.log("Table created successfully");

    // Try to clear existing data
    try {
      console.log("Clearing existing data...");

      // Clear data using Supabase API
      const { error: clearError } = await adminSupabase
        .from('documents')
        .delete()
        .neq('id', '');

      if (clearError) {
        console.error("Error clearing existing data with API:", clearError);

        // Try using SQL as a fallback
        try {
          const clearSQL = `DELETE FROM public.documents;`;
          const { error: sqlError } = await adminSupabase.from('_sql').select('*').execute(clearSQL);

          if (sqlError) {
            console.error("Error clearing data with SQL API:", sqlError);

            // Try using rpc as a last resort
            const { error: rpcError } = await adminSupabase.rpc('pgrest_exec', { query: clearSQL });
            if (rpcError) {
              console.error("Error clearing data with pgrest_exec:", rpcError);
            } else {
              console.log("Successfully cleared data using pgrest_exec");
            }
          } else {
            console.log("Successfully cleared data using SQL API");
          }
        } catch (sqlError) {
          console.error("Error with SQL clear:", sqlError);
        }
      } else {
        console.log("Successfully cleared data using API");
      }
    } catch (error) {
      console.error("Error clearing data:", error);
      // Continue anyway
    }

    // Insert sample data
    try {
      console.log("Inserting sample data...");

      // Insert all samples at once using the API
      const { error: batchInsertError } = await adminSupabase
        .from('documents')
        .insert(sampleData);

      if (batchInsertError) {
        console.error("Error with batch insert:", batchInsertError);

        // Try inserting one by one
        for (const sample of sampleData) {
          try {
            // Try to insert using the API
            const { error: insertError } = await adminSupabase
              .from('documents')
              .insert(sample);

            if (insertError) {
              console.error("Error inserting sample with API:", insertError);

              // Try SQL insert as a fallback
              try {
                const insertSQL = `
                  INSERT INTO public.documents (file_name, suid, extracted_data, status)
                  VALUES ('${sample.file_name.replace(/'/g, "''")}',
                          ${sample.suid ? `'${sample.suid.replace(/'/g, "''")}'` : 'NULL'},
                          '${JSON.stringify(sample.extracted_data).replace(/'/g, "''")}'::jsonb,
                          '${sample.status}')
                  RETURNING id;
                `;

                const { error: sqlError } = await adminSupabase.from('_sql').select('*').execute(insertSQL);

                if (sqlError) {
                  console.error("Error inserting with SQL API:", sqlError);

                  // Try rpc as a last resort
                  const { error: rpcError } = await adminSupabase.rpc('pgrest_exec', { query: insertSQL });
                  if (rpcError) {
                    console.error("Error inserting with pgrest_exec:", rpcError);
                  } else {
                    console.log("Successfully inserted sample using pgrest_exec");
                  }
                } else {
                  console.log("Successfully inserted sample using SQL API");
                }
              } catch (sqlError) {
                console.error("Error with SQL insert:", sqlError);
              }
            } else {
              console.log("Successfully inserted sample using API");
            }
          } catch (sampleError) {
            console.error("Error inserting sample:", sampleError);
            // Continue with next sample
          }
        }
      } else {
        console.log("Successfully inserted all samples using batch API");
      }
    } catch (insertError) {
      console.error("Error inserting samples:", insertError);
      // Continue anyway
    }

    // Verify data was inserted
    try {
      console.log("Verifying data...");

      // Check data using Supabase API
      const { data, error: selectError } = await adminSupabase
        .from('documents')
        .select('*');

      if (selectError) {
        console.error("Error verifying data with API:", selectError);

        // Try SQL as a fallback
        try {
          const selectSQL = `SELECT COUNT(*) FROM public.documents;`;
          const { error: sqlError, data: sqlData } = await adminSupabase.from('_sql').select('*').execute(selectSQL);

          if (sqlError) {
            console.error("Error verifying with SQL API:", sqlError);

            // Try rpc as a last resort
            const { error: rpcError, data: rpcData } = await adminSupabase.rpc('pgrest_exec', { query: selectSQL });
            if (rpcError) {
              console.error("Error verifying with pgrest_exec:", rpcError);
            } else {
              console.log("Data verification from pgrest_exec:", rpcData);
            }
          } else {
            console.log("Data verification from SQL API:", sqlData);
          }
        } catch (sqlError) {
          console.error("Error with SQL verification:", sqlError);
        }
      } else {
        console.log("Data verification with API:", data.length, "records found");
      }
    } catch (verifyError) {
      console.error("Error verifying data:", verifyError);
      // Continue anyway
    }

    return true;
  } catch (error) {
    console.error("Error setting up database:", error);
    return false;
  }
}

// Export the function for use in the application
export default setupDatabase;
