# ORDER LIFECYCLE TEST
Write-Host "ORDER LIFECYCLE TEST" -ForegroundColor Cyan
Write-Host "="*70

# Auth
Write-Host "`nSTEP 1: Authentication" -ForegroundColor Yellow
$phone = "+919876543210"
$otpResp = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/send-otp" -Method POST -ContentType "application/json" -Body (@{phoneNumber=$phone} | ConvertTo-Json)
$otp = $otpResp.data.otp
$authResp = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/verify-otp" -Method POST -ContentType "application/json" -Body (@{phoneNumber=$phone; otp=$otp; role="customer"} | ConvertTo-Json)
$customerToken = $authResp.data.token
$customerHeaders = @{"Authorization"="Bearer $customerToken"; "Content-Type"="application/json"}
Write-Host "Customer OK"

$adminPhone = "+919999999999"
$adminOtpResp = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/send-otp" -Method POST -ContentType "application/json" -Body (@{phoneNumber=$adminPhone} | ConvertTo-Json)
$adminOtp = $adminOtpResp.data.otp
$adminAuthResp = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/verify-otp" -Method POST -ContentType "application/json" -Body (@{phoneNumber=$adminPhone; otp=$adminOtp; role="admin"} | ConvertTo-Json)
$adminToken = $adminAuthResp.data.token
$adminHeaders = @{"Authorization"="Bearer $adminToken"; "Content-Type"="application/json"}
Write-Host "Admin OK"

$vendorPhone = "+919876543211"
$vOtpResp = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/send-otp" -Method POST -ContentType "application/json" -Body (@{phoneNumber=$vendorPhone} | ConvertTo-Json)
$vOtp = $vOtpResp.data.otp
$vAuthResp = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/verify-otp" -Method POST -ContentType "application/json" -Body (@{phoneNumber=$vendorPhone; otp=$vOtp; role="vendor"} | ConvertTo-Json)
$vendorToken = $vAuthResp.data.token
$vendorHeaders = @{"Authorization"="Bearer $vendorToken"; "Content-Type"="application/json"}
Write-Host "Vendor OK"

# Register vendor
$vendorRegBody = @{
    storeName="Test Shop"
    ownerName="Test Owner"
    phone=$vendorPhone
    documentUrl="https://example.com/doc.jpg"
    latitude=12.97
    longitude=77.60
} | ConvertTo-Json
try {
    $vRegResp = Invoke-RestMethod -Uri "http://localhost:5000/api/vendor/register" -Method POST -Headers $vendorHeaders -Body $vendorRegBody
    Write-Host "Vendor registered"
} catch {
    Write-Host "Vendor registration skipped (may already exist)"
}

# Create order
Write-Host "`nSTEP 2: Create Order" -ForegroundColor Yellow
$categories = Invoke-RestMethod -Uri "http://localhost:5000/api/categories" -Method GET
$categoryId = $categories.data.categories[0].id
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$itemBody = @{categoryId=$categoryId; name="Test $timestamp"; description="Test"; price="100.00"; stock=50; imageUrl="https://example.com/test.jpg"} | ConvertTo-Json
$itemResp = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/items" -Method POST -Headers $adminHeaders -Body $itemBody
$itemId = $itemResp.data.item.id

$orderBody = @{
    cart=@(@{itemId=[int]$itemId; quantity=1})
    address=@{address="Test Location"; latitude=12.9700; longitude=77.6000; phone=$phone}
    paymentMethod="cod"
} | ConvertTo-Json -Depth 10

$orderResp = Invoke-RestMethod -Uri "http://localhost:5000/api/orders" -Method POST -Headers $customerHeaders -Body $orderBody
$orderId = $orderResp.data.order.id
Write-Host "Order created: ID $orderId, Status: $($orderResp.data.order.status)"

# Get vendor ID
Write-Host "`nSTEP 3: Get Vendor ID" -ForegroundColor Yellow
$myVendor = Invoke-RestMethod -Uri "http://localhost:5000/api/vendor/me" -Method GET -Headers $vendorHeaders
$vendorId = $myVendor.data.vendor.id
Write-Host "Vendor ID: $vendorId"

# Force assign
Write-Host "`nSTEP 4: Force Assign Order" -ForegroundColor Yellow
$forceBody = @{vendorId=$vendorId} | ConvertTo-Json
$forceResp = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/orders/$orderId/force-assign" -Method POST -Headers $adminHeaders -Body $forceBody
Write-Host "Order force-assigned to vendor $vendorId"

# Test transitions
Write-Host "`nSTEP 5: Test State Transitions" -ForegroundColor Yellow
$transitions = @(
    @{status="in_progress"; desc="In Progress"},
    @{status="completed"; desc="Completed"}
)

foreach ($t in $transitions) {
    $statusBody = @{status=$t.status} | ConvertTo-Json
    try {
        $updateResp = Invoke-RestMethod -Uri "http://localhost:5000/api/vendor/orders/$orderId/status" -Method PATCH -Headers $vendorHeaders -Body $statusBody
        if ($updateResp.success) {
            Write-Host "[PASS] $($t.desc) - Status: $($updateResp.data.status)" -ForegroundColor Green
        } else {
            Write-Host "[FAIL] $($t.desc) - $($updateResp.message)" -ForegroundColor Red
        }
    } catch {
        Write-Host "[ERROR] $($t.desc) - $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    Start-Sleep -Seconds 1
}

# Final state
Write-Host "`nSTEP 6: Final State" -ForegroundColor Yellow
$finalOrder = Invoke-RestMethod -Uri "http://localhost:5000/api/orders/$orderId" -Method GET -Headers $customerHeaders
if ($finalOrder.success) {
    Write-Host "Order ID: $($finalOrder.data.order.orderId)"
    Write-Host "Status: $($finalOrder.data.order.status)"
    Write-Host "Total: Rs.$($finalOrder.data.order.total)"
    Write-Host "Vendor: $($finalOrder.data.order.assignedVendorId)"
} else {
    Write-Host "Failed to get order: $($finalOrder.message)" -ForegroundColor Red
}

# Test cancellation
Write-Host "`nSTEP 7: Test Cancellation" -ForegroundColor Yellow
$orderBody2 = @{
    cart=@(@{itemId=[int]$itemId; quantity=1})
    address=@{address="Test Location 2"; latitude=12.9700; longitude=77.6000; phone=$phone}
    paymentMethod="cod"
} | ConvertTo-Json -Depth 10
$orderResp2 = Invoke-RestMethod -Uri "http://localhost:5000/api/orders" -Method POST -Headers $customerHeaders -Body $orderBody2
$orderId2 = $orderResp2.data.order.id
Write-Host "Created order for cancellation test: ID $orderId2"

$cancelBody = @{reason="Customer changed mind"} | ConvertTo-Json
try {
    $cancelResp = Invoke-RestMethod -Uri "http://localhost:5000/api/orders/$orderId2/cancel" -Method POST -Headers $customerHeaders -Body $cancelBody
    if ($cancelResp.success) {
        Write-Host "[PASS] Cancellation - Status: $($cancelResp.data.order.status)" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Cancellation - $($cancelResp.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "[FAIL] Cancellation - $($_.ErrorDetails.Message)" -ForegroundColor Red
}

# Summary
Write-Host "`n" + ("="*70)
Write-Host "TEST COMPLETE" -ForegroundColor Green
Write-Host ("="*70)
