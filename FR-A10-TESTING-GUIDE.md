# FR-A10 Testing Guide: Activity Logs & PDF Reports

## Prerequisites
1. Backend server running on port 5000
2. Admin frontend running on port 3000
3. Admin user login credentials (for authentication)

---

## Part 1: Backend Setup & Testing

### Step 1: Start Backend Server
```powershell
# If port 5000 is in use, find and kill the process:
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force

# Start backend
cd backend
npm run dev
```

✅ **Expected Output**: Server running on port 5000, Redis connected

---

### Step 2: Test Activity Logs API

#### A. Login as Admin (Get Auth Token)
```powershell
# POST Login Request
$loginBody = @{
    phone = "9876543210"  # Your admin phone
    password = "admin123"  # Your admin password
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $response.data.token
Write-Host "Token: $token"
```

#### B. Get Activity Logs
```powershell
# Get all activity logs
$headers = @{
    "Authorization" = "Bearer $token"
}

# Test 1: Get all logs
$logs = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/activity-logs?page=1&limit=10" -Headers $headers
Write-Host "Total logs: $($logs.pagination.total)"

# Test 2: Filter by action (e.g., 'create')
$createLogs = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/activity-logs?action=create" -Headers $headers
Write-Host "Create actions: $($createLogs.data.Count)"

# Test 3: Filter by entity (e.g., 'item')
$itemLogs = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/activity-logs?entity=item" -Headers $headers
Write-Host "Item activities: $($itemLogs.data.Count)"

# Test 4: Date range filter
$startDate = "2025-01-01"
$endDate = "2026-12-31"
$dateLogs = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/activity-logs?startDate=$startDate&endDate=$endDate" -Headers $headers
Write-Host "Logs in date range: $($dateLogs.data.Count)"
```

#### C. Get Activity Statistics
```powershell
$stats = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/activity-logs/stats" -Headers $headers
Write-Host "Total activities: $($stats.data.total)"
Write-Host "By action: $($stats.data.byAction | ConvertTo-Json)"
Write-Host "By entity: $($stats.data.byEntity | ConvertTo-Json)"
```

---

### Step 3: Test Reports API

#### A. Orders Report (JSON)
```powershell
# Test 1: Get all orders report
$ordersReport = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/reports/orders" -Headers $headers
Write-Host "Total orders: $($ordersReport.data.summary.totalOrders)"
Write-Host "Total revenue: ₹$($ordersReport.data.summary.totalRevenue)"

# Test 2: Filter by date
$ordersFiltered = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/reports/orders?startDate=2025-01-01&endDate=2026-12-31" -Headers $headers
Write-Host "Filtered orders: $($ordersFiltered.data.summary.totalOrders)"

# Test 3: Filter by status
$deliveredOrders = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/reports/orders?status=delivered" -Headers $headers
Write-Host "Delivered orders: $($deliveredOrders.data.summary.totalOrders)"
```

#### B. Orders Report (PDF Download)
```powershell
# Download Orders PDF
Invoke-WebRequest -Uri "http://localhost:5000/api/admin/reports/orders?format=pdf" -Headers $headers -OutFile "orders-report.pdf"
Write-Host "PDF saved to: orders-report.pdf"
Start-Process "orders-report.pdf"  # Opens PDF
```

#### C. Payouts Report
```powershell
# JSON
$payoutsReport = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/reports/payouts" -Headers $headers
Write-Host "Total payouts: ₹$($payoutsReport.data.summary.totalNetPayouts)"
Write-Host "Unique vendors: $($payoutsReport.data.summary.uniqueVendors)"

# PDF
Invoke-WebRequest -Uri "http://localhost:5000/api/admin/reports/payouts?format=pdf" -Headers $headers -OutFile "payouts-report.pdf"
Start-Process "payouts-report.pdf"
```

#### D. Inventory Report
```powershell
# JSON
$inventoryReport = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/reports/inventory" -Headers $headers
Write-Host "Total items: $($inventoryReport.data.summary.totalItems)"
Write-Host "Out of stock: $($inventoryReport.data.summary.outOfStock)"
Write-Host "Low stock items: $($inventoryReport.data.summary.lowStock)"

# PDF
Invoke-WebRequest -Uri "http://localhost:5000/api/admin/reports/inventory?format=pdf" -Headers $headers -OutFile "inventory-report.pdf"
Start-Process "inventory-report.pdf"
```

#### E. Vendor Performance Report
```powershell
# JSON
$vendorReport = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/reports/vendor" -Headers $headers
Write-Host "Total vendors: $($vendorReport.data.summary.totalVendors)"
Write-Host "Active vendors: $($vendorReport.data.summary.activeVendors)"
Write-Host "Total revenue: ₹$($vendorReport.data.summary.totalRevenue)"

# PDF
Invoke-WebRequest -Uri "http://localhost:5000/api/admin/reports/vendor?format=pdf" -Headers $headers -OutFile "vendor-report.pdf"
Start-Process "vendor-report.pdf"
```

---

## Part 2: Frontend Testing

### Step 1: Start Admin Frontend
```powershell
cd admin-frontend
npm run dev
```

Open browser: **http://localhost:3000**

### Step 2: Login as Admin
1. Navigate to `/login`
2. Enter admin credentials
3. Should redirect to dashboard

---

### Step 3: Test Activity Logs Page

#### Navigate to Activity Logs
Go to: **http://localhost:3000/activity-logs**

#### Test Checklist:
- [ ] **Statistics Cards**: Should show total activities, creates, updates, deletes
- [ ] **Activity Table**: Should display recent activities with:
  - Action icons and colored badges
  - User name and phone
  - Entity type
  - Description
  - IP address
  - Timestamp
- [ ] **Filters**:
  - [ ] Filter by action (create, update, delete, etc.)
  - [ ] Filter by entity (user, vendor, item, order, etc.)
  - [ ] Filter by start date
  - [ ] Filter by end date
  - [ ] Clear all filters button
- [ ] **Pagination**: Previous/Next buttons work correctly
- [ ] **Real-time data**: Reflects recent admin actions

#### Generate Test Data (Create Activities)
To populate activity logs, perform these actions in admin panel:
1. Create a new category → Should log "create category"
2. Update an item → Should log "update item"
3. Block a user → Should log "block user"
4. Create a vendor → Should log "create vendor"
5. Delete a unit → Should log "delete unit"

Then refresh Activity Logs page to see new entries!

---

### Step 4: Test Reports Page

#### Navigate to Reports
Go to: **http://localhost:3000/reports**

#### A. Orders Report Tab
- [ ] **Summary Cards**: Total orders, revenue, delivery fees, platform fees displayed
- [ ] **Filters**:
  - [ ] Start date picker
  - [ ] End date picker
  - [ ] Status dropdown (pending, delivered, etc.)
- [ ] **Orders Table**: Shows order number, customer, vendor, status, amount, date
- [ ] **Download PDF Button**: Downloads orders-report.pdf

#### B. Payouts Report Tab
- [ ] **Summary Cards**: Total orders, revenue, platform fees, net payouts, unique vendors
- [ ] **Vendor Payouts Table**: Shows vendor name, phone, orders, revenue, platform fee, net payout
- [ ] **Download PDF**: Downloads payouts-report.pdf

#### C. Inventory Report Tab
- [ ] **Summary Cards**: Total items, active, out of stock, low stock, stock value
- [ ] **Low Stock Items Table**: Items with stock ≤ 10
- [ ] Shows category, vendor, stock count, price
- [ ] **Download PDF**: Downloads inventory-report.pdf

#### D. Vendor Report Tab
- [ ] **Summary Cards**: Total vendors, active vendors, total orders, total revenue
- [ ] **Vendor Performance Table**: Shows vendor name, phone, orders, completed, revenue, items
- [ ] **Download PDF**: Downloads vendor-report.pdf

---

## Part 3: End-to-End Testing Scenarios

### Scenario 1: Track Admin Actions
1. Login as admin
2. Open Activity Logs page in one tab
3. In another tab, perform actions:
   - Create a new item
   - Update a category
   - Block a user
4. Refresh Activity Logs page
5. ✅ Verify all actions are logged with correct timestamps

### Scenario 2: Generate Monthly Report
1. Go to Reports page → Orders tab
2. Set start date: 2026-01-01
3. Set end date: 2026-01-31
4. Click "Download PDF"
5. ✅ PDF should contain:
   - January 2026 orders only
   - Summary statistics
   - Order details table
   - Professional formatting

### Scenario 3: Identify Low Stock Items
1. Go to Reports page → Inventory tab
2. Look at "Low Stock Items" section
3. Click "Download PDF"
4. ✅ PDF should show all items with stock ≤ 10
5. Share PDF with purchasing team

### Scenario 4: Calculate Vendor Payouts
1. Go to Reports page → Payouts tab
2. Filter by date range (e.g., last week)
3. Review vendor payouts table
4. Download PDF for accounting
5. ✅ Net payout = Revenue - Platform Fee (verify calculation)

### Scenario 5: Audit User Activity
1. Go to Activity Logs page
2. Filter by entity: "user"
3. Filter by action: "block"
4. Review when and which users were blocked
5. ✅ Shows complete audit trail

---

## Part 4: Verify Activity Logging Integration

### Test Auto-Logging (Future Integration)
Once you integrate activity logging into existing modules, test:

1. **Item CRUD**:
   - Create item → Logs "create item"
   - Update item → Logs "update item"
   - Delete item → Logs "delete item"

2. **User Management**:
   - Block user → Logs "block user"
   - Unblock user → Logs "unblock user"

3. **Order Management**:
   - Assign order → Logs "assign order"
   - Update status → Logs "update order"

4. **Report Generation**:
   - View report → Logs "view report"
   - Export PDF → Logs "export report"

---

## Part 5: Database Verification

### Check Activity Logs Table
```powershell
# Connect to database and run:
SELECT COUNT(*) as total_logs FROM activity_logs;
SELECT action, COUNT(*) as count FROM activity_logs GROUP BY action;
SELECT entity, COUNT(*) as count FROM activity_logs GROUP BY entity;
SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 10;
```

---

## Troubleshooting

### Issue: No activity logs showing
**Solution**: Manually create a test log:
```powershell
# Using the backend API (requires admin token)
$testLog = @{
    userId = "your-admin-user-id"
    action = "create"
    entity = "item"
    description = "Test activity log entry"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/admin/activity-logs" -Method POST -Body $testLog -Headers @{"Authorization"="Bearer $token"} -ContentType "application/json"
```

### Issue: PDF download fails
**Solution**: Check browser console for errors, verify pdfkit installed:
```powershell
cd backend
npm list pdfkit date-fns
```

### Issue: Filters not working
**Solution**: Check browser Network tab, verify query parameters are sent correctly

---

## Success Criteria ✅

FR-A10 is fully working when:
- [ ] Activity logs page loads without errors
- [ ] Can filter logs by action, entity, date range
- [ ] Statistics show correct counts
- [ ] All 4 report types generate successfully
- [ ] PDF downloads work for all report types
- [ ] PDFs contain correct data and formatting
- [ ] Reports reflect current database state
- [ ] Activity logs capture admin actions (when integrated)

---

## Quick Test Script (All-in-One)

Save this as `test-fr-a10.ps1`:

```powershell
# Quick FR-A10 Test Script

Write-Host "🧪 Testing FR-A10: Activity Logs & Reports" -ForegroundColor Cyan

# Login
$loginBody = @{
    phone = "9876543210"
    password = "admin123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $response.data.token
    $headers = @{"Authorization" = "Bearer $token"}
    Write-Host "✅ Login successful" -ForegroundColor Green

    # Test Activity Logs
    $logs = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/activity-logs" -Headers $headers
    Write-Host "✅ Activity Logs: $($logs.pagination.total) total" -ForegroundColor Green

    # Test Activity Stats
    $stats = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/activity-logs/stats" -Headers $headers
    Write-Host "✅ Activity Stats: $($stats.data.total) total activities" -ForegroundColor Green

    # Test Reports
    $reports = @("orders", "payouts", "inventory", "vendor")
    foreach ($report in $reports) {
        $data = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/reports/$report" -Headers $headers
        Write-Host "✅ $report report: OK" -ForegroundColor Green
        
        # Test PDF
        Invoke-WebRequest -Uri "http://localhost:5000/api/admin/reports/$report`?format=pdf" -Headers $headers -OutFile "$report-test.pdf"
        Write-Host "✅ $report PDF: Downloaded" -ForegroundColor Green
    }

    Write-Host "`n🎉 All FR-A10 tests passed!" -ForegroundColor Green
    Write-Host "Check your current directory for PDF files" -ForegroundColor Yellow

} catch {
    Write-Host "❌ Test failed: $($_.Exception.Message)" -ForegroundColor Red
}
```

Run with:
```powershell
.\test-fr-a10.ps1
```

---

**Happy Testing! 🚀**
