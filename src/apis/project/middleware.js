
export const authcheck = async (req, res, next) => {
  try {
    // console.log(req.headers)
    let token = req.headers.authorization;
    if (!token) throw new CustomError("Authentication token required","05");
    next();
  } catch (err) {
    return res.status(200).json({
      code: 400 ,
      responseCode: err.code ,
      status: "failed",
      message: err.message,
      error: "An Error Occured!",
    });
  }
};

export const create_user_project_middleware = async (req, res, next) => {
  try {
  
    let {name, description} = req.body

    if(!name) throw new CustomError("name required","02")
    if(!description) throw new CustomError("description required","02")

    if(!req.files.project_photo) throw new CustomError("file - project_photo required", "02")
    
  for(const key in req.body){
    if(typeof  req.body[key]  == 'string')  req.body[key] = req.body[key].toLowerCase().trim()
  }

    next();
  } catch (err) {
    return res.status(200).json({
      code: 400 ,
      responseCode: err.code ,
      status: "failed",
      message: err.message,
      error: "An Error Occured!",
    });
  }
}

export const add_user_project_middleware = async (req, res, next) => {
  try {
  
    let {user_id, project_id, role} = req.body

    if(!user_id) throw new CustomError("user_id required","02")
    if(!project_id) throw new CustomError("project_id required","02")

    if(role){
    if(role === "") throw new CustomError(`Invalid role value ${role}`, "02");
    const valid_role = ["admin", "member"];
    if(!valid_role.includes(role.toLowerCase())) throw new CustomError(`Invalid role value ${role}`, "02");
    }
  
    
  for(const key in req.body){
    if(typeof  req.body[key]  == 'string')  req.body[key] = req.body[key].toLowerCase().trim()
  }

    next();
  } catch (err) {
    return res.status(200).json({
      code: 400 ,
      responseCode: err.code ,
      status: "failed",
      message: err.message,
      error: "An Error Occured!",
    });
  }
}

export const delete_user_project_middleware = async (req, res, next) => {
  try {
  
    let {user_id, project_id} = req.body

    if(!user_id) throw new CustomError("user_id required","02")
    if(!project_id) throw new CustomError("project_id required","02")
  
    
  for(const key in req.body){
    if(typeof  req.body[key]  == 'string')  req.body[key] = req.body[key].toLowerCase().trim()
  }

    next();
  } catch (err) {
    return res.status(200).json({
      code: 400 ,
      responseCode: err.code ,
      status: "failed",
      message: err.message,
      error: "An Error Occured!",
    });
  }
}

export const update_user_project_middleware = async (req, res, next) => {
  try {
    const allowedKeys = [
      "project_photo",
      "name",
      "description",
    ]
    for (const key in req.body) {
      if (!allowedKeys.includes(key)) {
        delete req.body[key];
      }
    }

    for (const key in req.body) {
      if (typeof req.body[key] == 'string') req.body[key] = req.body[key].toLowerCase().trim()
    }

    
    next();
  } catch (err) {
    return res.status(200).json({
      code: 400,
      responseCode: err.code,
      status: "failed",
      message: err.message,
      error: "An Error Occured!",
    });
  }
};

export const update_user_role_in_project_middleware = async (req, res, next) => {
  try {
  
    let {user_id, project_id, role} = req.body

    if(!user_id) throw new CustomError("user_id required","02")
    if(!project_id) throw new CustomError("project_id required","02")

    if(!role)  throw new CustomError("role required","02")
   
    if(role === "") throw new CustomError(`Invalid role value ${role}`, "02");
    const valid_role = ["admin", "member"];
    if(!valid_role.includes(role.toLowerCase())) throw new CustomError(`Invalid role value ${role}`, "02");
    
    
  for(const key in req.body){
    if(typeof  req.body[key]  == 'string')  req.body[key] = req.body[key].toLowerCase().trim()
  }

    next();
  } catch (err) {
    return res.status(200).json({
      code: 400 ,
      responseCode: err.code ,
      status: "failed",
      message: err.message,
      error: "An Error Occured!",
    });
  }
}