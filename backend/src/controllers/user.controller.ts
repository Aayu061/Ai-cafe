import { Request, Response, NextFunction } from "express";
import { userService } from "../services/user.service";

export async function getMe(req: Request, res: Response): Promise<void> {
  // req.user is guaranteed by auth.middleware
  const user = req.user!;

  res.status(200).json({
    success: true,
    user: {
      uid: user.uid,
      email: user.email || null,
      name: user.name || null,
      picture: user.picture || null,
    },
  });
}

export async function getMyProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const user = req.user!;

  try {
    const profile = await userService.getUserProfile(user.uid);

    if (!profile) {
      res.status(404).json({
        success: false,
        error: {
          code: "USER_PROFILE_NOT_FOUND",
          message: "User profile document not found in Firestore.",
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      profile,
    });
  } catch (error: unknown) {
    next(error);
  }
}
