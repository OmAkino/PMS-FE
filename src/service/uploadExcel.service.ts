import axiosInstance from "@/api/axiosInstance";

const uploadExcelService = {
  uploadHeaderExcel: async (formData: FormData) => {
    try {
      const response = await axiosInstance.post(
        "/excel/uploadHeaderExcel",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getTemplate: async (templateName?: string) => {
    try {
      const response = await axiosInstance.get(`/excel/template/${templateName || "PMS-APAC-Header"}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getAllTemplates: async () => {
    try {
      const response = await axiosInstance.get("/excel/templates");
      // Handle both array response and object with data property
      return Array.isArray(response.data) ? response.data : response.data.data || [];
    } catch (error) {
      throw error;
    }
  },

  searchTemplateByName: async (templateName: string) => {
    try {
      const response = await axiosInstance.get(`/excel/template/${templateName}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getTemplateByQuery: async (templateName: string) => {
    try {
      const response = await axiosInstance.get("/excel/template", {
        params: { templateName }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default uploadExcelService;