"use client";

import { Settings, Copy, Check, Code2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  fetchDeviceProfileDecoders,
  type DeviceProfileDecoder,
} from "@/lib/api/device-profile-decoder/device-profile-decoder";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

function DeviceProfileDecoder() {
  const [decoders, setDecoders] = useState<DeviceProfileDecoder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDecoderId, setSelectedDecoderId] = useState<string>("");
  const [selectedDecoder, setSelectedDecoder] =
    useState<DeviceProfileDecoder | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadDecoders();
  }, []);

  useEffect(() => {
    if (selectedDecoderId && decoders.length > 0) {
      const decoder = decoders.find((d) => d.name === selectedDecoderId);
      setSelectedDecoder(decoder || null);
    } else {
      setSelectedDecoder(null);
    }
  }, [selectedDecoderId, decoders]);

  async function loadDecoders() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDeviceProfileDecoders();
      setDecoders(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load device profile decoders");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyCode() {
    if (!selectedDecoder) return;
    try {
      await navigator.clipboard.writeText(selectedDecoder.decoder);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900">
            <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Device Profile Decoders
            </h1>
            <p className="text-muted-foreground">
              Browse and view JavaScript decoder codecs from public GitHub
              repositories
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Select Decoder</CardTitle>
              <CardDescription>
                {loading
                  ? "Loading decoders..."
                  : decoders.length === 0
                  ? "No decoders available"
                  : `${decoders.length} decoder${
                      decoders.length !== 1 ? "s" : ""
                    } available`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="decoder-select" className="mb-2">
                    Choose a decoder
                  </Label>
                  {loading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : decoders.length === 0 ? (
                    <Alert>
                      <AlertDescription>
                        No device profile decoders are currently available.
                        Please try again later.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Select
                      value={selectedDecoderId}
                      onValueChange={setSelectedDecoderId}
                    >
                      <SelectTrigger id="decoder-select" className="w-full">
                        <SelectValue placeholder="Select a decoder..." />
                      </SelectTrigger>
                      <SelectContent>
                        {decoders.map((decoder) => (
                          <SelectItem key={decoder.name} value={decoder.name}>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {decoder.device_profile_decoder_name}
                              </span>
                              <span className="text-xs text-muted-foreground font-mono">
                                {decoder.name}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedDecoder && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <Code2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <CardTitle className="text-xl">
                        {selectedDecoder.device_profile_decoder_name}
                      </CardTitle>
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <span>Decoder ID:</span>
                      <Badge variant="outline" className="font-mono text-xs">
                        {selectedDecoder.name}
                      </Badge>
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyCode}
                    className="shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Code
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">
                      JavaScript Decoder Code
                    </Label>
                    <Badge variant="secondary" className="text-xs">
                      {selectedDecoder.decoder.split("\n").length} lines
                    </Badge>
                  </div>
                  <div className="relative">
                    <div className="rounded-lg border bg-slate-950 dark:bg-slate-900 p-4 overflow-auto max-h-[calc(100vh-300px)]">
                      <pre className="text-sm font-mono text-slate-50 whitespace-pre-wrap break-words leading-relaxed">
                        <code>{selectedDecoder.decoder}</code>
                      </pre>
                    </div>
                    <div className="absolute top-2 right-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyCode}
                        className="h-8 w-8 p-0 bg-slate-800/50 hover:bg-slate-700/50"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-slate-300" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!selectedDecoder && selectedDecoderId === "" && (
            <Card className="lg:col-span-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Code2 className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No Decoder Selected
                </h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                  Select a decoder from the dropdown to view its JavaScript code
                  and implementation details.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default DeviceProfileDecoder;
