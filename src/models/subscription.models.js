import mongoose, { Schema } from 'mongoose';

const subscriptionSchema = new Schema({
    subscriber: {
        type: [Schema.Types.ObjectId],
        ref: "User",
        default: []
    },
    channel: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true })

export default Subscription = mongoose.model("Subscription", subscriptionSchema);