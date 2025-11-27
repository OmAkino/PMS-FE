import Layout from '@/Layout'
import Setting from '@/pages/Setting/Setting'
import UserHome from '@/pages/User/UserHome'
import UserSetting from '@/pages/User/UserSetting'
import { Route } from 'react-router-dom'

const UserRoutes = () => (
    <Route element={<Layout/>}>
        <Route path='/userDashboard' element={<UserHome/>}/>
        <Route path='/setting' element={<Setting/>}/>
        <Route path='/userSetting' element={<UserSetting/>}/>
    </Route>
)

export default UserRoutes