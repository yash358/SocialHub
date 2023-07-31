import mysql from "mysql"
import dotenv from "dotenv";

export const db = mysql.createConnection({
  host:"localhost",
  user:"root",
  password: process.env.Password,
  database: process.env.Database
})