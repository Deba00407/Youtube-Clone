import multer from "multer";
import { nanoid } from "nanoid";


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/Temp')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + nanoid()
        cb(null, file.fieldname + '-' + uniqueSuffix)
    }
})

export const upload = multer({ storage: storage })