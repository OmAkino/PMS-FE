import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
import uploadExcelService from "@/service/uploadExcel.service";
import {
    Download,
    ArrowLeft,
    FileSpreadsheet,
    Users,
    Calendar,
    CheckCircle,
    Loader2,
    RefreshCw,
    Info,
    Calculator,
    Grid,
} from "lucide-react";

interface EmployeeData {
    rowNumber: number;
    employee: {
        id: string;
        name: string;
        email: string;
        designation: string;
        department: string;
        division?: string;
    } | null;
    data: Record<string, any>;
    calculatedData?: Record<string, any>;
    status: string;
    createdAt: string;
}

interface TemplateInfo {
    _id: string;
    template_name: string;
    description?: string;
    version: string;
    column_mappings: Array<{
        columnIndex: number;
        columnName: string;
        headerName: string;
        mappedField: string | null;
        dataType: string;
        isRequired: boolean;
    }>;
    formula_definitions?: Array<{
        cellAddress: string;
        formula: string;
        description?: string;
    }>;
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

interface CellDefinition {
    row: number;
    col: number;
    address: string;
    value: string | number | null;
    formula: string | null;
    type: 'header' | 'formula' | 'data' | 'metadata';
    is_locked: boolean;
    data_type: string;
}

interface TemplateStructure {
    _id: string;
    template_name: string;
    description: string;
    version: string;
    sheet_structure: CellDefinition[];
    metadata: {
        total_rows: number;
        total_columns: number;
        formula_rows: number[];
        data_input_ranges: string[];
        protected_ranges: string[];
    };
    is_active: boolean;
}

interface ApiResponse {
    records: EmployeeData[];
    template: TemplateInfo | null;
}

export default function ViewUploadedDataPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const batchId = searchParams.get("batchId");

    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [employeeData, setEmployeeData] = useState<EmployeeData[]>([]);
    const [template, setTemplate] = useState<TemplateInfo | null>(null);
    const [batchInfo, setBatchInfo] = useState<any>(null);

    // Template visualization states
    const [showTemplateView, setShowTemplateView] = useState(false);
    const [templateStructure, setTemplateStructure] = useState<TemplateStructure | null>(null);
    const [loadingTemplate, setLoadingTemplate] = useState(false);

    useEffect(() => {
        if (batchId) {
            fetchUploadedData();
        } else {
            toast.error("No batch ID provided");
            navigate("/dataFilling");
        }
    }, [batchId]);

    const fetchUploadedData = async () => {
        if (!batchId) return;

        setLoading(true);
        try {
            const response = await axiosInstance.get(`/data-filling/batch/${batchId}/calculated`);
            const apiData: ApiResponse = response.data.data;

            setEmployeeData(apiData.records || []);
            setTemplate(apiData.template);

            // Get batch info from history
            const historyResponse = await axiosInstance.get("/data-filling/history");
            const batch = historyResponse.data.data.find((h: any) => h._id === batchId);
            setBatchInfo(batch);
        } catch (error: any) {
            console.error("Failed to fetch uploaded data", error);
            toast.error(error.response?.data?.message || "Failed to fetch uploaded data");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadExcel = async () => {
        if (!batchId) return;

        setDownloading(true);
        try {
            const response = await axiosInstance.get(`/data-filling/batch/${batchId}/export`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const filename = template?.template_name
                ? `${template.template_name}_${new Date().toISOString().split('T')[0]}.xlsx`
                : `employee_data_${batchId.substring(0, 8)}.xlsx`;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success("Excel file downloaded successfully!");
        } catch (error: any) {
            console.error("Failed to download Excel", error);
            toast.error(error.response?.data?.message || "Failed to download Excel file");
        } finally {
            setDownloading(false);
        }
    };

    const handleLoadTemplateStructure = async () => {
        if (!template) {
            toast.error("No template information available");
            return;
        }

        setLoadingTemplate(true);
        try {
            const response = await uploadExcelService.searchTemplateByName(template.template_name);
            console.log("Template structure response:", response);

            const templateData = response.data || response;
            if (!templateData) {
                throw new Error("No template data received");
            }

            setTemplateStructure(templateData);
            setShowTemplateView(true);
            toast.success("Template structure loaded successfully!");
        } catch (error: any) {
            console.error("Failed to load template structure", error);
            toast.error(error.response?.data?.message || "Failed to load template structure");
        } finally {
            setLoadingTemplate(false);
        }
    };

    const getCellValue = (cellData: any) => {
        // Handle formula cells
        if (cellData && typeof cellData === 'object' && cellData.calculatedValue !== undefined) {
            return cellData.calculatedValue;
        }
        return cellData !== undefined && cellData !== null ? cellData : '';
    };

    const isFormulaCell = (headerName: string) => {
        if (!template?.formula_definitions) return false;

        const columnIndex = template.column_mappings?.findIndex(cm => cm.headerName === headerName);
        if (columnIndex === -1) return false;

        return template.formula_definitions.some(fd => {
            // Check if this formula definition applies to this column
            const colLetter = String.fromCharCode(65 + columnIndex);
            return fd.cellAddress.startsWith(colLetter);
        });
    };

    const getColumnLetter = (index: number): string => {
        return String.fromCharCode(65 + index);
    };

    const renderExcelGrid = () => {
        if (!templateStructure) return null;

        const { sheet_structure, metadata } = templateStructure;
        const total_rows = metadata?.total_rows || 0;
        const total_columns = metadata?.total_columns || 0;

        if (!sheet_structure || !Array.isArray(sheet_structure)) {
            return (
                <div className="text-red-500 p-4 bg-red-50 rounded">
                    No sheet structure data available for this template.
                </div>
            );
        }

        if (total_rows === 0 || total_columns === 0) {
            return (
                <div className="text-yellow-500 p-4 bg-yellow-50 rounded">
                    Template dimensions are not defined.
                </div>
            );
        }

        // Create a 2D array to represent the Excel grid
        const grid: (CellDefinition | null)[][] = Array.from({ length: total_rows }, () =>
            Array.from({ length: total_columns }, () => null)
        );

        // Populate the grid with cell data
        sheet_structure.forEach(cell => {
            if (cell && cell.row < total_rows && cell.col < total_columns) {
                grid[cell.row][cell.col] = cell;
            }
        });

        return (
            <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Template Structure: {templateStructure.template_name}</h3>

                {/* Template Info */}
                <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                        <p><strong>Template Name:</strong> {templateStructure.template_name}</p>
                        <p><strong>Description:</strong> {templateStructure.description}</p>
                        <p><strong>Version:</strong> {templateStructure.version}</p>
                        <p><strong>Grid Size:</strong> {total_rows} rows × {total_columns} columns</p>
                        <p><strong>Data Input Cells:</strong> {metadata?.data_input_ranges?.length || 0}</p>
                        <p><strong>Formula Cells:</strong> {metadata?.formula_rows?.length || 0}</p>
                    </div>
                </div>

                {/* Excel-like Grid */}
                <div className="overflow-auto border border-gray-300 rounded-lg" style={{ maxHeight: '500px' }}>
                    <table className="min-w-full border-collapse">
                        <tbody>
                            {grid.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    {row.map((cell, colIndex) => (
                                        <td
                                            key={colIndex}
                                            className={`
                                                border border-gray-300 p-2 min-w-20 max-w-40 truncate text-xs
                                                ${cell?.type === 'header' ? 'bg-blue-100 dark:bg-blue-900/40 font-semibold' : ''}
                                                ${cell?.type === 'formula' ? 'bg-green-100 dark:bg-green-900/30 italic' : ''}
                                                ${cell?.type === 'metadata' ? 'bg-yellow-100 dark:bg-yellow-900/30' : ''}
                                                ${cell?.type === 'data' ? 'bg-white dark:bg-gray-800' : ''}
                                                ${cell?.is_locked ? 'cursor-not-allowed opacity-75' : 'cursor-cell'}
                                            `}
                                            title={cell?.formula ? `Formula: ${cell.formula}` : cell?.value?.toString()}
                                        >
                                            {cell ? (
                                                <div>
                                                    <div className="font-mono text-gray-500 dark:text-gray-400 text-xs">
                                                        {cell.address}
                                                    </div>
                                                    <div className="truncate">
                                                        {cell.formula ? `=${cell.formula}` : cell.value?.toString() || ''}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-gray-300">—</span>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Cell Type Legend */}
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center">
                        <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900/40 mr-2 border"></div>
                        <span>Header</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-4 h-4 bg-green-100 dark:bg-green-900/30 mr-2 border"></div>
                        <span>Formula</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-4 h-4 bg-yellow-100 dark:bg-yellow-900/30 mr-2 border"></div>
                        <span>Metadata</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-4 h-4 bg-white dark:bg-gray-800 mr-2 border"></div>
                        <span>Data Input</span>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground">Loading template and data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/dataFilling")}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Data Filling
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">
                            {template?.template_name || "View Uploaded Data"}
                        </h1>
                        {template?.description && (
                            <p className="text-sm text-muted-foreground">
                                {template.description}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={fetchUploadedData}
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleLoadTemplateStructure}
                        disabled={loadingTemplate || !template}
                    >
                        {loadingTemplate ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            <>
                                <Grid className="h-4 w-4 mr-2" />
                                {showTemplateView ? 'Hide' : 'View'} Template
                            </>
                        )}
                    </Button>
                    <Button
                        onClick={handleDownloadExcel}
                        disabled={downloading || employeeData.length === 0}
                    >
                        {downloading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Downloading...
                            </>
                        ) : (
                            <>
                                <Download className="h-4 w-4 mr-2" />
                                Download Excel
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Template Information Banner */}
            {template && (
                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            Template Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground">Version:</span>
                                <span className="ml-2 font-medium">v{template.version}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Total Columns:</span>
                                <span className="ml-2 font-medium">{template.column_mappings?.length || 0}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Formula Columns:</span>
                                <span className="ml-2 font-medium text-blue-600">
                                    {template.formula_definitions?.length || 0}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Data Rows:</span>
                                <span className="ml-2 font-medium">{employeeData.length}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            Total Employees
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{employeeData.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                            Template Columns
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{template?.column_mappings?.length || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Calculator className="h-4 w-4 text-blue-600" />
                            Formula Columns
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {template?.formula_definitions?.length || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            Uploaded On
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm font-medium">
                            {batchInfo?.uploadedAt
                                ? new Date(batchInfo.uploadedAt).toLocaleDateString()
                                : "N/A"}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Data Table in Template Format */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Template Data View</CardTitle>
                            <CardDescription>
                                Showing data in original template format
                                {template?.formula_definitions && template.formula_definitions.length > 0 && (
                                    <span className="ml-2 text-blue-600">
                                        • Blue columns contain formulas
                                    </span>
                                )}
                            </CardDescription>
                        </div>
                        <div className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            All Data Processed
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {employeeData.length === 0 ? (
                        <div className="text-center py-12">
                            <FileSpreadsheet className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <p className="text-muted-foreground">No data found for this batch</p>
                        </div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden">
                            <div className="overflow-x-auto" style={{ maxHeight: '600px' }}>
                                <table className="w-full text-sm">
                                    <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-4 py-3 text-center font-semibold border-r bg-gray-100 dark:bg-gray-800 w-12">
                                                #
                                            </th>
                                            {template?.column_mappings?.map((column, idx) => {
                                                const isFormula = isFormulaCell(column.headerName);
                                                return (
                                                    <th
                                                        key={idx}
                                                        className={`px-4 py-3 text-left font-semibold border-r min-w-[120px] whitespace-nowrap ${isFormula
                                                            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200'
                                                            : ''
                                                            }`}
                                                        title={isFormula ? `Formula column (${getColumnLetter(idx)})` : ''}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-muted-foreground font-normal">
                                                                {getColumnLetter(idx)}
                                                            </span>
                                                            <span>{column.headerName}</span>
                                                            {isFormula && (
                                                                <Calculator className="h-3 w-3 text-blue-600" />
                                                            )}
                                                        </div>
                                                    </th>
                                                );
                                            })}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {employeeData.map((record, rowIdx) => (
                                            <tr
                                                key={rowIdx}
                                                className="hover:bg-muted/30 transition-colors"
                                            >
                                                <td className="px-4 py-3 border-r font-medium text-center text-muted-foreground bg-gray-50 dark:bg-gray-900/50">
                                                    {rowIdx + 1}
                                                </td>
                                                {template?.column_mappings?.map((column, colIdx) => {
                                                    const cellValue = getCellValue(record.data[column.headerName]);
                                                    const isFormula = record.data[column.headerName] &&
                                                        typeof record.data[column.headerName] === 'object' &&
                                                        record.data[column.headerName].formula;
                                                    const formulaText = isFormula ? record.data[column.headerName].formula : null;

                                                    return (
                                                        <td
                                                            key={colIdx}
                                                            className={`px-4 py-3 border-r ${isFormula
                                                                ? 'bg-blue-50 dark:bg-blue-900/10 font-medium'
                                                                : ''
                                                                }`}
                                                            title={formulaText ? `Formula: ${formulaText}` : ''}
                                                        >
                                                            {typeof cellValue === 'number'
                                                                ? cellValue.toLocaleString()
                                                                : cellValue}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Formula Legend */}
            {template?.formula_definitions && template.formula_definitions.length > 0 && (
                <Card className="bg-blue-50/50 dark:bg-blue-900/10">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Calculator className="h-4 w-4" />
                            Formula Definitions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            {template.formula_definitions.map((formula, idx) => (
                                <div key={idx} className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                                    <div className="font-medium text-blue-600 mb-1">
                                        Cell {formula.cellAddress}
                                    </div>
                                    <code className="text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">
                                        {formula.formula}
                                    </code>
                                    {formula.description && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {formula.description}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Template Structure Viewer */}
            {showTemplateView && templateStructure && (
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <FileSpreadsheet className="h-5 w-5" />
                                Template Structure Visualization
                            </CardTitle>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowTemplateView(false)}
                            >
                                Close
                            </Button>
                        </div>
                        <CardDescription>
                            Visualize the exact template format with formulas, headers, and data cells
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {renderExcelGrid()}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
