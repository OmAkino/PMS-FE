import AuthPage from "@/pages/Auth/AuthPage";
import LoginPage from "@/pages/Auth/LoginPage";
import SignUpPage from "@/pages/Auth/SignUpPage";
import { Route } from "react-router-dom";

function PublicRoutes() {
  return (
      <Route element={<AuthPage />} key="auth">
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<SignUpPage />} />
      </Route>
  );
}

export default PublicRoutes;
