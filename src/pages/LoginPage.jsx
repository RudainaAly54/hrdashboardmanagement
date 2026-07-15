import { useState } from "react";
import {useAuth} from '../context/AuthContext'
import { motion } from "framer-motion";
import { FaHeartPulse } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";

const LoginPage = ()  => {
    const [email, setEmail] = useState (' ');
    const [password, setPassword] = useState(' ');
    const [error, setError] =  useState('');
    
    const {login} = useAuth()
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault ();
        const {error} = await login(email, password);
        if(error) setError(error.message);
        else navigate('/dashboard')
    }

    return(
    <section
   className = "w-[100%] h-full flex items-center justify-center gap-5"
    >
        <motion.div
        initial = {{opacity: 0, x: -100}}
        animate = {{opacity: 1, x: 0}}
        duration = {10}
        className = "flex items-center justify-center"
        >
            <div  className="w-10 h-10 bg-[#A8C3B9] rounded-xl">
                <FaHeartPulse style=  {{color: '#F9F978'}} size = {28}/>
                
            </div>

        </motion.div>
    </section>
    )
}

export default LoginPage