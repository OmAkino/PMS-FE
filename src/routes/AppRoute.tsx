import { Routes, Route, Navigate } from "react-router-dom";
import PublicRoutes from "./PublicRoute";
import { useEffect, useState } from "react";
import SuperAdminRoutes from "./SuperAdminRoute";
import UserRoutes from "./UserRoute";
import { useAppSelector } from "@/slice/hook";

function AppRoutes() {
  const user = useAppSelector((state) => state.auth.user);
  const [navigateRoute, setNavigateRoute] = useState("/login");
  useEffect(() => {
    if (!user) return;

    switch (user.role) {
      case "superAdmin":
        setNavigateRoute("/superAdminDashboard");
        break;
      case "user":
        setNavigateRoute("/userDashboard");
        break;
      default:
        setNavigateRoute("/login");
    }
  }, [user]);

  const renderRoleRoutes = () => {
    if (!user) return null;

    switch (user.role) {
      case "superAdmin":
        return SuperAdminRoutes();
      case "user":
        return UserRoutes();
      default:
        return null;
    }
  };

  const isAuthenticated = Boolean(user);
  return (
    <Routes>
      {isAuthenticated ? (
        <>
          {renderRoleRoutes()}
          {/* Redirect any unknown route to correct dashboard */}
          <Route path="*" element={<Navigate to={navigateRoute} replace />} />
        </>
      ) : (
        <>
          {PublicRoutes()}
          {/* Redirect all unknown routes to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      )}
    </Routes>
  );
}

export default AppRoutes;
