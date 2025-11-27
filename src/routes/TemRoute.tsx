import Layout from '@/Layout'
import Setting from '@/pages/Setting/Setting'
import { Route } from 'react-router-dom'

const TemRoute = () => (
    <Route element={<Layout/>}>
        <Route path='/setting' element={<Setting/>}/>
    </Route>
)

export default TemRoute