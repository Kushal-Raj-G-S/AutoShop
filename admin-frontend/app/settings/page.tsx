"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSystemConfig, updateSystemConfig } from "@/lib/api/config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Settings, Loader2, Save, Zap, DollarSign, ShoppingCart, MapPin, Clock, Users, TrendingUp, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Record<string, any>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["system-config"],
    queryFn: getSystemConfig,
  });

  // Initialize form data when config loads
  useEffect(() => {
    if (data?.config) {
      const initial: Record<string, any> = {};
      Object.values(data.config).flat().forEach((item: any) => {
        initial[item.key] = item.value;
      });
      setFormData(initial);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: updateSystemConfig,
    onSuccess: () => {
      toast({
        title: "✅ Settings Saved",
        description: "Your system configuration has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["system-config"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update configuration",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updates = Object.entries(formData).map(([key, value]) => ({
      key,
      value,
    }));

    updateMutation.mutate(updates);
  };

  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const getFieldIcon = (key: string) => {
    if (key.includes('radius')) return <MapPin className="w-4 h-4 text-purple-600" />;
    if (key.includes('timeout')) return <Clock className="w-4 h-4 text-orange-600" />;
    if (key.includes('parallel') || key.includes('count')) return <Users className="w-4 h-4 text-blue-600" />;
    if (key.includes('tax')) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (key.includes('delivery') || key.includes('fee')) return <DollarSign className="w-4 h-4 text-emerald-600" />;
    if (key.includes('order')) return <ShoppingCart className="w-4 h-4 text-indigo-600" />;
    return <CheckCircle2 className="w-4 h-4 text-gray-600" />;
  };

  const renderField = (item: any) => {
    const value = formData[item.key];

    if (item.dataType === 'boolean') {
      return (
        <div key={item.key} className="flex items-start justify-between gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="flex gap-2.5 flex-1">
            <div className="mt-0.5">
              {getFieldIcon(item.key)}
            </div>
            <div className="flex-1">
              <Label htmlFor={item.key} className="text-sm font-medium text-gray-900 cursor-pointer">
                {formatLabel(item.key)}
              </Label>
              <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
            </div>
          </div>
          <Switch
            id={item.key}
            checked={value || false}
            onCheckedChange={(checked) => handleInputChange(item.key, checked)}
          />
        </div>
      );
    }

    return (
      <div key={item.key} className="p-3 rounded-lg hover:bg-gray-50 transition-colors">
        <div className="flex gap-2.5 mb-2">
          <div className="mt-0.5">
            {getFieldIcon(item.key)}
          </div>
          <div className="flex-1">
            <Label htmlFor={item.key} className="text-sm font-medium text-gray-900">
              {formatLabel(item.key)}
            </Label>
            <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
          </div>
        </div>
        <div className="pl-6">
          <Input
            id={item.key}
            type={item.dataType === 'number' ? 'number' : 'text'}
            value={value || ''}
            onChange={(e) => handleInputChange(item.key, item.dataType === 'number' ? Number(e.target.value) : e.target.value)}
            className="max-w-xs"
            placeholder={item.dataType === 'number' ? '0' : 'Enter value'}
          />
        </div>
      </div>
    );
  };

  const formatLabel = (key: string) => {
    return key
      .split('_')
      .slice(1)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-gray-500">Loading configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-8 h-8" />
            System Configuration
          </h1>
          <p className="text-gray-500 mt-1">
            Configure system-wide settings for order assignment, pricing, and more
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Auto-Assignment Settings */}
        <Card className="border-2 hover:border-primary/50 transition-all shadow-sm">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <CardTitle>Auto-Assignment Settings</CardTitle>
                <CardDescription className="mt-1">
                  Configure how orders are automatically assigned to nearby vendors
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 divide-y divide-gray-100">
            {data?.config.assignment?.map(renderField)}
          </CardContent>
        </Card>

        {/* Pricing Settings */}
        <Card className="border-2 hover:border-primary/50 transition-all shadow-sm">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <CardTitle>Pricing Settings</CardTitle>
                <CardDescription className="mt-1">
                  Configure tax rates, delivery fees, and minimum order values
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 divide-y divide-gray-100">
            {data?.config.pricing?.map(renderField)}
          </CardContent>
        </Card>

        {/* Order Settings */}
        <Card className="border-2 hover:border-primary/50 transition-all shadow-sm">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <ShoppingCart className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <CardTitle>Order Settings</CardTitle>
                <CardDescription className="mt-1">
                  Configure order cancellation windows and auto-completion rules
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 divide-y divide-gray-100">
            {data?.config.order?.map(renderField)}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-gray-500">
            Changes will take effect immediately after saving
          </p>
          <Button
            type="submit"
            disabled={updateMutation.isPending}
            size="lg"
            className="shadow-lg hover:shadow-xl transition-all"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Configuration
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
