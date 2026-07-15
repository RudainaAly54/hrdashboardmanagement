import { Navigate } from "react-router-dom";
import {useAuth} from '../context/AuthContext'
import LoadingSpinner from './LoadingSpinner'

const ProtectedRoute = ({children, requiredRole}) => {
    const {user, profile, loading} = useAuth();
     if(loading)  return <LoadingSpinner/>;
    if(!user) return <Navigate to = "/login"/>;
    if(requiredRole && profile?.role !== requiredRole) return <Navigate to= "/unauthorized" />; 
}

export default ProtectedRoute
