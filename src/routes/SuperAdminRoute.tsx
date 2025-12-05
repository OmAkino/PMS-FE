import Layout from '@/Layout'
import Setting from '@/pages/Setting/Setting'
import SuperAdminHome from '@/pages/SuperAdmin/SuperAdminHome'
import SuperAdminSetting from '@/pages/SuperAdmin/SuperAdminSetting'
import EmployeeManagement from '@/pages/SuperAdmin/Employee/EmployeeManagement'
import DataFillingPage from '@/pages/SuperAdmin/DataFilling/DataFillingPage'
import ViewUploadedDataPage from '@/pages/SuperAdmin/DataFilling/ViewUploadedDataPage'
import TemplateManagementPage from '@/pages/SuperAdmin/Templates/TemplateManagementPage'
import { Route } from 'react-router-dom'

const SuperAdminRoutes = () => (
    <Route element={<Layout />}>
        <Route path='/superAdminDashboard' element={<SuperAdminHome />} />
        <Route path='/setting' element={<Setting />} />
        <Route path='/superAdminSetting' element={<SuperAdminSetting />} />
        <Route path='/employeeManagement' element={<EmployeeManagement />} />
        <Route path='/dataFilling' element={<DataFillingPage />} />
        <Route path='/viewUploadedData' element={<ViewUploadedDataPage />} />
        <Route path='/templateManagement' element={<TemplateManagementPage />} />
    </Route>
)

export default SuperAdminRoutes