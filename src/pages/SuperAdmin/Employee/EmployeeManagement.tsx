import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmployeeForm } from "./EmployeeForm";
import axiosInstance from "@/api/axiosInstance";
import { toast } from "sonner";
import { Plus, Search, Edit, Trash2 } from "lucide-react";

export default function EmployeeManagement() {
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get("/employees");
            setEmployees(response.data.data);
        } catch (error) {
            console.error("Failed to fetch employees", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddClick = () => {
        setEditingEmployee(null);
        setShowForm(true);
    };

    const handleEditClick = (employee: any) => {
        setEditingEmployee(employee);
        setShowForm(true);
    };

    const handleDeleteClick = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this employee?")) {
            try {
                await axiosInstance.delete(`/employees/${id}`);
                toast.success("Employee deleted successfully");
                fetchEmployees();
            } catch (error) {
                console.error("Failed to delete employee", error);
            }
        }
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setEditingEmployee(null);
        fetchEmployees();
    };

    const filteredEmployees = employees.filter((emp) =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (showForm) {
        return (
            <div className="p-6">
                <EmployeeForm
                    onSuccess={handleFormSuccess}
                    onCancel={() => setShowForm(false)}
                    initialData={editingEmployee}
                />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Employee Management</h1>
                <Button onClick={handleAddClick}>
                    <Plus className="mr-2 h-4 w-4" /> Add Employee
                </Button>
            </div>

            <div className="flex items-center space-x-2 max-w-sm">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="border rounded-md">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground uppercase">
                            <tr>
                                <th className="px-4 py-3 font-medium">ID</th>
                                <th className="px-4 py-3 font-medium">Name</th>
                                <th className="px-4 py-3 font-medium">Designation</th>
                                <th className="px-4 py-3 font-medium">Department</th>
                                <th className="px-4 py-3 font-medium">Reports To</th>
                                <th className="px-4 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                        Loading employees...
                                    </td>
                                </tr>
                            ) : filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                        No employees found.
                                    </td>
                                </tr>
                            ) : (
                                filteredEmployees.map((employee) => (
                                    <tr key={employee._id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-4 py-3 font-medium">{employee.employeeId}</td>
                                        <td className="px-4 py-3">
                                            <div>
                                                <div className="font-medium">{employee.name}</div>
                                                <div className="text-xs text-muted-foreground">{employee.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">{employee.designation}</td>
                                        <td className="px-4 py-3">{employee.department}</td>
                                        <td className="px-4 py-3">
                                            {employee.reportsTo ? (
                                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                                    {employee.reportsTo.name}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20">
                                                    Super Admin
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEditClick(employee)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDeleteClick(employee._id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
