
const { config } = require('../config');
const logger = require('../config/logger');
const { redis } = require('../config/redis');
const prisma = require('../config/prisma');
const { NotFoundError } = require('../utils/error');

const getProfile = async(userId)=>{
     logger.info("Checking Redis for user profile");
     const storedUser = await redis.get(`user:${userId}`);
     if (storedUser) {
          logger.info("Fetched user profile from Redis");
          return JSON.parse(storedUser);
     }

     logger.info("Fetching user profile from database");
     const userProfile = await prisma.user.findUnique({
          where: { id: userId },
          select: {
               id: true,
               firstName: true,
               lastName: true,
               email: true,
               emailVerified: true,
               createdAt: true,
               updatedAt: true,
          },
     });

     if (!userProfile) {
          throw new NotFoundError("User not found");
     }

     logger.info("Caching user profile in Redis");
     await redis.set(
          `user:${userId}`,
          JSON.stringify(userProfile),
          'EX',
          config.REDIS_USER_TTL
     );
     return userProfile;
}

module.exports={
    getProfile
}