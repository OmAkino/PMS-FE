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
import {
    Upload,
    FileSpreadsheet,
    Trash2,
    Download,
    Plus,
    ChevronDown,
    ChevronUp,
    Calculator,
    Columns,
    Users,
    Calendar,
    CheckCircle
} from "lucide-react";

interface ColumnMapping {
    columnIndex: number;
    columnName: string;
    headerName: string;
    mappedField: string | null;
    dataType: string;
    isRequired: boolean;
}

interface FormulaDefinition {
    cellAddress: string;
    formula: string;
    dependentCells: string[];
    resultType: string;
}

interface Template {
    _id: string;
    template_name: string;
    description?: string;
    version: string;
    createdAt: string;
    column_mappings?: ColumnMapping[];
    formula_definitions?: FormulaDefinition[];
    employee_field_mapping?: {
        employeeIdColumn: number;
        nameColumn?: number;
        emailColumn?: number;
        designationColumn?: number;
        departmentColumn?: number;
    };
    header_row_index?: number;
    data_start_row?: number;
    metadata?: {
        total_rows: number;
        total_columns: number;
        formula_cells?: string[];
        data_input_ranges?: string[];
    };
}

export default function TemplateManagementPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadForm, setUploadForm] = useState({
        templateName: "",
        description: "",
        file: null as File | null
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get("/excel/templates");
            setTemplates(response.data.data);
        } catch (error) {
            console.error("Failed to fetch templates", error);
            toast.error("Failed to fetch templates");
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploadForm(prev => ({ ...prev, file: e.target.files![0] }));
        }
    };

    const handleUpload = async () => {
        if (!uploadForm.file) {
            toast.error("Please select a file");
            return;
        }

        const formData = new FormData();
        formData.append("file", uploadForm.file);
        if (uploadForm.templateName) {
            formData.append("templateName", uploadForm.templateName);
        }
        if (uploadForm.description) {
            formData.append("description", uploadForm.description);
        }

        setUploading(true);
        try {
            const response = await axiosInstance.post("/excel/uploadHeaderExcel", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            toast.success("Template uploaded successfully!");
            setShowUploadModal(false);
            setUploadForm({ templateName: "", description: "", file: null });
            fetchTemplates();

            // Show upload result
            const result = response.data.data;
            toast.success(
                `Template "${result.template_name}" created with ${result.total_cells} cells, ${result.formula_cells} formulas`,
                { duration: 5000 }
            );
        } catch (error: any) {
            console.error("Upload failed", error);
            toast.error(error.response?.data?.message || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (templateId: string, templateName: string) => {
        try {
            const response = await axiosInstance.get(`/excel/download/${templateId}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${templateName}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success("Template downloaded successfully!");
        } catch (error) {
            console.error("Failed to download template", error);
            toast.error("Failed to download template");
        }
    };

    const handleDelete = async (templateId: string) => {
        if (!confirm("Are you sure you want to delete this template?")) return;

        try {
            await axiosInstance.delete(`/excel/template/${templateId}`);
            toast.success("Template deleted successfully!");
            fetchTemplates();
        } catch (error) {
            console.error("Failed to delete template", error);
            toast.error("Failed to delete template");
        }
    };

    const toggleExpand = (templateId: string) => {
        setExpandedTemplate(expandedTemplate === templateId ? null : templateId);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Template Management</h1>
                    <p className="text-muted-foreground">Upload and manage Excel templates with formulas and column mappings</p>
                </div>
                <Button onClick={() => setShowUploadModal(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Upload New Template
                </Button>
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-lg mx-4">
                        <CardHeader>
                            <CardTitle>Upload Excel Template</CardTitle>
                            <CardDescription>
                                Upload an Excel file with headers, formulas, and data structure.
                                The system will automatically detect column mappings and formulas.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Template Name (Optional)</label>
                                <input
                                    type="text"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    placeholder="e.g., PMS-APAC-2024"
                                    value={uploadForm.templateName}
                                    onChange={(e) => setUploadForm(prev => ({ ...prev, templateName: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Description (Optional)</label>
                                <textarea
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    placeholder="Describe this template..."
                                    value={uploadForm.description}
                                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Excel File *</label>
                                <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors">
                                    <FileSpreadsheet className="h-10 w-10 text-muted-foreground mb-2" />
                                    <input
                                        type="file"
                                        accept=".xlsx, .xls"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        id="template-upload"
                                    />
                                    <label
                                        htmlFor="template-upload"
                                        className="cursor-pointer text-sm font-medium text-primary hover:underline"
                                    >
                                        {uploadForm.file ? uploadForm.file.name : "Click to select Excel file"}
                                    </label>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Supported formats: .xlsx, .xls
                                    </p>
                                </div>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm">
                                <p className="font-medium text-blue-800 dark:text-blue-400 mb-1">What will be detected:</p>
                                <ul className="text-blue-700 dark:text-blue-300 text-xs space-y-1 list-disc list-inside">
                                    <li>Column headers and their mappings to employee fields</li>
                                    <li>Excel formulas with cell dependencies</li>
                                    <li>Data input ranges and protected cells</li>
                                    <li>Employee ID column for data matching</li>
                                </ul>
                            </div>

                            <div className="flex gap-3 justify-end pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowUploadModal(false);
                                        setUploadForm({ templateName: "", description: "", file: null });
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleUpload}
                                    disabled={!uploadForm.file || uploading}
                                >
                                    {uploading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="mr-2 h-4 w-4" /> Upload Template
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Templates List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                </div>
            ) : templates.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="font-medium text-lg mb-2">No templates yet</h3>
                        <p className="text-muted-foreground mb-4">Upload your first Excel template to get started</p>
                        <Button onClick={() => setShowUploadModal(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Upload Template
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {templates.map((template) => (
                        <Card key={template._id} className="overflow-hidden">
                            <div className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold">{template.template_name}</h3>
                                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                                v{template.version}
                                            </span>
                                        </div>
                                        {template.description && (
                                            <p className="text-sm text-muted-foreground">{template.description}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleExpand(template._id)}
                                        >
                                            {expandedTemplate === template._id ? (
                                                <ChevronUp className="h-4 w-4" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDownload(template._id, template.template_name)}
                                        >
                                            <Download className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleDelete(template._id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Template Stats */}
                                <div className="flex flex-wrap gap-4 mt-3 text-sm">
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <Columns className="h-4 w-4" />
                                        <span>{template.metadata?.total_columns || 0} columns</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <Calculator className="h-4 w-4" />
                                        <span>{template.metadata?.formula_cells?.length || 0} formulas</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <Users className="h-4 w-4" />
                                        <span>
                                            ID Col: {template.employee_field_mapping?.employeeIdColumn !== undefined &&
                                                template.employee_field_mapping?.employeeIdColumn >= 0
                                                ? String.fromCharCode(65 + template.employee_field_mapping.employeeIdColumn)
                                                : "Not detected"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <span>{new Date(template.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedTemplate === template._id && (
                                <div className="border-t bg-muted/30 p-4 space-y-4">
                                    {/* Column Mappings */}
                                    {template.column_mappings && template.column_mappings.length > 0 && (
                                        <div>
                                            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                                                <Columns className="h-4 w-4" /> Column Mappings
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {template.column_mappings.map((cm, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${cm.mappedField
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                                            }`}
                                                    >
                                                        <span className="font-mono font-medium">{cm.columnName}</span>
                                                        <span>: {cm.headerName}</span>
                                                        {cm.mappedField && (
                                                            <>
                                                                <span className="text-green-600">→</span>
                                                                <span className="font-medium">{cm.mappedField}</span>
                                                            </>
                                                        )}
                                                        {cm.isRequired && (
                                                            <span className="text-red-500">*</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Formula Definitions */}
                                    {template.formula_definitions && template.formula_definitions.length > 0 && (
                                        <div>
                                            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                                                <Calculator className="h-4 w-4" /> Formula Cells
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                {template.formula_definitions.slice(0, 9).map((fd, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="text-xs bg-blue-50 dark:bg-blue-900/20 p-2 rounded"
                                                    >
                                                        <span className="font-mono font-medium text-blue-800 dark:text-blue-400">
                                                            {fd.cellAddress}
                                                        </span>
                                                        <span className="text-blue-600 dark:text-blue-300 ml-1">
                                                            = {fd.formula.length > 30 ? fd.formula.substring(0, 30) + '...' : fd.formula}
                                                        </span>
                                                    </div>
                                                ))}
                                                {template.formula_definitions.length > 9 && (
                                                    <div className="text-xs text-muted-foreground flex items-center">
                                                        +{template.formula_definitions.length - 9} more formulas
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Employee Field Mapping */}
                                    <div>
                                        <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                                            <Users className="h-4 w-4" /> Employee Field Mapping
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {template.employee_field_mapping?.employeeIdColumn !== undefined &&
                                                template.employee_field_mapping.employeeIdColumn >= 0 && (
                                                    <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 px-2 py-1 rounded flex items-center gap-1">
                                                        <CheckCircle className="h-3 w-3" />
                                                        Employee ID: Column {String.fromCharCode(65 + template.employee_field_mapping.employeeIdColumn)}
                                                    </span>
                                                )}
                                            {template.employee_field_mapping?.nameColumn !== undefined && (
                                                <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 px-2 py-1 rounded">
                                                    Name: Column {String.fromCharCode(65 + template.employee_field_mapping.nameColumn)}
                                                </span>
                                            )}
                                            {template.employee_field_mapping?.emailColumn !== undefined && (
                                                <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 px-2 py-1 rounded">
                                                    Email: Column {String.fromCharCode(65 + template.employee_field_mapping.emailColumn)}
                                                </span>
                                            )}
                                            {template.employee_field_mapping?.designationColumn !== undefined && (
                                                <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 px-2 py-1 rounded">
                                                    Designation: Column {String.fromCharCode(65 + template.employee_field_mapping.designationColumn)}
                                                </span>
                                            )}
                                            {template.employee_field_mapping?.departmentColumn !== undefined && (
                                                <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 px-2 py-1 rounded">
                                                    Department: Column {String.fromCharCode(65 + template.employee_field_mapping.departmentColumn)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Row Info */}
                                    <div className="text-xs text-muted-foreground flex gap-4">
                                        <span>Header Row: {(template.header_row_index ?? 0) + 1}</span>
                                        <span>Data Start Row: {(template.data_start_row ?? 1) + 1}</span>
                                        <span>Total Rows: {template.metadata?.total_rows || 0}</span>
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
