import dbConnect from "./db/index.js";
import dotenv from "dotenv";
import {app} from "./app.js";

dotenv.config({
  path: "./.env",
});

dbConnect()
  .then(() => {
    app.on("error", (error) => {
      console.log("ERRR: ", error);
      throw error;
    });
    app.listen(process.env.PORT || 8000, () => {
      console.log(`server is running at port no. ${process.env.PORT}`);
    });
    app.get('/', (req, res)=>{
      res.send("hello world")
    })
  })
  .catch((err) => {
    console.log("MONGODB connection failed: ", err);
  });
