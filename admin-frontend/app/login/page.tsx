"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { sendOTP, verifyOTP } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const phoneSchema = z.object({
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^\d+$/, "Phone number must contain only digits"),
});

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must contain only digits"),
});

type PhoneFormData = z.infer<typeof phoneSchema>;
type OTPFormData = z.infer<typeof otpSchema>;

export default function LoginPage() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();
  const { login } = useAuth();

  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: "",
    },
  });

  const otpForm = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  const sendOTPMutation = useMutation({
    mutationFn: sendOTP,
    onSuccess: (data) => {
      setStep("otp");
      setError("");
      setSuccessMessage(data.message || "OTP sent successfully!");
      
      // Log OTP in development (backend returns it)
      // if (data.data?.otp) {
      //   console.log("🔐 OTP for testing:", data.data.otp);
      // }
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || "Failed to send OTP";
      setError(errorMessage);
      setSuccessMessage("");
    },
  });

  const verifyOTPMutation = useMutation({
    mutationFn: verifyOTP,
    onSuccess: (data) => {
      // Check if response indicates success
      if (!data.success) {
        setError(data.message || "Verification failed");
        return;
      }

      // Validate admin role
      if (data.user.role !== "admin") {
        setError("Access Denied: Admin privileges required");
        return;
      }

      // Store token and redirect
      login(data.token, data.user);
      setError("");
      setSuccessMessage("Login successful! Redirecting...");
      
      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || "Invalid OTP";
      setError(errorMessage);
      setSuccessMessage("");
    },
  });

  const onPhoneSubmit = (data: PhoneFormData) => {
    const formattedPhone = data.phone.startsWith("+91") 
      ? data.phone 
      : `+91${data.phone}`;
    
    setPhoneNumber(formattedPhone);
    sendOTPMutation.mutate({ phoneNumber: formattedPhone });
  };

  const onOTPSubmit = (data: OTPFormData) => {
    verifyOTPMutation.mutate({
      phoneNumber,
      otp: data.otp,
    });
  };

  const handleBackToPhone = () => {
    setStep("phone");
    setError("");
    setSuccessMessage("");
    otpForm.reset();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Admin Login</CardTitle>
          <CardDescription className="text-center">
            {step === "phone"
              ? "Enter your phone number to receive an OTP"
              : `OTP sent to ${phoneNumber}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "phone" ? (
            <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex">
                  <div className="flex items-center justify-center bg-gray-100 border border-r-0 border-gray-300 rounded-l-md px-3 text-gray-700 font-medium">
                    +91
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    className="rounded-l-none"
                    {...phoneForm.register("phone")}
                  />
                </div>
                {phoneForm.formState.errors.phone && (
                  <p className="text-sm text-red-500">
                    {phoneForm.formState.errors.phone.message}
                  </p>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                  {successMessage}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={sendOTPMutation.isPending}
              >
                {sendOTPMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  "Send OTP"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={otpForm.handleSubmit(onOTPSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                  {...otpForm.register("otp")}
                  autoFocus
                />
                {otpForm.formState.errors.otp && (
                  <p className="text-sm text-red-500">
                    {otpForm.formState.errors.otp.message}
                  </p>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                  {successMessage}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleBackToPhone}
                  disabled={verifyOTPMutation.isPending}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={verifyOTPMutation.isPending}
                >
                  {verifyOTPMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify OTP"
                  )}
                </Button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setSuccessMessage("");
                    sendOTPMutation.mutate({ phoneNumber });
                  }}
                  disabled={sendOTPMutation.isPending}
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline disabled:text-gray-400"
                >
                  Resend OTP
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
