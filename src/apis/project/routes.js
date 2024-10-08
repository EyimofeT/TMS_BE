import express from "express";
import {
  authcheck, create_user_project_middleware, add_user_project_middleware, delete_user_project_middleware, update_user_project_middleware , update_user_role_in_project_middleware
} from "./middleware.js";
import {
  create_user_project, get_user_project, get_user_project_by_project_id, add_user_project, delete_user_project, update_user_project, update_user_role_in_project, delete_project
} from "./controller.js";
// import { verify } from "jsonwebtoken";
import multer from "multer";
const storage = multer.memoryStorage(); // Store uploaded files in memory
const upload = multer({ storage: storage });

const router = express.Router();

// all routes in here are starting with  dhata/api/v1/user
router.post("/",upload.fields([{ name: 'project_photo', maxCount: 1 }]), authcheck, create_user_project_middleware, create_user_project)
router.get("/", authcheck, get_user_project)
router.get("/:project_id", authcheck, get_user_project_by_project_id)
router.patch("/:project_id",upload.fields([{ name: 'project_photo', maxCount: 1 }]),authcheck, update_user_project_middleware,update_user_project )
router.post("/interface/user",authcheck,add_user_project_middleware, add_user_project )
router.delete("/interface/user", authcheck,delete_user_project_middleware, delete_user_project )

router.patch("/interface/user/role",authcheck , update_user_role_in_project_middleware, update_user_role_in_project)

router.delete("/:project_id",authcheck, delete_project)



export default router;
