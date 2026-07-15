import { div } from "framer-motion/client"

const LoadingSpinner = () => {
    return (
        
<div className="w-full h-full flex items-center justify-center">
            <div className="w-10 h-10 border-5 border-gray-300 border-t-[#A8C3B9] rounded-full animate-spin">
                <span>loading ...</span>
                
            </div>
</div>
    )
}

export default LoadingSpinner