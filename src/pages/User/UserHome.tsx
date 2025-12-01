import uploadExcelService from "@/service/uploadExcel.service";
import { useState, useEffect } from "react";

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

interface TemplateData {
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



const UserHome = () => {
  const [file, setFile] = useState<File | null>(null);
  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [availableTemplates, setAvailableTemplates] = useState<string[]>([]);
  const [searchError, setSearchError] = useState("");

  const [templateName, setTemplateName] = useState(""); // New state for template name
  const [templateDescription, setTemplateDescription] = useState(""); // New state for description

  // Fetch available templates on component mount
  useEffect(() => {
    fetchAvailableTemplates();
  }, []);

  const fetchAvailableTemplates = async () => {
    try {
      const response = await uploadExcelService.getAllTemplates();
      console.log("Templates response:", response);
      
      // Handle different response formats
      let templatesArray: any[] = [];
      
      if (Array.isArray(response)) {
        templatesArray = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        templatesArray = response.data;
      } else if (response && Array.isArray(response)) {
        templatesArray = response;
      }
      
      const templateNames = templatesArray.map((t: any) => t.template_name || t.name || "Unknown");
      setAvailableTemplates(templateNames);
    } catch (err) {
      console.error("Failed to fetch templates list:", err);
      setAvailableTemplates([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select an Excel file first.");
      return;
    }

    // Validate template name
    if (!templateName.trim()) {
      alert("Please enter a template name");
      return;
    }

    setLoading(true);
     try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("templateName", templateName.trim());
      if (templateDescription.trim()) {
        formData.append("description", templateDescription.trim());
      }

      const res = await uploadExcelService.uploadHeaderExcel(formData);
      console.log("Uploaded successfully:", res);

      // alert(`Template "${templateName}" created successfully!`);
      
      // Reset form
      setFile(null);
      setTemplateName("");
      setTemplateDescription("");
      
      // Refresh available templates list
      await fetchAvailableTemplates();
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err) {
      console.error(err);
      alert("Failed to upload Excel");
    } finally {
      setLoading(false);
    }
  };

  const handleGetDefaultTemplate = async () => {
    setLoading(true);
    setSearchError("");
    try {
      const response = await uploadExcelService.getTemplate();
      console.log("Default template response:", response);
      
      // Handle different response formats
      const templateData = response.data || response;
      
      if (!templateData) {
        throw new Error("No template data received");
      }
      
      setTemplate(templateData);
      setShowTemplate(true);
      setSearchTerm(templateData.template_name || "Default Template");
      console.log("Template retrieved:", templateData);
    } catch (err) {
      console.error(err);
      setSearchError("Failed to fetch default template. Please upload a template first.");
      setTemplate(null);
      setShowTemplate(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchTemplate = async () => {
    if (!searchTerm.trim()) {
      setSearchError("Please enter a template name");
      return;
    }

    setLoading(true);
    setSearchError("");
    try {
      const response = await uploadExcelService.searchTemplateByName(searchTerm.trim());
      console.log("Search template response:", response);
      
      // Handle different response formats
      const templateData = response.data || response;
      
      if (!templateData) {
        throw new Error("Template not found");
      }
      
      setTemplate(templateData);
      setShowTemplate(true);
      console.log("Template retrieved:", templateData);
    } catch (err) {
      console.error(err);
      setSearchError(`Template "${searchTerm}" not found`);
      setTemplate(null);
      setShowTemplate(false);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setSearchError("");
    setTemplate(null);
    setShowTemplate(false);
  };

  const renderExcelGrid = () => {
    if (!template) return null;

    // Safe destructuring with fallbacks
    const { sheet_structure, metadata } = template;
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
        <h3 className="text-lg font-semibold mb-4">Template Structure: {template.template_name}</h3>
        
        {/* Template Info */}
        <div className="mb-4 p-3 bg-gray-100 rounded">
          <p><strong>Template Name:</strong> {template.template_name}</p>
          <p><strong>Description:</strong> {template.description}</p>
          <p><strong>Version:</strong> {template.version}</p>
          <p><strong>Grid Size:</strong> {total_rows} rows × {total_columns} columns</p>
          <p><strong>Data Input Cells:</strong> {metadata?.data_input_ranges?.length || 0}</p>
          <p><strong>Formula Cells:</strong> {metadata?.formula_rows?.length || 0}</p>
        </div>

        {/* Excel-like Grid */}
        <div className="overflow-auto border border-gray-300 rounded max-h-96">
          <table className="min-w-full border-collapse">
            <tbody>
              {grid.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, colIndex) => (
                    <td
                      key={colIndex}
                      className={`
                        border border-gray-300 p-1 min-w-20 max-w-40 truncate text-xs
                        ${cell?.type === 'header' ? 'bg-blue-100 font-semibold' : ''}
                        ${cell?.type === 'formula' ? 'bg-green-100 italic' : ''}
                        ${cell?.type === 'metadata' ? 'bg-yellow-100' : ''}
                        ${cell?.type === 'data' ? 'bg-white' : ''}
                        ${cell?.is_locked ? 'cursor-not-allowed bg-gray-100' : 'cursor-cell'}
                      `}
                      title={cell?.formula ? `Formula: ${cell.formula}` : cell?.value?.toString()}
                    >
                      {cell ? (
                        <div>
                          <div className="font-mono text-gray-500 text-xs">
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
            <div className="w-4 h-4 bg-blue-100 mr-2 border"></div>
            <span>Header</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-100 mr-2 border"></div>
            <span>Formula</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-100 mr-2 border"></div>
            <span>Metadata</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-white mr-2 border"></div>
            <span>Data Input</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-100 mr-2 border"></div>
            <span>Locked</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="font-semibold text-2xl mb-6">Excel Template Management</h1>

      {/* Upload Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Upload Header Excel Template</h2>
        
        <div className="flex flex-col gap-4">
           <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Name *
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Enter unique template name (e.g., PMS-APAC-Q1-2024)"
              className="w-full p-2 border border-gray-300 rounded"
              disabled={loading}
            />
          </div>


          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              placeholder="Enter template description"
              className="w-full p-2 border border-gray-300 rounded"
              rows={2}
              disabled={loading}
            />
          </div>


           <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Excel File *
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="w-full p-2 border border-gray-300 rounded"
              disabled={loading}
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleUpload}
              disabled={loading || !file || !templateName.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "Uploading..." : "Upload Template"}
            </button>
          </div>
        </div>
      </div>

      {/* Search Template Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Search Template</h2>
        
        <div className="flex flex-col gap-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter template name (e.g., PMS-APAC-Header)"
                className="w-full p-2 border border-gray-300 rounded"
                disabled={loading}
                list="templateSuggestions"
              />
              <datalist id="templateSuggestions">
                {availableTemplates.map((templateName) => (
                  <option key={templateName} value={templateName} />
                ))}
              </datalist>
              {searchError && (
                <p className="text-red-500 text-sm mt-1">{searchError}</p>
              )}
              {availableTemplates.length > 0 && (
                <p className="text-gray-500 text-sm mt-1">
                  Available templates: {availableTemplates.join(", ")}
                </p>
              )}
            </div>
            
            <button
              onClick={handleSearchTemplate}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "Searching..." : "Get Template"}
            </button>

            <button
              onClick={handleGetDefaultTemplate}
              disabled={loading}
              className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "Loading..." : "Get Default"}
            </button>

            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Template Display Section */}
      {showTemplate && template && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          {renderExcelGrid()}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">How to use:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Upload your Excel template using the "Upload Template" button</li>
          <li>Search for a specific template by name or use "Get Default" for the default template</li>
          <li>Click "Get Template" to view the parsed structure</li>
          <li>The grid shows all cells with their formulas, values, and types</li>
          <li>Green cells contain formulas, blue cells are headers</li>
          <li>White cells are data input areas where users can enter values</li>
        </ol>
      </div>
    </div>
  );
};

export default UserHome;