import mysql from "mysql"
import dotenv from "dotenv";

export const db = mysql.createConnection({
  host: process.env.Hostname,
  user: process.env.User,
  password: process.env.Password,
  database: process.env.Database
})