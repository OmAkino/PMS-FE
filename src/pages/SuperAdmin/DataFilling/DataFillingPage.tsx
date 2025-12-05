import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import {
    Download,
    Upload,
    FileSpreadsheet,
    History,
    CheckCircle,
    AlertTriangle,
    ChevronRight,
    FileCheck,
    Calculator,
    Users,
    Columns,
    Eye
} from "lucide-react";

interface ColumnMapping {
    columnIndex: number;
    columnName: string;
    headerName: string;
    mappedField: string | null;
    dataType: string;
    isRequired: boolean;
}

interface Template {
    _id: string;
    template_name: string;
    description?: string;
    version: string;
    createdAt: string;
    column_mappings?: ColumnMapping[];
    employee_field_mapping?: {
        employeeIdColumn: number;
        nameColumn?: number;
        emailColumn?: number;
    };
    header_row_index?: number;
    data_start_row?: number;
    metadata?: {
        total_rows: number;
        total_columns: number;
        formula_cells?: string[];
    };
}

interface UploadResult {
    uploadBatchId: string;
    templateId: string;
    templateName: string;
    totalRows: number;
    successCount: number;
    errorCount: number;
    processedRecords: Array<{
        row: number;
        employeeId: string;
        employeeName: string;
        status: string;
    }>;
    errors: Array<{
        row: number;
        employeeId?: string;
        message: string;
    }>;
    formulasApplied?: number;
}

export default function DataFillingPage() {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [validating, setValidating] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
    const [validationResult, setValidationResult] = useState<any>(null);
    const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Select Template, 2: Download & Fill, 3: Upload


    useEffect(() => {
        fetchTemplates();
        fetchHistory();
    }, []);

    useEffect(() => {
        if (selectedTemplateId) {
            fetchTemplatePreview(selectedTemplateId);
            setStep(2);
        } else {
            setSelectedTemplate(null);
            setStep(1);
        }
    }, [selectedTemplateId]);

    const fetchTemplates = async () => {
        try {
            const response = await axiosInstance.get("/data-filling/templates");
            setTemplates(response.data.data);
        } catch (error) {
            console.error("Failed to fetch templates", error);
            toast.error("Failed to fetch templates");
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
            toast.error("Failed to fetch template details");
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
            link.setAttribute('download', `${selectedTemplate?.template_name || 'template'}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success("Template downloaded successfully!");
            setStep(3);
        } catch (error) {
            console.error("Failed to download template", error);
            toast.error("Failed to download template");
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setUploadResult(null);
            setValidationResult(null);

            // Auto-validate file when selected
            validateFile(selectedFile);
        }
    };

    const validateFile = async (fileToValidate: File) => {
        if (!selectedTemplateId) {
            toast.error("Please select a template first");
            return;
        }

        setValidating(true);
        const formData = new FormData();
        formData.append("file", fileToValidate);
        formData.append("templateId", selectedTemplateId);

        try {
            const response = await axiosInstance.post("/data-filling/validate", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            setValidationResult(response.data.data);

            if (response.data.data.isValid) {
                toast.success("File validated successfully!");
            } else {
                toast.warning("File has validation issues");
            }
        } catch (error: any) {
            console.error("Validation failed", error);
            setValidationResult({
                isValid: false,
                errors: [error.response?.data?.message || "Validation failed"],
                warnings: []
            });
            toast.error("File validation failed");
        } finally {
            setValidating(false);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error("Please select a file to upload");
            return;
        }

        if (!selectedTemplateId) {
            toast.error("Please select a template first");
            return;
        }

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
            toast.success("File uploaded successfully!");
            setFile(null);
            setValidationResult(null);
            fetchHistory();

            // Reset file input
            const fileInput = document.getElementById('file-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        } catch (error: any) {
            console.error("Upload failed", error);
            toast.error(error.response?.data?.message || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const resetFlow = () => {
        setSelectedTemplateId("");
        setSelectedTemplate(null);
        setFile(null);
        setUploadResult(null);
        setValidationResult(null);
        setStep(1);
    };

    return (
        <div className="p-6 space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Data Filling & Upload</h1>
                {step > 1 && (
                    <Button variant="outline" onClick={resetFlow}>
                        Start New Upload
                    </Button>
                )}
            </div>

            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-4">
                <StepIndicator
                    step={1}
                    currentStep={step}
                    label="Select Template"
                    icon={<FileSpreadsheet className="h-4 w-4" />}
                />
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <StepIndicator
                    step={2}
                    currentStep={step}
                    label="Download & Fill"
                    icon={<Download className="h-4 w-4" />}
                />
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <StepIndicator
                    step={3}
                    currentStep={step}
                    label="Upload Data"
                    icon={<Upload className="h-4 w-4" />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Template Selection & Download */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Step 1: Template Selection */}
                    <Card className={step >= 1 ? "border-primary/50" : ""}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">1</span>
                                Select Template
                            </CardTitle>
                            <CardDescription>Choose a template to download and fill with data.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Available Templates</label>
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
                                <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold">{selectedTemplate.template_name}</h3>
                                            <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                                        </div>
                                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                            v{selectedTemplate.version}
                                        </span>
                                    </div>

                                    {/* Template Details Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Columns className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <div className="text-muted-foreground">Columns</div>
                                                <div className="font-medium">{selectedTemplate.metadata?.total_columns || 0}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calculator className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <div className="text-muted-foreground">Formulas</div>
                                                <div className="font-medium">{selectedTemplate.metadata?.formula_cells?.length || 0}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <div className="text-muted-foreground">ID Column</div>
                                                <div className="font-medium">
                                                    {selectedTemplate.employee_field_mapping?.employeeIdColumn !== undefined &&
                                                        selectedTemplate.employee_field_mapping?.employeeIdColumn >= 0
                                                        ? String.fromCharCode(65 + selectedTemplate.employee_field_mapping.employeeIdColumn)
                                                        : "Not set"}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FileCheck className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <div className="text-muted-foreground">Data Start</div>
                                                <div className="font-medium">Row {(selectedTemplate.data_start_row || 0) + 1}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Column Mappings */}
                                    {selectedTemplate.column_mappings && selectedTemplate.column_mappings.length > 0 && (
                                        <div className="mt-4">
                                            <h4 className="text-sm font-medium mb-2">Column Mappings</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedTemplate.column_mappings.slice(0, 8).map((cm, idx) => (
                                                    <span
                                                        key={idx}
                                                        className={`text-xs px-2 py-1 rounded ${cm.mappedField
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                                            }`}
                                                    >
                                                        {cm.columnName}: {cm.headerName}
                                                        {cm.mappedField && ` → ${cm.mappedField}`}
                                                    </span>
                                                ))}
                                                {selectedTemplate.column_mappings.length > 8 && (
                                                    <span className="text-xs text-muted-foreground">
                                                        +{selectedTemplate.column_mappings.length - 8} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <Button onClick={handleDownload} className="w-full mt-4">
                                        <Download className="mr-2 h-4 w-4" /> Download Template
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Step 2 & 3: Upload Section */}
                    <Card className={step >= 3 ? "border-primary/50" : ""}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                    }`}>3</span>
                                Upload Filled Data
                            </CardTitle>
                            <CardDescription>
                                {!selectedTemplateId
                                    ? "Please select a template first"
                                    : "Upload the filled Excel file to import data."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {!selectedTemplateId ? (
                                <div className="flex items-center gap-2 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-700 dark:text-amber-400">
                                    <AlertTriangle className="h-5 w-5" />
                                    <span>You must select a template before uploading data.</span>
                                </div>
                            ) : (
                                <>
                                    <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors">
                                        <FileSpreadsheet className="h-10 w-10 text-muted-foreground mb-2" />
                                        <input
                                            type="file"
                                            accept=".xlsx, .xls"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            id="file-upload"
                                            disabled={!selectedTemplateId}
                                        />
                                        <label
                                            htmlFor="file-upload"
                                            className={`cursor-pointer text-sm font-medium ${selectedTemplateId ? "text-primary hover:underline" : "text-muted-foreground"
                                                }`}
                                        >
                                            {file ? file.name : "Click to select Excel file"}
                                        </label>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Supported formats: .xlsx, .xls
                                        </p>
                                    </div>

                                    {/* Validation Result */}
                                    {validating && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                                            Validating file...
                                        </div>
                                    )}

                                    {validationResult && !validating && (
                                        <div className={`p-4 rounded-lg ${validationResult.isValid
                                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                                            }`}>
                                            <div className={`flex items-center gap-2 font-medium ${validationResult.isValid ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                                                }`}>
                                                {validationResult.isValid
                                                    ? <CheckCircle className="h-4 w-4" />
                                                    : <AlertTriangle className="h-4 w-4" />
                                                }
                                                {validationResult.isValid ? 'File validated successfully' : 'Validation failed'}
                                            </div>

                                            {validationResult.rowCount && (
                                                <p className="text-sm mt-2">
                                                    Found {validationResult.rowCount} data rows, {validationResult.columnCount} columns
                                                </p>
                                            )}

                                            {validationResult.errors?.length > 0 && (
                                                <ul className="text-sm mt-2 list-disc list-inside">
                                                    {validationResult.errors.map((err: string, idx: number) => (
                                                        <li key={idx} className="text-red-600 dark:text-red-400">{err}</li>
                                                    ))}
                                                </ul>
                                            )}

                                            {validationResult.warnings?.length > 0 && (
                                                <ul className="text-sm mt-2 list-disc list-inside">
                                                    {validationResult.warnings.map((warn: string, idx: number) => (
                                                        <li key={idx} className="text-amber-600 dark:text-amber-400">{warn}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    )}

                                    <Button
                                        onClick={handleUpload}
                                        disabled={!file || !selectedTemplateId || uploading || (validationResult && !validationResult.isValid)}
                                        className="w-full"
                                    >
                                        {uploading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="mr-2 h-4 w-4" /> Upload Data
                                            </>
                                        )}
                                    </Button>

                                    {/* Upload Result */}
                                    {uploadResult && (
                                        <div className="mt-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                            <div className="flex items-center text-green-800 dark:text-green-400 font-medium mb-3">
                                                <CheckCircle className="h-5 w-5 mr-2" /> Upload Successful
                                            </div>

                                            <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                                                <div className="bg-white dark:bg-gray-800 p-3 rounded">
                                                    <div className="text-muted-foreground">Total Rows</div>
                                                    <div className="text-xl font-bold">{uploadResult.totalRows}</div>
                                                </div>
                                                <div className="bg-white dark:bg-gray-800 p-3 rounded">
                                                    <div className="text-green-600">Successful</div>
                                                    <div className="text-xl font-bold text-green-600">{uploadResult.successCount}</div>
                                                </div>
                                                <div className="bg-white dark:bg-gray-800 p-3 rounded">
                                                    <div className="text-red-600">Errors</div>
                                                    <div className="text-xl font-bold text-red-600">{uploadResult.errorCount}</div>
                                                </div>
                                            </div>

                                            <div className="text-sm space-y-1">
                                                <p>Batch ID: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{uploadResult.uploadBatchId.substring(0, 12)}...</code></p>
                                                <p>Template: {uploadResult.templateName}</p>
                                            </div>

                                            {uploadResult.formulasApplied !== undefined && uploadResult.formulasApplied > 0 && (
                                                <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/30 rounded text-blue-700 dark:text-blue-400 text-sm">
                                                    <div className="font-medium flex items-center gap-1">
                                                        <Calculator className="h-4 w-4" /> Formulas Calculated
                                                    </div>
                                                    <p className="mt-1">{uploadResult.formulasApplied} formula columns were automatically calculated</p>
                                                </div>
                                            )}

                                            {uploadResult.errors && uploadResult.errors.length > 0 && (
                                                <div className="mt-3 max-h-40 overflow-y-auto text-sm bg-red-50 dark:bg-red-900/30 p-2 rounded">
                                                    <div className="font-medium text-red-700 dark:text-red-400 mb-1">Error Details:</div>
                                                    {uploadResult.errors.map((err, idx) => (
                                                        <div key={idx} className="text-red-600 dark:text-red-400">
                                                            Row {err.row}: {err.message}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {uploadResult.processedRecords && uploadResult.processedRecords.length > 0 && (
                                                <details className="mt-3">
                                                    <summary className="cursor-pointer text-sm font-medium text-primary">
                                                        View Processed Records ({uploadResult.processedRecords.length})
                                                    </summary>
                                                    <div className="mt-2 max-h-60 overflow-y-auto text-sm">
                                                        <table className="w-full">
                                                            <thead className="bg-gray-50 dark:bg-gray-800">
                                                                <tr>
                                                                    <th className="px-2 py-1 text-left">Row</th>
                                                                    <th className="px-2 py-1 text-left">Employee ID</th>
                                                                    <th className="px-2 py-1 text-left">Name</th>
                                                                    <th className="px-2 py-1 text-left">Status</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y">
                                                                {uploadResult.processedRecords.map((result, idx) => (
                                                                    <tr key={idx}>
                                                                        <td className="px-2 py-1">{result.row}</td>
                                                                        <td className="px-2 py-1">{result.employeeId}</td>
                                                                        <td className="px-2 py-1">{result.employeeName}</td>
                                                                        <td className="px-2 py-1">
                                                                            <span className="text-green-600 dark:text-green-400">✓</span>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </details>
                                            )}

                                            <Button
                                                className="w-full mt-4"
                                                onClick={() => navigate(`/viewUploadedData?batchId=${uploadResult.uploadBatchId}`)}
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                View Uploaded Data
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Upload History */}
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <History className="mr-2 h-5 w-5" /> Upload History
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-auto max-h-[600px]">
                            {history.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <History className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                    <p>No upload history found.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {history.map((item) => (
                                        <div
                                            key={item._id}
                                            className="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="font-medium text-sm">
                                                    {item.templateId?.template_name || "Unknown Template"}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {new Date(item.uploadedAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className="flex gap-4 text-xs mb-2">
                                                <span className="text-green-600">
                                                    ✓ {item.successCount} success
                                                </span>
                                                {item.errorCount > 0 && (
                                                    <span className="text-red-600">
                                                        ✗ {item.errorCount} errors
                                                    </span>
                                                )}
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="w-full mt-2"
                                                onClick={() => navigate(`/viewUploadedData?batchId=${item._id}`)}
                                            >
                                                <Eye className="h-3 w-3 mr-2" />
                                                View Data
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Step Indicator Component
function StepIndicator({
    step,
    currentStep,
    label,
    icon
}: {
    step: number;
    currentStep: number;
    label: string;
    icon: React.ReactNode;
}) {
    const isActive = currentStep >= step;
    const isCurrent = currentStep === step;

    return (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isCurrent
            ? 'bg-primary text-primary-foreground'
            : isActive
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground'
            }`}>
            {icon}
            <span className="text-sm font-medium hidden sm:inline">{label}</span>
        </div>
    );
}
