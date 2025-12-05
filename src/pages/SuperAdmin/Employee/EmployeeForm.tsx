import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import axiosInstance from "@/api/axiosInstance";

interface EmployeeFormProps {
    onSuccess: () => void;
    initialData?: any;
    onCancel: () => void;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({
    onSuccess,
    initialData,
    onCancel,
}) => {
    const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm({
        defaultValues: initialData || {
            employeeId: "",
            name: "",
            email: "",
            designation: "",
            division: "",
            geography: "",
            department: "",
            reportsTo: "",
        },
    });

    const [managers, setManagers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchManagers();
        if (initialData) {
            // Set form values if editing
            Object.keys(initialData).forEach((key) => {
                if (key === 'reportsTo' && initialData[key]) {
                    setValue(key, initialData[key]._id);
                } else {
                    setValue(key, initialData[key]);
                }
            });
        }
    }, [initialData, setValue]);

    const fetchManagers = async () => {
        try {
            const response = await axiosInstance.get("/employees/dropdown");
            setManagers(response.data.data);
        } catch (error) {
            console.error("Failed to fetch managers", error);
        }
    };

    const onSubmit = async (data: any) => {
        setLoading(true);
        try {
            // If reportsTo is empty string, send null or undefined
            if (!data.reportsTo) {
                delete data.reportsTo;
            }

            if (initialData) {
                await axiosInstance.put(`/employees/${initialData._id}`, data);
                toast.success("Employee updated successfully");
            } else {
                await axiosInstance.post("/employees", data);
                toast.success("Employee created successfully");
            }
            reset();
            onSuccess();
        } catch (error: any) {
            console.error("Error saving employee:", error);
            // Error handling is done in axios interceptor mostly, but we can add specific handling here
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>{initialData ? "Edit Employee" : "Add New Employee"}</CardTitle>
                <CardDescription>
                    Enter the details of the employee.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="employeeId">Employee ID</Label>
                            <Input
                                id="employeeId"
                                placeholder="EMP001"
                                {...register("employeeId", { required: "Employee ID is required" })}
                            />
                            {errors.employeeId && (
                                <p className="text-sm text-red-500">{errors.employeeId.message as string}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                placeholder="John Doe"
                                {...register("name", { required: "Name is required" })}
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500">{errors.name.message as string}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="john.doe@example.com"
                            {...register("email", {
                                required: "Email is required",
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: "Invalid email address"
                                }
                            })}
                        />
                        {errors.email && (
                            <p className="text-sm text-red-500">{errors.email.message as string}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="designation">Designation</Label>
                            <Input
                                id="designation"
                                placeholder="Software Engineer"
                                {...register("designation", { required: "Designation is required" })}
                            />
                            {errors.designation && (
                                <p className="text-sm text-red-500">{errors.designation.message as string}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="department">Department</Label>
                            <Input
                                id="department"
                                placeholder="Engineering"
                                {...register("department", { required: "Department is required" })}
                            />
                            {errors.department && (
                                <p className="text-sm text-red-500">{errors.department.message as string}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="division">Division</Label>
                            <Input
                                id="division"
                                placeholder="IT"
                                {...register("division", { required: "Division is required" })}
                            />
                            {errors.division && (
                                <p className="text-sm text-red-500">{errors.division.message as string}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="geography">Geography</Label>
                            <Input
                                id="geography"
                                placeholder="New York"
                                {...register("geography", { required: "Geography is required" })}
                            />
                            {errors.geography && (
                                <p className="text-sm text-red-500">{errors.geography.message as string}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reportsTo">Reports To</Label>
                        <select
                            id="reportsTo"
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...register("reportsTo")}
                        >
                            <option value="">Select Manager (Default: Super Admin)</option>
                            {managers.map((manager) => (
                                <option key={manager._id} value={manager._id}>
                                    {manager.name} ({manager.designation})
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-muted-foreground">
                            Leave blank to assign to Super Admin automatically.
                        </p>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                    <Button variant="outline" type="button" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? "Saving..." : (initialData ? "Update Employee" : "Create Employee")}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
};
