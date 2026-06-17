'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PredictionTable = ({ data }) => {
  if (!data || data.length === 0) {
    return null;
  }

  // Format timestamp to readable date and time
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '-';
    
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return timestamp; // Return as-is if not a valid date
      }
      
      // Format as: MM/DD/YYYY HH:MM AM/PM
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (error) {
      return timestamp; // Return as-is if parsing fails
    }
  };

  // Format header name for display
  const formatHeaderName = (header) => {
    let formatted = header.replace(/_/g, ' ');
    // Convert PH/ph to pH (case-insensitive)
    formatted = formatted.replace(/\bph\b/gi, 'pH');
    // Capitalize first letter of each word, but keep pH as is
    return formatted.split(' ').map(word => {
      if (word.toLowerCase() === 'ph') return 'pH';
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
  };

  // Get headers and sort them to put timestamp first
  const headers = Object.keys(data[0]);
  const sortedHeaders = headers.sort((a, b) => {
    if (a.toLowerCase() === 'timestamp') return -1;
    if (b.toLowerCase() === 'timestamp') return 1;
    return 0;
  });

  return (
    <div className="mt-6 rounded-lg border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {sortedHeaders.map(header => (
              <TableHead key={header}>
                {formatHeaderName(header)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {sortedHeaders.map(header => (
                <TableCell key={`${header}-${rowIndex}`} className="font-medium">
                  {header.toLowerCase() === 'timestamp' 
                    ? formatTimestamp(row[header])
                    : typeof row[header] === 'number' 
                      ? row[header].toFixed(2) 
                      : row[header]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PredictionTable;
