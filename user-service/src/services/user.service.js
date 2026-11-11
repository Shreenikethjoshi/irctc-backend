
const getProfile = async(userID)=>{
    logger.info("first check user in redis");
    const storedUser= await redis.get(`user:${userId}`);
     if(storedUser){
          logger.info("Fetched user profile from redis");
          return JSON.parse(storedUser);
     }
     logger.info("If user is not in redis, fetch user from DB");
     const userProfile = await prisma.user.findUnique({
          where: {
               id: userId
          }
     })
     
     logger.info("Exclude password field from the user");
     const {password: _password, ...safeUser} = userProfile;
     logger.info("Store user profile in redis for future lookups");
     await redis.set(`user:${userId}`, JSON.stringify(safeUser), 'EX', config.REDIS_USER_TTL);
     return safeUser;
}

module.exports={
    getProfile
}