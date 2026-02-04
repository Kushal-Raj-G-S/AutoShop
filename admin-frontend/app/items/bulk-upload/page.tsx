"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bulkUploadItems } from "@/lib/api/items";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, Download, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";

interface ParsedItem {
  name: string;
  sku?: string;
  brand?: string;
  categoryId: number;
  subCategory?: string;
  description?: string;
  price: number;
  tax?: number;
  serviceTime?: number;
  unitType?: string;
  stock?: number;
  imageUrl?: string;
  isActive?: boolean;
}

export default function BulkUploadPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [csvData, setCsvData] = useState<ParsedItem[]>([]);
  const [uploadResults, setUploadResults] = useState<any>(null);
  const [parseError, setParseError] = useState<string>("");

  const downloadTemplate = () => {
    const template = `name,sku,brand,categoryId,subCategory,description,price,tax,serviceTime,unitType,stock,imageUrl,isActive
Brake Pads Set,BP-001,Brembo,1,Brake Systems,Premium ceramic brake pads,2500,18,45,pcs,50,,true
Engine Oil 5W-30,EO-5W30,Mobil,1,Engine Care,Synthetic engine oil 5 liters,1200,18,15,pcs,100,,true`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'items-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          setParseError('CSV file must have at least a header row and one data row');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim());
        const data: ParsedItem[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const item: any = {};

          headers.forEach((header, index) => {
            const value = values[index];
            
            if (header === 'categoryId' || header === 'stock' || header === 'serviceTime') {
              item[header] = value ? parseInt(value) : undefined;
            } else if (header === 'price' || header === 'tax') {
              item[header] = value ? parseFloat(value) : undefined;
            } else if (header === 'isActive') {
              item[header] = value?.toLowerCase() === 'true';
            } else {
              item[header] = value || undefined;
            }
          });

          // Validate required fields
          if (item.name && item.categoryId && item.price) {
            data.push(item as ParsedItem);
          }
        }

        if (data.length === 0) {
          setParseError('No valid items found in CSV. Make sure name, categoryId, and price are provided.');
          return;
        }

        setCsvData(data);
        setParseError('');
        setUploadResults(null);
      } catch (error) {
        setParseError('Failed to parse CSV file. Please check the format.');
        console.error('CSV Parse Error:', error);
      }
    };

    reader.readAsText(file);
  };

  const uploadMutation = useMutation({
    mutationFn: () => bulkUploadItems(csvData),
    onSuccess: (results) => {
      setUploadResults(results);
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });

  const handleUpload = () => {
    uploadMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/items">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bulk Upload Items</h1>
            <p className="text-gray-500 mt-1">Upload multiple items using CSV file</p>
          </div>
        </div>

        <Button onClick={downloadTemplate} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Download Template
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload CSV File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div className="border-2 border-dashed rounded-lg p-8">
            <label className="flex flex-col items-center cursor-pointer">
              <Upload className="w-12 h-12 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600 mb-1">
                Click to upload CSV file
              </span>
              <span className="text-xs text-gray-400">
                Use the template format for best results
              </span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Parse Error */}
          {parseError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Parse Error</p>
                <p className="text-sm text-red-600 mt-1">{parseError}</p>
              </div>
            </div>
          )}

          {/* Preview Data */}
          {csvData.length > 0 && !uploadResults && (
            <div>
              <h3 className="font-semibold mb-3">
                Preview ({csvData.length} items)
              </h3>
              <div className="border rounded-lg overflow-auto max-h-96">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">#</th>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">SKU</th>
                      <th className="px-4 py-2 text-left">Brand</th>
                      <th className="px-4 py-2 text-left">Category ID</th>
                      <th className="px-4 py-2 text-left">Price</th>
                      <th className="px-4 py-2 text-left">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2">{index + 1}</td>
                        <td className="px-4 py-2">{item.name}</td>
                        <td className="px-4 py-2">{item.sku || '-'}</td>
                        <td className="px-4 py-2">{item.brand || '-'}</td>
                        <td className="px-4 py-2">{item.categoryId}</td>
                        <td className="px-4 py-2">₹{item.price}</td>
                        <td className="px-4 py-2">{item.stock || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-4 mt-4">
                <Button
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending}
                >
                  {uploadMutation.isPending ? 'Uploading...' : 'Upload Items'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCsvData([])}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}

          {/* Upload Results */}
          {uploadResults && (
            <div className="space-y-4">
              <h3 className="font-semibold">Upload Results</h3>

              {uploadResults.successful.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800">
                        Successfully uploaded {uploadResults.successful.length} items
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {uploadResults.failed.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-red-800">
                        Failed to upload {uploadResults.failed.length} items
                      </p>
                      <div className="mt-2 space-y-1 max-h-40 overflow-auto">
                        {uploadResults.failed.map((failure: any, index: number) => (
                          <div key={index} className="text-sm text-red-600">
                            Row {failure.row}: {failure.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <Link href="/items">
                  <Button>View Items</Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCsvData([]);
                    setUploadResults(null);
                  }}
                >
                  Upload More
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
