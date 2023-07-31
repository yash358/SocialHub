import { db } from "../connect.js";
import jwt from "jsonwebtoken";
import { hashPassword } from "../authHelper.js";
import nodemailer from 'nodemailer';

export const getUser = (req, res) => {
  const userId = req.params.userId;
  const q = "SELECT * FROM users WHERE id=?";

  db.query(q, [userId], (err, data) => {
    if (err) return res.status(500).json(err);
    const { password, ...info } = data[0];
    return res.json(info);
  });
};

export const updateUser = (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not authenticated!");

  jwt.verify(token, "secretkey", async (err, userInfo) => {
    if (err) return res.status(403).json("Token is not valid!");

    const hashedpassword = req.body.password !== undefined ? await hashPassword(String(req.body.password)) : null;

    const q = req.body.password !== undefined  ? "UPDATE users SET `name`=?,`city`=?,`website`=?,`profilePic`=?,`coverPic`=? , `password`=? WHERE id=? " : 
      "UPDATE users SET `name`=?,`city`=?,`website`=?,`profilePic`=?,`coverPic`=?WHERE id=? ";
    
      const values = req.body.password !== undefined ? [
        req.body.name,
        req.body.city,
        req.body.website,
        req.body.coverPic,
        req.body.profilePic,
        hashedpassword,
        userInfo.id,
      ] :
      [
        req.body.name,
        req.body.city,
        req.body.website,
        req.body.coverPic,
        req.body.profilePic,
        userInfo.id,
      ];
    db.query(
      q,
      values,
      (err, data) => {
        if (err) res.status(500).json(err);
        if (data.affectedRows > 0) return res.json("Updated!");
        return res.status(403).json("You can update only your profile!");
      }
    );


  });
};

const mailer = (email, otp)=>{
  const transporter = nodemailer.createTransport({
    service : "gmail",
    port : 587,
    secure : false,
    auth : {
      user : "2020uee1985@mnit.ac.in",
      pass : "Yash8741006234!!"
    }
  });

  const mailOptions = {
    from : '2020uee1985@mnit.ac.in',
    to : email,
    subject : 'Sending Email using Node.js',
    text : `Thank You! Your OTP is ${otp}`
  }

  transporter.sendMail(mailOptions, function(err, info){
    if(err) console.log(err);
    else{
      console.log('Email Sent' + info.response);
    }
  })
}

export const emailSend =  (req, res)=>{
  const q = "SELECT * FROM users WHERE `email`=?";
  console.log("email ", req.body.email);
    db.query(q, [req.body.email],(err, data)=>{
      if (err) return res.status(500).json(err);
      console.log(data)
      if (data.length === 0) return res.status(404).json("Email is not registered");

      let otpCode = Math.floor(Math.random() * 9000 + 1000);

      const que = "INSERT INTO otp (`email`,`code`,`expiresIn`) VALUE (?)"

      const values = [req.body.email, otpCode, String(new Date().getTime() + 300*1000)];

      db.query(que,[values], (err,data)=>{
        if (err) return res.status(500).json(err);
        mailer(req.body.email, otpCode);
        return res.status(200).json("Please Check your Email");
      })
    })
}

export const changePassword = (req, res)=>{
  const q = "SELECT * FROM otp WHERE `email`=? ORDER BY expiresIn DESC";
  console.log("cp-email ", req.body.email);
  db.query(q, [req.body.email], (err, data)=>{
    if (err) return res.status(500).json(err);
    if (data.length === 0) return res.status(404).json("Something went wrong");

    let currentTime = new Date().getTime();
    let diff =  Number(data[0].expiresIn) - currentTime;
    if(diff < 0) return res.status(404).json("Token expire");
    if(data[0].code !== Number(req.body.otp)) return res.status(404).json("Wrong OTP");
    if(req.body.password !== req.body.cpassword) return res.status(404).json("Password not match");

    const que = "SELECT * FROM users WHERE `email`=?";
    db.query(que, [req.body.email], async (err, data)=>{
      if (err) return res.status(500).json(err);
      if (data.length === 0) return res.status(404).json("User not found");

      const hashedPassword = await hashPassword(req.body.password);

      const q1 = "UPDATE users SET `password`=? WHERE  `email`=?";
      db.query(q1, [hashedPassword, req.body.email], (err, data)=>{
        if (err) return res.status(500).json(err);
        return res.status(200).json("Password changed successfully");
      })
    })
  })
}

export const getFollowers = (req , res)=>{
  const q = "SELECT * FROM relationships WHERE `followerUserId`=?";
  // console.log("id ", req.query.id)
  db.query(q, [req.query.id], (err, data)=>{
    if (err) return res.status(500).json(err);
    if (data.length === 0) return res.status(200).json("Not following Anyone");

    
    const ids = []
    data.map(row =>{
      ids.push(row.followedUserId);
    })
    // console.log("ids ", ids)
    const que = "SELECT id ,name, profilePic FROM users WHERE id IN (?)";
    db.query(que, [ids], (err, data)=>{
      if(err || data.length===0) return;
      
      const users = []
      data.map(u =>{
        u = JSON.stringify(u)
        u = JSON.parse(u)

        // console.log("u ", u)
        users.push({id : u.id, name : u.name, profilePic : u.profilePic});
      })
      // console.log("users ", users)
      return res.json(users)
    })
  })
}
export const getFollowed = (req , res)=>{
  const q = "SELECT * FROM relationships WHERE `followedUserId`=?";
  // console.log("id ", req.query.id)
  db.query(q, [req.query.id], (err, data)=>{
    if (err) return res.status(500).json(err);
    if (data.length === 0) return res.status(200).json("Not following Anyone");

    
    const ids = []
    data.map(row =>{
      ids.push(row.followerUserId);
    })
    // console.log("ids ", ids)
    const que = "SELECT id ,name, profilePic FROM users WHERE id IN (?)";
    db.query(que, [ids], (err, data)=>{
      if(err || data.length===0) return;
      
      const users = []
      data.map(u =>{
        u = JSON.stringify(u)
        u = JSON.parse(u)

        // console.log("u ", u)
        users.push({id : u.id ,name : u.name, profilePic : u.profilePic});
      })
      // console.log("users ", users)
      return res.json(users)
    })
  })
}
export const getOthers = (req , res)=>{
  const q = "SELECT * FROM relationships WHERE `followedUserId`= ? OR `followerUserId`= ?";
  // console.log("id ", req.query.id)
  db.query(q, [req.query.id, req.query.id], (err, data)=>{
    if (err) return res.status(500).json(err);
    if (data.length === 0) return res.status(200).json("Not following Anyone");

    
    const ids = new Set();
    data.map(row =>{
      ids.add(row.followerUserId);
      ids.add(row.followedUserId);
    })
    console.log("ids ", ids)
    const que = "SELECT id ,name, profilePic FROM users WHERE id NOT IN (?)";
    db.query(que, [ids], (err, data)=>{
      if(err || data.length===0) return;
      
      const users = []
      data.map(u =>{
        u = JSON.stringify(u)
        u = JSON.parse(u)

        // console.log("u ", u)
        users.push({id : u.id, name : u.name, profilePic : u.profilePic});
      })
      // console.log("users ", users)
      return res.json(users)
    })
  })
}