const relativeTime = (isoString) => {
    if(!isoString) return ""
    const diffMs = Date.now() - new Date(isoString).getTime()
    const mins = Math.floor(diffMs/60000)
    if(mins < 1) return "Just now"
    if(mins < 60) return `${mins} minute${mins >1 ? "s" : ""} ago`
    const hours = Math.floor(mins/60)
    if(hours < 24) return  `${hours} hour${hours > 1 ? "s" : ""} ago`
    const days = Math.floor(mins/ 24) 
    return(`${days} day${days > 1 ? "s" : ""} ago`)
}
export default relativeTime