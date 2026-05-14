import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'

const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-white">Cargando...</div>;
    }

    return user ? children : <Navigate to="/login" />;
};

export default PrivateRoute;