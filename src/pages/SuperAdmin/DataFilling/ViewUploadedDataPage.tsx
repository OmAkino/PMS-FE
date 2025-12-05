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
    Calculator,
    Grid,
    Eye,
    EyeOff,
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
    const [templateStructure, setTemplateStructure] = useState<TemplateStructure | null>(null);
    const [loadingTemplate, setLoadingTemplate] = useState(false);
    const [showFormulas, setShowFormulas] = useState(false);

    useEffect(() => {
        if (batchId) {
            fetchUploadedData();
        } else {
            toast.error("No batch ID provided");
            navigate("/dataFilling");
        }
    }, [batchId]);

    // Auto-load template structure when template is available
    useEffect(() => {
        if (template && !templateStructure) {
            loadTemplateStructure();
        }
    }, [template]);

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

    const loadTemplateStructure = async () => {
        if (!template) return;

        setLoadingTemplate(true);
        try {
            const response = await uploadExcelService.searchTemplateByName(template.template_name);
            const templateData = response.data || response;
            if (templateData) {
                setTemplateStructure(templateData);
            }
        } catch (error: any) {
            console.error("Failed to load template structure", error);
        } finally {
            setLoadingTemplate(false);
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

    const getColumnLetter = (index: number): string => {
        let result = '';
        let num = index;
        while (num >= 0) {
            result = String.fromCharCode(65 + (num % 26)) + result;
            num = Math.floor(num / 26) - 1;
        }
        return result;
    };

    const getCellValue = (cellData: any) => {
        if (cellData && typeof cellData === 'object' && cellData.calculatedValue !== undefined) {
            return cellData.calculatedValue;
        }
        return cellData !== undefined && cellData !== null ? cellData : '';
    };

    const isFormulaColumn = (colIndex: number): boolean => {
        if (!template?.formula_definitions) return false;
        const colLetter = getColumnLetter(colIndex);
        return template.formula_definitions.some(fd => fd.cellAddress.startsWith(colLetter));
    };

    const getFormulaForColumn = (colIndex: number): string | null => {
        if (!template?.formula_definitions) return null;
        const colLetter = getColumnLetter(colIndex);
        const formula = template.formula_definitions.find(fd => fd.cellAddress.startsWith(colLetter));
        return formula ? formula.formula : null;
    };

    // Build the complete Excel-like grid with template structure + data
    const buildExcelGrid = () => {
        if (!template || !templateStructure) return null;

        const { sheet_structure, metadata } = templateStructure;
        const headerRow = template.header_row_index || 0;
        const dataStartRow = template.data_start_row || 1;
        const totalColumns = metadata?.total_columns || template.column_mappings?.length || 0;

        // Calculate total rows: template rows + uploaded data rows
        const templateRows = dataStartRow; // Rows before data (headers, metadata)
        const dataRows = employeeData.length;
        const totalRows = templateRows + dataRows;

        // Create cell lookup from template structure
        const templateCells: Map<string, CellDefinition> = new Map();
        sheet_structure?.forEach(cell => {
            templateCells.set(`${cell.row}-${cell.col}`, cell);
        });

        return (
            <div className="border-2 border-gray-400 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                {/* Excel-like header bar */}
                <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5" />
                        <span className="font-semibold">{template.template_name}</span>
                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded">v{template.version}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                        <span>{totalColumns} columns</span>
                        <span>•</span>
                        <span>{totalRows} rows</span>
                        <span>•</span>
                        <span>{dataRows} data rows</span>
                    </div>
                </div>

                {/* Excel grid */}
                <div className="overflow-auto" style={{ maxHeight: '70vh' }}>
                    <table className="w-full border-collapse" style={{ minWidth: `${totalColumns * 120}px` }}>
                        {/* Column headers (A, B, C...) */}
                        <thead className="sticky top-0 z-20">
                            <tr className="bg-gray-200 dark:bg-gray-700">
                                {/* Row number header */}
                                <th className="w-12 min-w-12 border border-gray-400 bg-gray-300 dark:bg-gray-600 text-center text-xs font-bold p-1 sticky left-0 z-30">

                                </th>
                                {/* Column letters */}
                                {Array.from({ length: totalColumns }).map((_, colIndex) => {
                                    const isFormula = isFormulaColumn(colIndex);
                                    return (
                                        <th
                                            key={colIndex}
                                            className={`min-w-28 border border-gray-400 text-center text-xs font-bold p-1 ${isFormula
                                                    ? 'bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100'
                                                    : 'bg-gray-300 dark:bg-gray-600'
                                                }`}
                                        >
                                            <div className="flex items-center justify-center gap-1">
                                                {getColumnLetter(colIndex)}
                                                {isFormula && <Calculator className="h-3 w-3" />}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {/* Template header rows (before data) */}
                            {Array.from({ length: templateRows }).map((_, rowIndex) => (
                                <tr key={`template-${rowIndex}`} className="bg-blue-50 dark:bg-blue-900/20">
                                    {/* Row number */}
                                    <td className="border border-gray-400 bg-gray-200 dark:bg-gray-700 text-center text-xs font-bold p-1 sticky left-0 z-10">
                                        {rowIndex + 1}
                                    </td>
                                    {/* Cells from template */}
                                    {Array.from({ length: totalColumns }).map((_, colIndex) => {
                                        const cell = templateCells.get(`${rowIndex}-${colIndex}`);
                                        const isHeader = cell?.type === 'header' || rowIndex === headerRow;
                                        const hasFormula = cell?.formula;
                                        const isFormulaCol = isFormulaColumn(colIndex);

                                        return (
                                            <td
                                                key={colIndex}
                                                className={`border border-gray-300 p-2 text-sm ${isHeader
                                                        ? 'bg-blue-100 dark:bg-blue-900/40 font-bold text-blue-900 dark:text-blue-100'
                                                        : hasFormula
                                                            ? 'bg-green-100 dark:bg-green-900/30 font-mono text-green-800 dark:text-green-300'
                                                            : isFormulaCol
                                                                ? 'bg-blue-50 dark:bg-blue-900/10'
                                                                : 'bg-white dark:bg-gray-800'
                                                    }`}
                                                title={hasFormula ? `Formula: =${cell.formula}` : cell?.value?.toString()}
                                            >
                                                {cell ? (
                                                    <div className="truncate">
                                                        {hasFormula && showFormulas
                                                            ? <span className="text-green-600 dark:text-green-400">={cell.formula}</span>
                                                            : cell.value?.toString() || ''
                                                        }
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-300">—</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}

                            {/* Data rows (uploaded employee data) */}
                            {employeeData.map((record, dataIndex) => {
                                const rowNumber = templateRows + dataIndex + 1;
                                return (
                                    <tr key={`data-${dataIndex}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        {/* Row number */}
                                        <td className="border border-gray-400 bg-gray-200 dark:bg-gray-700 text-center text-xs font-bold p-1 sticky left-0 z-10">
                                            {rowNumber}
                                        </td>
                                        {/* Data cells */}
                                        {template.column_mappings?.map((column, colIndex) => {
                                            const cellData = record.data[column.headerName];
                                            const value = getCellValue(cellData);
                                            const isFormulaCol = isFormulaColumn(colIndex);
                                            const hasFormula = cellData && typeof cellData === 'object' && cellData.formula;
                                            const formula = hasFormula ? cellData.formula : getFormulaForColumn(colIndex);

                                            return (
                                                <td
                                                    key={colIndex}
                                                    className={`border border-gray-300 p-2 text-sm ${isFormulaCol
                                                            ? 'bg-blue-50 dark:bg-blue-900/10 text-blue-900 dark:text-blue-100'
                                                            : 'bg-white dark:bg-gray-800'
                                                        }`}
                                                    title={formula ? `Formula: =${formula}\nValue: ${value}` : value?.toString()}
                                                >
                                                    <div className="truncate">
                                                        {showFormulas && formula ? (
                                                            <span className="text-green-600 dark:text-green-400 font-mono text-xs">
                                                                ={formula}
                                                            </span>
                                                        ) : (
                                                            typeof value === 'number' ? value.toLocaleString() : value
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Excel-like footer/status bar */}
                <div className="bg-gray-100 dark:bg-gray-800 border-t border-gray-400 px-4 py-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-blue-100 border border-gray-400"></div>
                            Header
                        </span>
                        <span className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-green-100 border border-gray-400"></div>
                            Formula
                        </span>
                        <span className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-blue-50 border border-gray-400"></div>
                            Formula Column
                        </span>
                        <span className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-white border border-gray-400"></div>
                            Data
                        </span>
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                        Sheet: {template.template_name} | Rows: {templateRows + employeeData.length} | Columns: {totalColumns}
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
                        onClick={() => setShowFormulas(!showFormulas)}
                    >
                        {showFormulas ? (
                            <>
                                <EyeOff className="h-4 w-4 mr-2" />
                                Hide Formulas
                            </>
                        ) : (
                            <>
                                <Eye className="h-4 w-4 mr-2" />
                                Show Formulas
                            </>
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={fetchUploadedData}
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
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

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            Employees
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{employeeData.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Grid className="h-4 w-4 text-muted-foreground" />
                            Columns
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{template?.column_mappings?.length || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Calculator className="h-4 w-4 text-blue-600" />
                            Formulas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {template?.formula_definitions?.length || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4 text-green-600" />
                            Version
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            v{template?.version || "1.0"}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            Uploaded
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

            {/* Excel View */}
            <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                                Excel Template View
                            </CardTitle>
                            <CardDescription>
                                Showing uploaded data in exact template format
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            {loadingTemplate && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading template...
                                </div>
                            )}
                            <div className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                {employeeData.length} Records
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4">
                    {templateStructure ? (
                        buildExcelGrid()
                    ) : loadingTemplate ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <FileSpreadsheet className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <p className="text-muted-foreground">Template structure not available</p>
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={loadTemplateStructure}
                            >
                                Load Template
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Formula Definitions */}
            {template?.formula_definitions && template.formula_definitions.length > 0 && (
                <Card className="bg-blue-50/50 dark:bg-blue-900/10">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Calculator className="h-4 w-4 text-blue-600" />
                            Formula Definitions Applied
                        </CardTitle>
                        <CardDescription>
                            These formulas were automatically calculated when data was uploaded
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {template.formula_definitions.map((formula, idx) => (
                                <div key={idx} className="p-3 bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-mono text-sm bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded">
                                            {formula.cellAddress}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            Column {formula.cellAddress.replace(/\d+/g, '')}
                                        </span>
                                    </div>
                                    <code className="text-sm text-green-600 dark:text-green-400 font-mono block">
                                        ={formula.formula}
                                    </code>
                                    {formula.description && (
                                        <p className="text-xs text-muted-foreground mt-2">
                                            {formula.description}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
