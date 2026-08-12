import { Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { motion } from "framer-motion";
import { FaLock, FaArrowRight } from "react-icons/fa";
import { CiMail } from "react-icons/ci";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import loginBG from '../assets/loginBG.png'

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordShown, setIsPasswordShown] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const { error } = await login(email, password);

        if (error) {
            showToast(error.message, "error");
            setIsSubmitting(false);
        } else {
            navigate('/dashboard');
        }
    };

    return (
        <section
            className="relative w-full h-dvh overflow-hidden bg-cover bg-center bg-no-repeat flex flex-col items-end justify-center gap-5 px-6 md:px-24 lg:px-48"
            style={{ backgroundImage: `url(${loginBG})` }}
        >
            <motion.form
                initial={{ opacity: 0, x: -100 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                onSubmit={handleSubmit}
                className="bg-[#F9F9F8] w-1/3 p-5 rounded-2xl shadow-xl shadow-[#2C2C2E] flex flex-col gap-5"
            >
                <div className="text-center">
                    <h2 className="text-3xl">Welcome Back!</h2>
                    <p className="text-sm text-gray-500">Sign in to continue to HR ELEVATE</p>
                </div>

                <div className="flex flex-col gap-2 relative">
                    <label htmlFor="email" className="text-sm">Work Email</label>
                    <CiMail size={28} className="absolute left-3 top-1/3 translate-y-5 w-4 h-4 text-gray-700" />
                    <input
                        type="email"
                        name="email"
                        id="email"
                        placeholder="name@company.com"
                        value={email}
                        required
                        className="w-full pl-10 pr-3 py-2 bg-gray-100 rounded-lg border border-gray-200
                     text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A8C3B9] cursor-pointer"
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="flex flex-col gap-2 relative">
                    <div className="flex justify-between items-center">
                        <label htmlFor="pass">Password</label>
                        <Link to='/forgot-password' className="text-xs text-[#639987] cursor-pointer">
                            Forgot password?
                        </Link>
                    </div>
                    <FaLock size={28} className="absolute left-3 top-1/3 translate-y-5 w-4 h-4" style={{ color: 'gray' }} />
                    <input
                        type={isPasswordShown ? 'text' : 'password'}
                        name="pass"
                        id="pass"
                        placeholder="Enter your password"
                        value={password}
                        required
                        className="w-full pl-10 pr-3 py-2 bg-gray-100 rounded-lg border border-gray-200
                   text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A8C3B9] cursor-pointer"
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                        type="button"
                        className="absolute right-3 top-1/3 translate-y-5 text-gray-400 hover:text-gray-600 cursor-pointer"
                        onClick={() => setIsPasswordShown((prev) => !prev)}
                    >
                        {isPasswordShown ? <IoMdEyeOff className="w-5 h-5" /> : <IoMdEye className="w-5 h-5" />}
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        name="check"
                        id="check"
                        className="accent-[#639987] cursor-pointer transition-all duration-300"
                    />
                    <label htmlFor="check" className="cursor-pointer">Remember this device</label>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-10 bg-[#639987] rounded-lg text-[#F9F9F8] font-bold text-lg flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-60 disabled:hover:scale-100"
                >
                    {isSubmitting ? "Signing In..." : (
                        <>Sign In <FaArrowRight style={{ color: "#F9F9F8" }} size={16} /></>
                    )}
                </button>

                <hr />

                <div className="flex flex-col gap-2 items-center">
                    <p className="text-gray-500 text-md">
                        New to ElevateHR? <a href="#" className="text-[#639987] cursor-pointer">Request access</a>
                    </p>

                    <div className="flex gap-7">
                        <Link to="/" className="text-sm text-gray-500 cursor-pointer">Privacy Policy</Link>
                        <Link to="/" className="text-sm text-gray-500 cursor-pointer">Terms & Conditions</Link>
                    </div>
                </div>
            </motion.form>
        </section>
    );
};

export default LoginPage;