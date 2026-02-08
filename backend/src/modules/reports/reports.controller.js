import reportsService from './reports.service.js';
import {
  generateOrdersPDF,
  generatePayoutsPDF,
  generateInventoryPDF,
  generateVendorPDF,
} from '../../utils/pdf-generator.js';
import { logActivity, ActivityAction, ActivityEntity } from '../../utils/activity-logger.js';

class ReportsController {
  /**
   * Get Orders Report (JSON or PDF)
   */
  async getOrdersReport(req, res) {
    try {
      const { startDate, endDate, status, vendorId, format = 'json' } = req.query;

      const filters = {
        startDate,
        endDate,
        status,
        vendorId,
      };

      const reportData = await reportsService.generateOrdersReport(filters);

      // Log activity
      await logActivity(
        req,
        req.user.id,
        format === 'pdf' ? ActivityAction.EXPORT : ActivityAction.VIEW,
        ActivityEntity.REPORT,
        null,
        `Generated orders report (${format.toUpperCase()})`,
        { reportType: 'orders', filters, format }
      );

      if (format === 'pdf') {
        const pdfBuffer = await generateOrdersPDF(reportData);
        const filename = `orders-report-${Date.now()}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        return res.send(pdfBuffer);
      }

      res.status(200).json({
        success: true,
        data: reportData,
      });
    } catch (error) {
      console.error('Orders Report Error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate orders report',
      });
    }
  }

  /**
   * Get Payouts Report (JSON or PDF)
   */
  async getPayoutsReport(req, res) {
    try {
      const { startDate, endDate, vendorId, status, format = 'json' } = req.query;

      const filters = {
        startDate,
        endDate,
        vendorId,
        status,
      };

      const reportData = await reportsService.generatePayoutsReport(filters);

      // Log activity
      await logActivity(
        req,
        req.user.id,
        format === 'pdf' ? ActivityAction.EXPORT : ActivityAction.VIEW,
        ActivityEntity.REPORT,
        null,
        `Generated payouts report (${format.toUpperCase()})`,
        { reportType: 'payouts', filters, format }
      );

      if (format === 'pdf') {
        const pdfBuffer = await generatePayoutsPDF(reportData);
        const filename = `payouts-report-${Date.now()}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        return res.send(pdfBuffer);
      }

      res.status(200).json({
        success: true,
        data: reportData,
      });
    } catch (error) {
      console.error('Payouts Report Error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate payouts report',
      });
    }
  }

  /**
   * Get Inventory Report (JSON or PDF)
   */
  async getInventoryReport(req, res) {
    try {
      const { format = 'json' } = req.query;

      const reportData = await reportsService.generateInventoryReport();

      // Log activity
      await logActivity(
        req,
        req.user.id,
        format === 'pdf' ? ActivityAction.EXPORT : ActivityAction.VIEW,
        ActivityEntity.REPORT,
        null,
        `Generated inventory report (${format.toUpperCase()})`,
        { reportType: 'inventory', format }
      );

      if (format === 'pdf') {
        const pdfBuffer = await generateInventoryPDF(reportData);
        const filename = `inventory-report-${Date.now()}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        return res.send(pdfBuffer);
      }

      res.status(200).json({
        success: true,
        data: reportData,
      });
    } catch (error) {
      console.error('Inventory Report Error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate inventory report',
      });
    }
  }

  /**
   * Get Vendor Performance Report (JSON or PDF)
   */
  async getVendorReport(req, res) {
    try {
      const { startDate, endDate, vendorId, format = 'json' } = req.query;

      const filters = {
        startDate,
        endDate,
        vendorId,
      };

      const reportData = await reportsService.generateVendorReport(filters);

      // Log activity
      await logActivity(
        req,
        req.user.id,
        format === 'pdf' ? ActivityAction.EXPORT : ActivityAction.VIEW,
        ActivityEntity.REPORT,
        null,
        `Generated vendor performance report (${format.toUpperCase()})`,
        { reportType: 'vendor', filters, format }
      );

      if (format === 'pdf') {
        const pdfBuffer = await generateVendorPDF(reportData);
        const filename = `vendor-report-${Date.now()}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        return res.send(pdfBuffer);
      }

      res.status(200).json({
        success: true,
        data: reportData,
      });
    } catch (error) {
      console.error('Vendor Report Error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate vendor report',
      });
    }
  }
}

export default new ReportsController();
