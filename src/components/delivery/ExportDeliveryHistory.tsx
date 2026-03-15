import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Database } from '@/integrations/supabase/types';

type DeliveryRequest = Database['public']['Tables']['requests']['Row'];

interface ExportDeliveryHistoryProps {
  deliveries: DeliveryRequest[];
}

const statusLabels: Record<string, string> = {
  pending: 'Finding Partner',
  matched: 'Partner Found',
  picked_up: 'Purchased',
  in_transit: 'On the Way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const ExportDeliveryHistory: React.FC<ExportDeliveryHistoryProps> = ({ deliveries }) => {
  const [exporting, setExporting] = useState(false);

  const formatDeliveryData = (delivery: DeliveryRequest) => ({
    id: delivery.id.slice(0, 8),
    item: delivery.item_description,
    pickupCity: delivery.pickup_city,
    dropCity: delivery.drop_city,
    status: statusLabels[delivery.status] || delivery.status,
    fare: `₹${delivery.reward || 0}`,
    createdAt: format(new Date(delivery.created_at), 'MMM d, yyyy'),
    deliveredAt: delivery.status === 'delivered' 
      ? format(new Date(delivery.updated_at), 'MMM d, yyyy') 
      : '-',
  });

  const exportToCSV = () => {
    setExporting(true);
    try {
      const headers = ['ID', 'Item', 'Pickup City', 'Drop City', 'Status', 'Fare', 'Created', 'Delivered'];
      const rows = deliveries.map(d => {
        const data = formatDeliveryData(d);
        return [data.id, data.item, data.pickupCity, data.dropCity, data.status, data.fare, data.createdAt, data.deliveredAt];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `delivery-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = () => {
    setExporting(true);
    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.text('Delivery History', 14, 22);
      
      // Subtitle
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on ${format(new Date(), 'MMMM d, yyyy')}`, 14, 30);
      
      // Table
      const tableData = deliveries.map(d => {
        const data = formatDeliveryData(d);
        return [data.id, data.item, data.pickupCity, data.dropCity, data.status, data.fare, data.createdAt];
      });

      autoTable(doc, {
        head: [['ID', 'Item', 'From', 'To', 'Status', 'Fare', 'Created']],
        body: tableData,
        startY: 38,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [30, 30, 30] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 45 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { cellWidth: 25 },
          5: { cellWidth: 20 },
          6: { cellWidth: 25 },
        },
      });

      // Summary
      const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 40;
      const completedCount = deliveries.filter(d => d.status === 'delivered').length;
      const totalSpent = deliveries
        .filter(d => d.status === 'delivered')
        .reduce((sum, d) => sum + (d.reward || 0), 0);

      doc.setFontSize(10);
      doc.setTextColor(0);
      doc.text(`Total Deliveries: ${deliveries.length}`, 14, finalY + 10);
      doc.text(`Completed: ${completedCount}`, 14, finalY + 16);
      doc.text(`Total Spent: ₹${totalSpent}`, 14, finalY + 22);

      doc.save(`delivery-history-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  if (deliveries.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={exporting}>
          <Download className="w-4 h-4 mr-2" />
          {exporting ? 'Exporting...' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF}>
          <FileText className="w-4 h-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
