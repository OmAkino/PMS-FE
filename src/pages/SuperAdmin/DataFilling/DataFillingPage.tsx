import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import axiosInstance from "@/api/axiosInstance";
import { Download, Upload, FileSpreadsheet, History, CheckCircle } from "lucide-react";

export default function DataFillingPage() {
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [uploadResult, setUploadResult] = useState<any>(null);

    useEffect(() => {
        fetchTemplates();
        fetchHistory();
    }, []);

    useEffect(() => {
        if (selectedTemplateId) {
            fetchTemplatePreview(selectedTemplateId);
        } else {
            setSelectedTemplate(null);
        }
    }, [selectedTemplateId]);

    const fetchTemplates = async () => {
        try {
            const response = await axiosInstance.get("/data-filling/templates");
            setTemplates(response.data.data);
        } catch (error) {
            console.error("Failed to fetch templates", error);
        }
    };

    const fetchHistory = async () => {
        try {
            const response = await axiosInstance.get("/data-filling/history");
            setHistory(response.data.data);
        } catch (error) {
            console.error("Failed to fetch history", error);
        }
    };

    const fetchTemplatePreview = async (id: string) => {
        try {
            const response = await axiosInstance.get(`/data-filling/template/${id}/preview`);
            setSelectedTemplate(response.data.data);
        } catch (error) {
            console.error("Failed to fetch template preview", error);
        }
    };

    const handleDownload = async () => {
        if (!selectedTemplateId) return;

        try {
            const response = await axiosInstance.get(`/data-filling/download/${selectedTemplateId}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${selectedTemplate.template_name}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Failed to download template", error);
            toast.error("Failed to download template");
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setUploadResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file || !selectedTemplateId) return;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("templateId", selectedTemplateId);

        setUploading(true);
        try {
            const response = await axiosInstance.post("/data-filling/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            setUploadResult(response.data.data);
            toast.success("File uploaded successfully");
            setFile(null);
            fetchHistory();
        } catch (error: any) {
            console.error("Upload failed", error);
            toast.error(error.response?.data?.message || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-6 space-y-8">
            <h1 className="text-2xl font-bold">Data Filling & Upload</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Template Selection & Download */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>1. Select Template</CardTitle>
                            <CardDescription>Choose a template to download and fill data.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Template</label>
                                <select
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={selectedTemplateId}
                                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                                >
                                    <option value="">Select a template...</option>
                                    {templates.map((t) => (
                                        <option key={t._id} value={t._id}>
                                            {t.template_name} (v{t.version})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedTemplate && (
                                <div className="p-4 bg-muted/50 rounded-md space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium">{selectedTemplate.template_name}</span>
                                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                            v{selectedTemplate.version}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                                    <div className="text-xs text-muted-foreground grid grid-cols-2 gap-2 mt-2">
                                        <div>Rows: {selectedTemplate.metadata?.total_rows}</div>
                                        <div>Columns: {selectedTemplate.metadata?.total_columns}</div>
                                    </div>

                                    <Button onClick={handleDownload} className="w-full mt-4">
                                        <Download className="mr-2 h-4 w-4" /> Download Template
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>2. Upload Filled Data</CardTitle>
                            <CardDescription>Upload the filled Excel file to import data.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors">
                                <FileSpreadsheet className="h-10 w-10 text-muted-foreground mb-2" />
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label
                                    htmlFor="file-upload"
                                    className="cursor-pointer text-sm font-medium text-primary hover:underline"
                                >
                                    {file ? file.name : "Click to select Excel file"}
                                </label>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Supported formats: .xlsx, .xls
                                </p>
                            </div>

                            <Button
                                onClick={handleUpload}
                                disabled={!file || !selectedTemplateId || uploading}
                                className="w-full"
                            >
                                {uploading ? (
                                    "Uploading..."
                                ) : (
                                    <>
                                        <Upload className="mr-2 h-4 w-4" /> Upload Data
                                    </>
                                )}
                            </Button>

                            {uploadResult && (
                                <div className="mt-4 p-4 rounded-md bg-green-50 border border-green-200">
                                    <div className="flex items-center text-green-800 font-medium mb-2">
                                        <CheckCircle className="h-4 w-4 mr-2" /> Upload Successful
                                    </div>
                                    <div className="text-sm text-green-700 space-y-1">
                                        <p>Batch ID: {uploadResult.uploadBatchId.substring(0, 8)}...</p>
                                        <p>Success: {uploadResult.successCount} records</p>
                                        {uploadResult.errorCount > 0 && (
                                            <p className="text-red-600">Errors: {uploadResult.errorCount} records</p>
                                        )}
                                    </div>
                                    {uploadResult.errors && uploadResult.errors.length > 0 && (
                                        <div className="mt-2 max-h-32 overflow-y-auto text-xs text-red-600 bg-red-50 p-2 rounded">
                                            {uploadResult.errors.map((err: any, idx: number) => (
                                                <div key={idx}>Row {err.rowNumber}: {err.error}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Upload History */}
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <History className="mr-2 h-5 w-5" /> Upload History
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-auto max-h-[600px]">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Date</th>
                                        <th className="px-4 py-3 font-medium">Template</th>
                                        <th className="px-4 py-3 font-medium text-center">Success</th>
                                        <th className="px-4 py-3 font-medium text-center">Errors</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {history.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                                                No upload history found.
                                            </td>
                                        </tr>
                                    ) : (
                                        history.map((item) => (
                                            <tr key={item._id} className="hover:bg-muted/50">
                                                <td className="px-4 py-3">
                                                    {new Date(item.uploadedAt).toLocaleDateString()}
                                                    <div className="text-xs text-muted-foreground">
                                                        {new Date(item.uploadedAt).toLocaleTimeString()}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {item.templateId?.template_name || "Unknown Template"}
                                                </td>
                                                <td className="px-4 py-3 text-center text-green-600 font-medium">
                                                    {item.successCount}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {item.errorCount > 0 ? (
                                                        <span className="text-red-600 font-medium">{item.errorCount}</span>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
