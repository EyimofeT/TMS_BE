import jwt from "jsonwebtoken";
import crypto from 'crypto'
import bcrypt from "bcrypt";
import { getenv } from "../../core/helper.js";
import { PrismaClient } from "@prisma/client";
import { get_user_account_by_id, update_user_by_id } from "../user/crud.js";
import { isTokenValid } from "../auth/helper.js";
import multer from 'multer';
import { add_user_to_project, create_project, read_project_x_user, read_user_project_by_user_id, read_user_project_by_user_id_project_id, delete_user_from_project, update_project, update_project_x_user, delete_project_all } from './crud.js'
import { v2 as cloudinary } from 'cloudinary';
import { is_user_admin } from "../role/helper.js";
cloudinary.config({
  cloud_name: getenv("CLOUDINARY_CLOUD_NAME"),
  api_key: getenv("CLOUDINARY_API_KEY"),
  api_secret: getenv("CLOUDINARY_API_SECRET")
});
const folderName = 'TMS';
const storage = multer.memoryStorage();
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getenv("DATABASE_URL"),
    },
  },
});

export const create_user_project = async (req, res) => {
  try {

    let token = req.headers.authorization;
    token = token.split(" ")[1];

    let token_data = await isTokenValid(token)
    if (!token_data) throw new CustomError("Access Denied", "08")
    let user_id = token_data.user_id

    let user = await get_user_account_by_id(user_id)
    if (!user) throw new CustomError("Something went wrong", "09")

    let { name, description } = req.body
    let project_id = crypto.randomUUID()
    let entry_id = crypto.randomUUID()
    let project_photo

    if (req.files.project_photo) {
      const b64 = Buffer.from(req.files.project_photo[0].buffer).toString("base64");
      let dataURI = "data:" + req.files.project_photo[0].mimetype + ";base64," + b64;
      const doc1Result = await cloudinary.uploader.upload(dataURI, {
        resource_type: 'auto',
        folder: folderName,
      });
      let cloud_image = {
        "file_name": req.files.project_photo[0].originalname,
        "file_url": doc1Result.secure_url
      }
      project_photo = doc1Result.secure_url
    }

    let project = await create_project(user.user_id, name, description, project_id, entry_id, project_photo)
    if (!project) throw new CustomError("Something went wrong trying to create project", "09")

    return res.status(200).json({
      code: 200,
      responseCode: "00",
      status: "success",
      message: "Project created successfully",
      data: project,
    });

  } catch (err) {
    return res.status(200).json({
      code: 400,
      responseCode: err.code,
      status: "failed",
      message: err.message,
      error: "An Error Occured!",
    });
  } finally {

  }
}

export const get_user_project = async (req, res) => {
  try {

    let token = req.headers.authorization;
    token = token.split(" ")[1];

    let token_data = await isTokenValid(token)
    if (!token_data) throw new CustomError("Access Denied", "08")
    let user_id = token_data.user_id

    let user = await get_user_account_by_id(user_id)
    if (!user) throw new CustomError("Something went wrong", "09")

    let project = await read_user_project_by_user_id(user.user_id)
    if (!project) throw new CustomError("Something went wrong trying to fetch projects", "09")

    return res.status(200).json({
      code: 200,
      responseCode: "00",
      status: "success",
      message: "Project fetched successfully",
      data: project,
    });

  } catch (err) {
    return res.status(200).json({
      code: 400,
      responseCode: err.code,
      status: "failed",
      message: err.message,
      error: "An Error Occured!",
    });
  } finally {

  }
}

export const get_user_project_by_project_id = async (req, res) => {
  try {

    let token = req.headers.authorization;
    token = token.split(" ")[1];

    let token_data = await isTokenValid(token)
    if (!token_data) throw new CustomError("Access Denied", "08")
    let user_id = token_data.user_id

    let user = await get_user_account_by_id(user_id)
    if (!user) throw new CustomError("Something went wrong", "09")

    let { project_id } = req.params

    let project = await read_user_project_by_user_id_project_id(user.user_id, project_id)
    if (!project) throw new CustomError("Unable to find project", "09")

    return res.status(200).json({
      code: 200,
      responseCode: "00",
      status: "success",
      message: "Project fetched successfully",
      data: project,
    });

  } catch (err) {
    return res.status(200).json({
      code: 400,
      responseCode: err.code,
      status: "failed",
      message: err.message,
      error: "An Error Occured!",
    });
  } finally {

  }
}

export const add_user_project = async (req, res) => {
  try {
    let token = req.headers.authorization;
    token = token.split(" ")[1];

    let token_data = await isTokenValid(token)
    if (!token_data) throw new CustomError("Access Denied", "08")
    let user_id = token_data.user_id

    let user = await get_user_account_by_id(user_id)
    if (!user) throw new CustomError("Something went wrong", "09")

    // let {project_id} = req.params
    let project_id = req.body.project_id
    let new_user_id = req.body.user_id
    let role = req.body.role

    //check if user exists
    if (!await get_user_account_by_id(new_user_id)) throw new CustomError("Unable to find user account", "09")

    //check if user is already part of project
    if (await read_project_x_user(new_user_id, project_id)) throw new CustomError("User has already been added to this project", "09")

    let project = await read_project_x_user(user.user_id, project_id)
    if (!project) throw new CustomError("Unabe to associate your account with the specified project", "09")

    let user_project_role = project.role
    let project_owner_id = project.project.creator_id
    let is_admin = is_user_admin(user_project_role)
    let is_project_owner = user.user_id == project_owner_id

    if (!is_admin && !is_project_owner) throw new CustomError("You do not have required permissions to perform this action", "09")

    // console.log(user_project_role == 'admin')
    // console.log(user.user_id == project_owner_id)
    // console.log(is_admin)

    let project_user_data = {
      entry_id: crypto.randomUUID(),
      user_id: new_user_id,
      project_id: project_id,
    }

    if (role != undefined && role != '') project_user_data.role = role


    // console.log(project_user_data)

    let user_x_project = await add_user_to_project(project_user_data)
    if (!user_x_project) throw new CustomError("Something went wrong", "09")
    // {
    //   entry_id,
    //   user_id,
    //   project_id,
    //   role: 'admin'
    // }


    return res.status(200).json({
      code: 200,
      responseCode: "00",
      status: "success",
      message: "User added successfully",
      data: user_x_project,
    });

  } catch (err) {
    return res.status(200).json({
      code: 400,
      responseCode: err.code,
      status: "failed",
      message: err.message,
      error: "An Error Occured!",
    });
  } finally {

  }
}

export const delete_user_project = async (req, res) => {
  try {

    let token = req.headers.authorization;
    token = token.split(" ")[1];

    let token_data = await isTokenValid(token)
    if (!token_data) throw new CustomError("Access Denied", "08")
    let user_id = token_data.user_id

    let user = await get_user_account_by_id(user_id)
    if (!user) throw new CustomError("Something went wrong", "09")

    // let {project_id} = req.params
    let project_id = req.body.project_id
    let new_user_id = req.body.user_id
    let role = req.body.role

    //check if user exists
    if (!await get_user_account_by_id(new_user_id)) throw new CustomError("Unable to find user account", "09")

    //check if user is already part of project
    if (!await read_project_x_user(new_user_id, project_id)) throw new CustomError("User is not associated with this project", "09")

    let project = await read_project_x_user(user.user_id, project_id)
    if (!project) throw new CustomError("Unabe to associate your account with the specified project", "09")

    let user_project_role = project.role
    let project_owner_id = project.project.creator_id
    let is_admin = is_user_admin(user_project_role)
    let is_project_owner = user.user_id == project_owner_id

    if (!is_admin && !is_project_owner) throw new CustomError("You do not have required permissions to perform this action", "09")
    if (new_user_id == project_owner_id) throw new CustomError("You do not have required permissions to perform this action", "09")
    if (user.user_id == new_user_id) throw new CustomError("You cannot perform this action", "09")


    let delete_status = await delete_user_from_project(new_user_id, project_id)
    if (!delete_status) throw new CustomError("Something went wrong while trying to delete user from project", "09")


    return res.status(200).json({
      code: 200,
      responseCode: "00",
      status: "success",
      message: "User deleted from project successfully",
      data: delete_status,
    });

  } catch (err) {
    return res.status(200).json({
      code: 400,
      responseCode: err.code,
      status: "failed",
      message: err.message,
      error: "An Error Occured!",
    });
  } finally {

  }
}
export const delete_project = async (req, res) => {
  try {

    let token = req.headers.authorization;
    token = token.split(" ")[1];

    let token_data = await isTokenValid(token)
    if (!token_data) throw new CustomError("Access Denied", "08")
    let user_id = token_data.user_id

    let user = await get_user_account_by_id(user_id)
    if (!user) throw new CustomError("Something went wrong", "09")

    let {project_id} = req.params

    let project = await read_project_x_user(user.user_id, project_id)
    if (!project) throw new CustomError("Unabe to associate your account with the specified project", "09")

    let project_owner_id = project.project.creator_id
    let is_project_owner = user.user_id == project_owner_id

    if ( !is_project_owner) throw new CustomError("You do not have required permissions to perform this action", "09")


    let delete_status = await delete_project_all(project_id)
    if (!delete_status) throw new CustomError("Something went wrong while trying to delete user from project", "09")


    return res.status(200).json({
      code: 200,
      responseCode: "00",
      status: "success",
      message: "Project deleted successfully",
      data: delete_status,
    });

  } catch (err) {
    return res.status(200).json({
      code: 400,
      responseCode: err.code,
      status: "failed",
      message: err.message,
      error: "An Error Occured!",
    });
  } finally {

  }
}


export const update_user_project = async (req, res) => {
  try {

    let token = req.headers.authorization;
    token = token.split(" ")[1];

    let token_data = await isTokenValid(token)
    if (!token_data) throw new CustomError("Access Denied", "08")
    let user_id = token_data.user_id

    let user = await get_user_account_by_id(user_id)
    if (!user) throw new CustomError("Something went wrong", "09")

    let { project_id } = req.params
    if (!project_id || project_id == undefined || project_id == "") throw new CustomError("Invalid project_id supplied", "09")

    let user_x_project = await read_project_x_user(user.user_id, project_id)
    if (!user_x_project) throw new CustomError("You are not associated with this project", "09")

    if (!is_user_admin(user_x_project.role) && user.user_id != user_x_project.project.creator_id) throw new CustomError("You are not authorized to perform the action", "09")

    let project_update_data = {
      ...req.body
    }

    if (req.files.project_photo) {
      const b64 = Buffer.from(req.files.project_photo[0].buffer).toString("base64");
      let dataURI = "data:" + req.files.project_photo[0].mimetype + ";base64," + b64;
      const doc1Result = await cloudinary.uploader.upload(dataURI, {
        resource_type: 'auto',
        folder: folderName,
      });
      let cloud_image = {
        "file_name": req.files.project_photo[0].originalname,
        "file_url": doc1Result.secure_url
      }
      project_update_data.project_photo = doc1Result.secure_url
    }

    // console.log(project_update_data)
    let update = await update_project(project_id, project_update_data)
    if (!update) throw new CustomError(`Something went wrong`, "09")



    return res.status(200).json({
      code: 200,
      responseCode: "00",
      status: "success",
      message: "Project updated successfully",
      data: update,
    });

  }
  catch (err) {
    return res.status(200).json({
      code: 400,
      responseCode: err.code,
      status: "failed",
      message: err.message,
      error: "An Error Occured!",
    });
  } finally {

  }
}

export const update_user_role_in_project = async (req, res) => {
  try {

    let token = req.headers.authorization;
    token = token.split(" ")[1];

    let token_data = await isTokenValid(token)
    if (!token_data) throw new CustomError("Access Denied", "08")
    let active_user_id = token_data.user_id

    let user = await get_user_account_by_id(active_user_id)
    if (!user) throw new CustomError("Something went wrong", "09")

    let { project_id, user_id, role } = req.body
  
    let user_x_project = await read_project_x_user(user.user_id, project_id)
    if (!user_x_project) throw new CustomError("You are not associated with this project", "09")

    // console.log("role - admin", role == 'admin')
    // console.log("role - member", role == 'member')

    if (role == 'admin' && !is_user_admin(user_x_project.role) && user.user_id != user_x_project.project.creator_id) throw new CustomError("You are not authorized to perform the action", "09")
    if (role == 'member' &&  user.user_id != user_x_project.project.creator_id) throw new CustomError("You are not authorized to perform the action", "09")
   
    // console.log(await read_project_x_user(user_id, project_id))
    let current_entry = await read_project_x_user(user_id, project_id) 
    if(!current_entry) throw new CustomError("User not associated with this project", "09")
    if(current_entry.role == role) throw new CustomError(`User is already a(n) ${role}`, "09")

    // {
    //   entry_id: '05d85950-142a-4f4a-91cb-d879f60ec7e3',
    //   user_id: 'ef2c2467-60dc-4c4a-9460-5c15d9e20e2b',
    //   project_id: 'fa3ca993-7c0e-48c7-8577-80c855735464',
    //   role: 'member',
    //   assignedAt: 2024-08-12T19:17:42.681Z,
    //   project: {
    //     id: 5,
    //     project_photo: 'https://res.cloudinary.com/dp1cc2ste/image/upload/v1723538921/TMS/qjcwgd2l60xsb0euqxch.jpg',
    //     project_id: 'fa3ca993-7c0e-48c7-8577-80c855735464',
    //     name: 'issie',
    //     description: 'train issie on how to behave',
    //     created_at: 2024-08-12T19:13:59.986Z,
    //     updated_at: 2024-08-13T08:48:43.698Z,
    //     creator_id: '553467b3-972e-4bbd-a289-0c526c2dbadc'
    //   }
    // }

    let where_data = {
      entry_id :current_entry.entry_id,
      project_id, 
      user_id
    }
    let update_data = {
      role
    }
    let update = await update_project_x_user(where_data,update_data)
    if(!update) throw new CustomError("Something went wrong", "09")


    return res.status(200).json({
      code: 200,
      responseCode: "00",
      status: "success",
      message: "Role updated successfully",
      data: update,
    });

  }
  catch (err) {
    return res.status(200).json({
      code: 400,
      responseCode: err.code,
      status: "failed",
      message: err.message,
      error: "An Error Occured!",
    });
  } finally {

  }
}