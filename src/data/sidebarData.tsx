export const routes = [
    {
        title: "Home",
        url: "/",
        allowedRoles: ["superAdmin", "user"],
    },
    {
        title: "Setting",
        url: "/setting",
        allowedRoles: ["superAdmin", "user"],
    },
    {
        title: "Super Admin Setting",
        url: "/superAdminSetting",
        allowedRoles: ["superAdmin"],
    },
    {
        title: "Employee Management",
        url: "/employeeManagement",
        allowedRoles: ["superAdmin"],
    },
    {
        title: "Template Management",
        url: "/templateManagement",
        allowedRoles: ["superAdmin"],
    },
    {
        title: "Data Filling",
        url: "/dataFilling",
        allowedRoles: ["superAdmin"],
    },
    {
        title: "User Setting",
        url: "/userSetting",
        allowedRoles: ["user"],
    }
]

export const temRoute = [
    {
        title: "Home",
        url: "/",
    },
    {
        title: "Setting",
        url: "/Setting",
    }
]