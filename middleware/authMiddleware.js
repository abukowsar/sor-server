import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
import { handleAsync } from "../utils/handleAsync.js";
import { User } from "../models/User/userModel.js";

const auth = (...requiredRoles) => {
  return handleAsync(async (req, res, next) => {
    const token = req.headers.authorization;
    // console.log(token , "token");

    if (!token) {
      throw new ApiError(401, "You are not authorized!");
    }

    // checking if the given token is valid
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { id, role } = decoded;

    // checking if the user exists
    const user = await User.findById(id);

    if (!user) {
      throw new ApiError(404, "This user is not found!");
    }

    if (requiredRoles && !requiredRoles.includes(role)) {
      throw new ApiError(401, "You are not authorized!");
    }
    console.log(id);
    req.user = {
      _id: id,
      role,
    };
    next();
  });
};

export default auth;