import userFunctions from '../controllers/user.controller.js';
import { Router } from 'express';

const router = Router();

router.route('/register').post(userFunctions.registerUser);

export default router;