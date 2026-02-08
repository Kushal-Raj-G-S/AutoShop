import PDFDocument from 'pdfkit';
import { format } from 'date-fns';

/**
 * Generate Orders Report PDF
 */
export const generateOrdersPDF = (reportData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('Orders Report', { align: 'center' });
      doc.moveDown();

      // Filters
      doc.fontSize(10);
      if (reportData.filters.startDate) {
        doc.text(`From: ${format(new Date(reportData.filters.startDate), 'dd/MM/yyyy')}`);
      }
      if (reportData.filters.endDate) {
        doc.text(`To: ${format(new Date(reportData.filters.endDate), 'dd/MM/yyyy')}`);
      }
      doc.text(`Generated: ${format(new Date(reportData.generatedAt), 'dd/MM/yyyy HH:mm')}`);
      doc.moveDown();

      // Summary
      doc.fontSize(14).text('Summary', { underline: true });
      doc.fontSize(10);
      doc.text(`Total Orders: ${reportData.summary.totalOrders}`);
      doc.text(`Total Revenue: ₹${reportData.summary.totalRevenue.toFixed(2)}`);
      doc.text(`Total Delivery Fees: ₹${reportData.summary.totalDeliveryFees.toFixed(2)}`);
      doc.text(`Total GST: ₹${reportData.summary.totalGST.toFixed(2)}`);
      doc.text(`Total Platform Fees: ₹${reportData.summary.totalPlatformFees.toFixed(2)}`);
      doc.moveDown();

      // Orders by Status
      doc.fontSize(12).text('Orders by Status:', { underline: true });
      doc.fontSize(10);
      Object.entries(reportData.summary.byStatus).forEach(([status, count]) => {
        doc.text(`${status}: ${count}`);
      });
      doc.moveDown();

      // Orders Table Header
      doc.fontSize(12).text('Order Details', { underline: true });
      doc.moveDown(0.5);

      const tableTop = doc.y;
      const col1 = 50;
      const col2 = 120;
      const col3 = 220;
      const col4 = 320;
      const col5 = 400;

      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Order #', col1, tableTop);
      doc.text('Customer', col2, tableTop);
      doc.text('Vendor', col3, tableTop);
      doc.text('Status', col4, tableTop);
      doc.text('Amount', col5, tableTop);

      doc.font('Helvetica');
      let yPosition = tableTop + 20;

      // Orders Table Data
      reportData.orders.slice(0, 30).forEach((order) => {
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }

        doc.fontSize(8);
        doc.text(order.orderNumber || order.id.substring(0, 8), col1, yPosition, { width: 60 });
        doc.text(order.userName || 'N/A', col2, yPosition, { width: 90 });
        doc.text(order.vendorName || 'N/A', col3, yPosition, { width: 90 });
        doc.text(order.status, col4, yPosition, { width: 70 });
        doc.text(`₹${parseFloat(order.finalAmount || 0).toFixed(2)}`, col5, yPosition, { width: 80 });

        yPosition += 20;
      });

      if (reportData.orders.length > 30) {
        doc.moveDown();
        doc.fontSize(9).text(`Note: Showing first 30 of ${reportData.orders.length} orders`, { align: 'center' });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate Payouts Report PDF
 */
export const generatePayoutsPDF = (reportData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('Payouts Report', { align: 'center' });
      doc.moveDown();

      // Metadata
      doc.fontSize(10);
      if (reportData.filters.startDate) {
        doc.text(`From: ${format(new Date(reportData.filters.startDate), 'dd/MM/yyyy')}`);
      }
      if (reportData.filters.endDate) {
        doc.text(`To: ${format(new Date(reportData.filters.endDate), 'dd/MM/yyyy')}`);
      }
      doc.text(`Generated: ${format(new Date(reportData.generatedAt), 'dd/MM/yyyy HH:mm')}`);
      doc.moveDown();

      // Summary
      doc.fontSize(14).text('Summary', { underline: true });
      doc.fontSize(10);
      doc.text(`Total Orders: ${reportData.summary.totalOrders}`);
      doc.text(`Total Revenue: ₹${reportData.summary.totalRevenue.toFixed(2)}`);
      doc.text(`Total Platform Fees: ₹${reportData.summary.totalPlatformFees.toFixed(2)}`);
      doc.text(`Total Net Payouts: ₹${reportData.summary.totalNetPayouts.toFixed(2)}`);
      doc.text(`Unique Vendors: ${reportData.summary.uniqueVendors}`);
      doc.moveDown();

      // Vendor Payouts Table
      doc.fontSize(12).text('Vendor Payouts', { underline: true });
      doc.moveDown(0.5);

      const tableTop = doc.y;
      const col1 = 50;
      const col2 = 150;
      const col3 = 280;
      const col4 = 360;
      const col5 = 450;

      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Vendor', col1, tableTop);
      doc.text('Phone', col2, tableTop);
      doc.text('Orders', col3, tableTop);
      doc.text('Revenue', col4, tableTop);
      doc.text('Net Payout', col5, tableTop);

      doc.font('Helvetica');
      let yPosition = tableTop + 20;

      reportData.vendorPayouts.forEach((vendor) => {
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }

        doc.fontSize(8);
        doc.text(vendor.vendorName || 'N/A', col1, yPosition, { width: 90 });
        doc.text(vendor.vendorPhone || 'N/A', col2, yPosition, { width: 110 });
        doc.text(vendor.totalOrders.toString(), col3, yPosition, { width: 70 });
        doc.text(`₹${vendor.totalRevenue.toFixed(2)}`, col4, yPosition, { width: 80 });
        doc.text(`₹${vendor.netPayout.toFixed(2)}`, col5, yPosition, { width: 80 });

        yPosition += 20;
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate Inventory Report PDF
 */
export const generateInventoryPDF = (reportData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('Inventory Report', { align: 'center' });
      doc.moveDown();

      doc.fontSize(10);
      doc.text(`Generated: ${format(new Date(reportData.generatedAt), 'dd/MM/yyyy HH:mm')}`);
      doc.moveDown();

      // Summary
      doc.fontSize(14).text('Summary', { underline: true });
      doc.fontSize(10);
      doc.text(`Total Items: ${reportData.summary.totalItems}`);
      doc.text(`Active Items: ${reportData.summary.activeItems}`);
      doc.text(`Inactive Items: ${reportData.summary.inactiveItems}`);
      doc.text(`Out of Stock: ${reportData.summary.outOfStock}`);
      doc.text(`Low Stock (≤10): ${reportData.summary.lowStock}`);
      doc.text(`Total Stock Value: ₹${reportData.summary.totalStockValue.toFixed(2)}`);
      doc.moveDown();

      // Low Stock Items
      if (reportData.lowStockItems.length > 0) {
        doc.fontSize(12).text('Low Stock Items', { underline: true });
        doc.moveDown(0.5);

        const tableTop = doc.y;
        const col1 = 50;
        const col2 = 200;
        const col3 = 320;
        const col4 = 420;
        const col5 = 490;

        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Item', col1, tableTop);
        doc.text('Category', col2, tableTop);
        doc.text('Vendor', col3, tableTop);
        doc.text('Stock', col4, tableTop);
        doc.text('Price', col5, tableTop);

        doc.font('Helvetica');
        let yPosition = tableTop + 20;

        reportData.lowStockItems.slice(0, 20).forEach((item) => {
          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }

          doc.fontSize(8);
          doc.text(item.name, col1, yPosition, { width: 140 });
          doc.text(item.categoryName || 'N/A', col2, yPosition, { width: 110 });
          doc.text(item.vendorName || 'N/A', col3, yPosition, { width: 90 });
          doc.text(item.stock.toString(), col4, yPosition, { width: 60 });
          doc.text(`₹${parseFloat(item.price || 0).toFixed(2)}`, col5, yPosition, { width: 60 });

          yPosition += 20;
        });
      }

      // Out of Stock Items
      if (reportData.outOfStockItems.length > 0) {
        doc.addPage();
        doc.fontSize(12).text('Out of Stock Items', { underline: true });
        doc.moveDown(0.5);

        reportData.outOfStockItems.slice(0, 30).forEach((item) => {
          doc.fontSize(9);
          doc.text(`• ${item.name} (${item.categoryName || 'Uncategorized'}) - ${item.vendorName || 'No Vendor'}`);
        });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate Vendor Report PDF
 */
export const generateVendorPDF = (reportData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('Vendor Performance Report', { align: 'center' });
      doc.moveDown();

      doc.fontSize(10);
      if (reportData.filters.startDate) {
        doc.text(`From: ${format(new Date(reportData.filters.startDate), 'dd/MM/yyyy')}`);
      }
      if (reportData.filters.endDate) {
        doc.text(`To: ${format(new Date(reportData.filters.endDate), 'dd/MM/yyyy')}`);
      }
      doc.text(`Generated: ${format(new Date(reportData.generatedAt), 'dd/MM/yyyy HH:mm')}`);
      doc.moveDown();

      // Summary
      doc.fontSize(14).text('Summary', { underline: true });
      doc.fontSize(10);
      doc.text(`Total Vendors: ${reportData.summary.totalVendors}`);
      doc.text(`Active Vendors: ${reportData.summary.activeVendors}`);
      doc.text(`Total Orders: ${reportData.summary.totalOrders}`);
      doc.text(`Total Revenue: ₹${reportData.summary.totalRevenue.toFixed(2)}`);
      doc.text(`Total Items: ${reportData.summary.totalItems}`);
      doc.moveDown();

      // Vendor Details Table
      doc.fontSize(12).text('Vendor Performance', { underline: true });
      doc.moveDown(0.5);

      const tableTop = doc.y;
      const col1 = 50;
      const col2 = 180;
      const col3 = 280;
      const col4 = 350;
      const col5 = 440;

      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Vendor', col1, tableTop);
      doc.text('Phone', col2, tableTop);
      doc.text('Orders', col3, tableTop);
      doc.text('Revenue', col4, tableTop);
      doc.text('Items', col5, tableTop);

      doc.font('Helvetica');
      let yPosition = tableTop + 20;

      reportData.vendors.forEach((vendor) => {
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }

        doc.fontSize(8);
        doc.text(vendor.vendorName || 'N/A', col1, yPosition, { width: 120 });
        doc.text(vendor.vendorPhone || 'N/A', col2, yPosition, { width: 90 });
        doc.text(vendor.totalOrders.toString(), col3, yPosition, { width: 60 });
        doc.text(`₹${vendor.totalRevenue.toFixed(2)}`, col4, yPosition, { width: 80 });
        doc.text(`${vendor.activeItems}/${vendor.totalItems}`, col5, yPosition, { width: 80 });

        yPosition += 20;
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
