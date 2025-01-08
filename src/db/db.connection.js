import mongoose from "mongoose";
import { DB_NAME } from '../constants.js'

const connectDB = async () => {
    try {
        const connection_response = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        if (connection_response) {
            console.log(`Database Connection Successful. HOST: ${connection_response.connection.host}`);
        } else {
            console.log('Database Connection Failed');
        }
    } catch (error) {
        console.log('Connection Error: ', error);
        process.exit(1);
    }
}

export default connectDB;