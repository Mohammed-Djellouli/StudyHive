const jwt =require('jsonwebtoken');
const User = require('../models/User');

const protect=async (req,res,next) =>{
    const token=req.headers.authorization;
    if(!token){
        return res.status(401).json({message:'token missing'});
    }

    try{
        const decoded=jwt.verify(token,process.env.JWT_SECRET);
        req.user=await User.findById(decoded.id).select('-password');
        next();
    }catch(err){
        res.status(401).json({message:'token invalid'});
    }

};

module.exports=protect;