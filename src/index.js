import dotenv from 'dotenv';
import connectDB from './db/db.connection.js'

// Load Environment Variables
dotenv.config({
    path: './.env'
})

// Connecting to Database
connectDB();
