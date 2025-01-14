import dotenv from 'dotenv';
import connectDB from './db/db.connection.js'
import { app } from './app.js';


// Load Environment Variables
dotenv.config({
    path: './.env'
})

// Connecting to Database
connectDB().then(() => {
    app.on('error', (error) => {
        console.log('Connection to database failed.', error);
    })
    app.listen(process.env.PORT || 5001, () => {
        console.log(`Server is running on port ${process.env.PORT || 5001}`)
    })
}).catch(err => console.log('Error connecting to database', err));


// Routing
import userRouter from './routes/user.routes.js';
import tweetRouter from './routes/tweet.routes.js';
import commentRouter from './routes/comment.routes.js';
import videoRouter from './routes/video.routes.js';
import playlistRouter from './routes/playlist.routes.js';
import likeRouter from './routes/like.routes.js';

app.use('/api/v1/users', userRouter);
app.use('/api/v1/tweets', tweetRouter);
app.use('/api/v1/comments', commentRouter);
app.use('/api/v1/videos', videoRouter);
app.use('/api/v1/playlists', playlistRouter);
app.use('/api/v1/likes', likeRouter);