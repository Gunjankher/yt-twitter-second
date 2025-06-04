 export const asyncHandlar  = (requestHandlar) =>{
    return (req,res,next) =>{
        Promise.resolve(requestHandlar(req,res,next)).catch((err)=>next(err))
    }
}

























// try catch syntax

// const asyncHandlar = (fn) =>async(req,res,next)=>{

// try {
//     await fn(req,res,next)
// } catch (error) {
//     res.status(err.code || 500).json({
//         success : false,
//         message : err.message
//     })
// }
// }