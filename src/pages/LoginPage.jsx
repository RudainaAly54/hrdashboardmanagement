import { useState } from "react";
import {useAuth} from '../context/AuthContext'
import { motion } from "framer-motion";
import { FaHeartPulse } from "react-icons/fa6";
import { FaLock,FaArrowRight, FaGoogle, FaMicrosoft    } from "react-icons/fa";
import { CiMail } from "react-icons/ci";
import { IoMdEye,  IoMdEyeOff} from "react-icons/io";
import { MdOutlineHorizontalRule } from "react-icons/md";

import { useNavigate } from "react-router-dom";
 
const LoginPage = ()  => {
    const [email, setEmail] = useState (' ');
    const [password, setPassword] = useState(' ');
    const [error, setError] =  useState('');
    const [isPasswordShown, setIsPasswordShown] = useState(false)
    
    const {login} = useAuth()
    const navigate = useNavigate();
    
    //Common Style for this page
    const className =  "flex flex-col items-center justify-center"

    const handleSubmit = async (e) => {
        e.preventDefault ();
        const {error} = await login(email, password);
        if(error) setError(error.message);
        else navigate('/dashboard')
    }

    return(
    <section
   className = "w-[100%] p-10 flex  flex-col items-center justify-center gap-5"
    >
        <motion.div
        initial = {{opacity: 0, x: -100}}
        whileInView = {{opacity: 1, x: 0}}
        trasntion = {{duration: 0.8}}
        className = {className}
        >
            <div  className="w-16 h-16 bg-[#639987] rounded-xl flex items-center justify-center shadow-lg shadow-[#2C2C2E] hover:bg-[#A8C3B9] transition-all duration-300">
                <FaHeartPulse style=  {{color: '#F9F9F8'}} size = {36}/>
            </div>
            <h1 className = "text-5xl font-[manrope]">ElevateHR</h1>
            <p className = "text-gray-500 text-md font-[inter]">Enterprise People Managememt</p>

        </motion.div>

        <motion.form
         initial = {{opacity: 0, x: -100}}
        whileInView = {{opacity: 1, x: 0}}
        trasntion = {{duration: 0.8}}
        className = {className}
        className = "bg-[#F9F9F8] p-5 rounded-2xl shadow-xl shadow-[#2C2C2E] flex flex-col gap-5 w-1/2"
        >

            <div
            className="flex flex-col gap-2 relative "
            >
            <label htmlFor="email" className="font-[inter] text-sm">Work Email</label>
            <CiMail  size={28} className="absolute left-3  top-1/3 translate-y-5  w-4 h-4" style = {{color: 'gray'}}/>
            <input type="email" name="email" id="email" placeholder= "name@company.com"
           className="w-full pl-10 pr-3 py-2 bg-gray-100 rounded-lg border border-gray-200
                     text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A8C3B9] cursor-pointer"
            />
            </div>

            <div
            className="flex flex-col gap-2 relative "
            >
            <div className="flex justify-between items-center">
                <label htmlFor="pass" className="font-[inter]">password</label>
                <a href="#"
                className="text-xs font-[inter] text-[#639987] cursor-pointer"
                >forgot password? </a>
            </div>
            <FaLock  size={28} className="absolute left-3  top-1/3 translate-y-5  w-4 h-4" style = {{color: 'gray'}}  />
            <input type={isPasswordShown ? 'text' : 'password'} name="pass" id="pass" placeholder= "Enter your pass"
           className="w-full pl-10 pr-3 py-2 bg-gray-100 rounded-lg border border-gray-200
                     text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A8C3B9] cursor-pointer "
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
             <input type="checkbox" name="check" id="check" 
             className=" accent-[#639987] cursor-pointer transition-all duration-300"/>
             <label htmlFor="check" className="cursor-pointer">Remember this device</label>
          </div>

          <button
          type="submit"
          onClick={handleSubmit}
          className="w-full h-10  bg-[#639987] rounded-xl text-[#F9F9F8] font-bold text-lg  flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all duration-300"
          >Sign In <FaArrowRight style={{color:"#F9F9F8"}} size={16}/></button>
        
            
             <p className="text-gray-500 text-center  "> or continue with</p>
             
        <div className="flex justify-evenly">
            <button className="rounded-lg flex items-center justify-center gap-2 border-2 border-gray-500 curson pointer p-2 shadow-lg hover:scale-105 active:scale-95 transition-all duration-300">
                <FaGoogle size={18}/>
                Google
            </button>
            <button className="rounded-lg flex items-center justify-center gap-2 border-2 border-gray-500 curson pointer p-2 shadow-lg hover:scale-105 active:scale-95 transition-all duration-300">
                <FaMicrosoft size={18}/>
                Microsoft
            </button>
        </div>
        </motion.form>

       <p className = "text-gray-500 text-md font-[inter]">New to ElevateHR? <a href="#"
                className=" font-[inter] text-[#639987] cursor-pointer"
                >Request access </a></p>

                <div className="flex  gap-7">
                    <a href="#"
                className="text-sm font-[inter] text-gray-500 cursor-pointer"
                >Privcy Polacy </a>
                    <a href="#"
                className="text-sm font-[inter] text-gray-500 cursor-pointer"
                >Terms & Conditions</a>
                </div>
    </section>
    )
}

export default LoginPage