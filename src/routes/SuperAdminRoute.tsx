import Layout from '@/Layout'
import Setting from '@/pages/Setting/Setting'
import SuperAdminHome from '@/pages/SuperAdmin/SuperAdminHome'
import SuperAdminSetting from '@/pages/SuperAdmin/SuperAdminSetting'
import { Route } from 'react-router-dom'

const SuperAdminRoutes = () => (
    <Route element={<Layout/>}>
        <Route path='/superAdminDashboard' element={<SuperAdminHome/>}/>
        <Route path='/setting' element={<Setting/>}/>
        <Route path='/superAdminSetting' element={<SuperAdminSetting/>}/>
    </Route>
)

export default SuperAdminRoutes