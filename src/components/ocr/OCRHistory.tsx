
import { FileText, Trash2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface OCRHistoryProps {
  isLoading: boolean;
  history: any[];
  onHistoryItemClick: (item: any) => void;
  onDeleteItem: (id: string) => void;
  highlightedFileName?: string;
}

export const OCRHistory = ({
  isLoading,
  history,
  onHistoryItemClick,
  onDeleteItem,
  highlightedFileName
}: OCRHistoryProps) => {
  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2 animate-pulse" />
        <p className="text-muted-foreground">Loading history...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">No processing history</p>
        <p className="text-xs text-muted-foreground mt-2">Process files to see your history</p>
      </div>
    );
  }

  const handleSheetClick = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>File Name</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>SUID</TableHead>
            <TableHead>Google Sheet</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((item) => (
            <TableRow
              key={item.id}
              className={`hover:bg-muted/30 transition-colors cursor-pointer
                ${highlightedFileName === item.file_name ? 'bg-yellow-100/50 dark:bg-yellow-900/20' : ''}`}
              onClick={() => onHistoryItemClick(item)}
            >
              <TableCell className="flex items-center gap-2">
                {item.file_name.includes("pdf") || item.file_name.includes("PDF") ? (
                  <FileText className="h-4 w-4 text-red-500" />
                ) : (
                  <FileText className="h-4 w-4 text-green-500" />
                )}
                <span className="truncate max-w-[200px]">{item.file_name}</span>
              </TableCell>
              <TableCell>{new Date(item.processed_at).toLocaleString()}</TableCell>
              <TableCell>{item.extracted_data?.Name || item.extracted_data?.entities?.name || "—"}</TableCell>
              <TableCell>{item.extracted_data?.SUID || item.extracted_data?.entities?.suid || "—"}</TableCell>
              <TableCell>
                {item.sheet_url ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 flex items-center gap-1 p-1 h-auto"
                    onClick={(e) => handleSheetClick(e, item.sheet_url)}
                  >
                    <span className="whitespace-nowrap">{item.sheet_name || "View Sheet"}</span>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                ) : "—"}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100/50"
                  onClick={(event) => {
                    event.preventDefault();
                    console.log("Delete button clicked for ID:", item.id);
                    onDeleteItem(item.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
