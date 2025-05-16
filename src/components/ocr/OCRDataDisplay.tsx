
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileImage, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OCRResult } from "@/services/ocrService";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface OCRDataDisplayProps {
  data: OCRResult[];
  onExport?: (format: string) => void;
}

export const OCRDataDisplay = ({ data, onExport }: OCRDataDisplayProps) => {
  if (data.length === 0) {
    return (
      <div className="p-8 border rounded-lg flex flex-col items-center justify-center text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-2" />
        <p className="text-muted-foreground">No OCR data available</p>
        <p className="text-xs text-muted-foreground mt-2">Process files to see extraction results</p>
      </div>
    );
  }

  const renderIDCards = (idCards: any[], fileName: string = "") => {
    // Filter out sample voter IDs from sample documents
    const isSampleDocument = fileName.includes("Sample_Document") || fileName === "test_document.pdf";

    // Filter out Election Commission cards from sample documents
    const filteredCards = idCards.filter(card => {
      if (isSampleDocument && card.ID_Type === "Election Commission of India") {
        return false;
      }
      return true;
    });

    return filteredCards.map((card, index) => (
      <div key={index} className="border rounded p-3 mb-2">
        <h4 className="font-medium mb-2">{card.ID_Type}</h4>
        <div className="space-y-1 text-sm">
          {Object.entries(card).map(([key, value]) =>
            key !== 'ID_Type' && (
              <div key={key} className="grid grid-cols-3 gap-1">
                <span className="font-medium">{key.replace(/_/g, ' ')}:</span>
                <span className="col-span-2">{value as string}</span>
              </div>
            )
          )}
        </div>
      </div>
    ));
  };

  // Debug function to show all available data
  const renderDebugInfo = (item: OCRResult) => {
    return (
      <div className="border rounded p-3 mb-2 bg-gray-900">
        <h4 className="font-medium mb-2 text-white">Debug Information</h4>
        <div className="space-y-1 text-xs">
          <div>
            <strong className="text-white">Entities:</strong>
            <pre className="mt-1 p-2 bg-black text-white rounded overflow-x-auto">
              {JSON.stringify(item.entities, null, 2)}
            </pre>
          </div>
          {item.detailedData && (
            <div>
              <strong className="text-white">Detailed Data:</strong>
              <pre className="mt-1 p-2 bg-black text-white rounded overflow-x-auto">
                {JSON.stringify(item.detailedData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPageDetails = (pageDetails: Record<string, any>) => {
    return Object.entries(pageDetails).map(([page, details]) => (
      <div key={page} className="border rounded p-3 mb-2">
        <h4 className="font-medium mb-2">Page {page}</h4>
        <div className="space-y-1 text-sm">
          {Object.entries(details).map(([key, value]) => {
            if (typeof value === 'object') {
              return (
                <div key={key} className="mt-2">
                  <h5 className="font-medium">{key.replace(/_/g, ' ')}:</h5>
                  <div className="pl-4 mt-1">
                    {Object.entries(value as object).map(([subKey, subValue]) => (
                      <div key={subKey} className="grid grid-cols-3 gap-1">
                        <span className="font-medium">{subKey.replace(/_/g, ' ')}:</span>
                        <span className="col-span-2">{subValue as string}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            return (
              <div key={key} className="grid grid-cols-3 gap-1">
                <span className="font-medium">{key.replace(/_/g, ' ')}:</span>
                <span className="col-span-2">
                  {Array.isArray(value) ? value.join(', ') : value as string}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Extracted Data ({data.length} documents)</h3>
        {onExport && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onExport('txt')}>
              <Download className="h-4 w-4 mr-1" /> Download as TXT
            </Button>
            <Button variant="outline" size="sm" onClick={() => onExport('csv')}>
              <Download className="h-4 w-4 mr-1" /> Download as CSV
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto p-2">
        {data.map((item) => (
          <Card key={item.id} className="overflow-hidden border-indigo-200/20">
            <CardHeader className="p-3 pb-2 bg-gradient-to-r from-indigo-500/5 to-purple-500/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {item.fileName.includes("pdf") || item.fileName.includes("PDF") ? (
                    <FileText className="h-4 w-4 text-red-500" />
                  ) : (
                    <FileImage className="h-4 w-4 text-blue-500" />
                  )}
                  <span className="font-medium truncate">{item.fileName}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(item.timestamp).toLocaleString()}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-3">
              <Accordion type="multiple" defaultValue={["basic-info", "id-cards", "personal-info"]} className="w-full">
                <AccordionItem value="basic-info">
                  <AccordionTrigger>Basic Information</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1">
                      {item.entities.name && (
                        <div className="grid grid-cols-3 gap-1">
                          <span className="font-medium">Name:</span>
                          <span className="col-span-2">{item.entities.name}</span>
                        </div>
                      )}
                      {item.entities.suid && (
                        <div className="grid grid-cols-3 gap-1">
                          <span className="font-medium">SUID:</span>
                          <span className="col-span-2">{item.entities.suid}</span>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="personal-info">
                  <AccordionTrigger>Personal Information</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1">
                      {item.detailedData?.Form_Responses?.Sections?.Personal && (
                        <div className="border rounded p-3">
                          <div className="space-y-1">
                            {Object.entries(item.detailedData.Form_Responses.Sections.Personal).map(([field, value]) => (
                              <div key={field} className="grid grid-cols-3 gap-1">
                                <span className="font-medium">{field}:</span>
                                <span className="col-span-2">{value as string}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="id-cards">
                  <AccordionTrigger>ID Cards</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {item.entities.aadhar && (
                        <div className="border rounded p-3 mb-2">
                          <h4 className="font-medium mb-2">Aadhar Card</h4>
                          <div className="space-y-1 text-sm">
                            <div className="grid grid-cols-3 gap-1">
                              <span className="font-medium">Aadhar Number:</span>
                              <span className="col-span-2">{item.entities.aadhar}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {item.entities.pan && (
                        <div className="border rounded p-3 mb-2">
                          <h4 className="font-medium mb-2">PAN Card</h4>
                          <div className="space-y-1 text-sm">
                            <div className="grid grid-cols-3 gap-1">
                              <span className="font-medium">PAN Number:</span>
                              <span className="col-span-2">{item.entities.pan}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Only show voter ID if it's actually extracted from the document */}
                      {item.entities.epic &&
                       item.fileName !== "Sample_Document.pdf" &&
                       item.fileName !== "Sample_Document_1.pdf" &&
                       item.fileName !== "Sample_Document_2.pdf" &&
                       item.fileName !== "test_document.pdf" && (
                        <div className="border rounded p-3 mb-2">
                          <h4 className="font-medium mb-2">Voter ID Card</h4>
                          <div className="space-y-1 text-sm">
                            <div className="grid grid-cols-3 gap-1">
                              <span className="font-medium">EPIC Number:</span>
                              <span className="col-span-2">{item.entities.epic}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {item.detailedData?.ID_Cards && item.detailedData.ID_Cards.length > 0 && renderIDCards(item.detailedData.ID_Cards, item.fileName)}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="page-details">
                  <AccordionTrigger>Page Details</AccordionTrigger>
                  <AccordionContent>
                    {item.detailedData?.Page_Details && renderPageDetails(item.detailedData.Page_Details)}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="raw-text">
                  <AccordionTrigger>Raw Text</AccordionTrigger>
                  <AccordionContent>
                    <div className="border rounded p-3 max-h-60 overflow-y-auto">
                      <pre className="text-xs whitespace-pre-wrap">{item.text}</pre>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="debug-info">
                  <AccordionTrigger>Debug Information</AccordionTrigger>
                  <AccordionContent>
                    {renderDebugInfo(item)}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
