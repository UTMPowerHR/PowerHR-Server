import mongoose from 'mongoose';

const applicationSchema = mongoose.Schema({
    posting: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Posting',
        required: true,
    },

    applicant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    resume: {
        type: String,
    },

    status: {
        statusType: {
            type: String,
            enum: ['New', 'Viewed', 'Interviewed', 'Rejected', 'Accepted', 'Withdrawn', 'Other', 'Closed', 'Deleted'],
            default: 'New',
        },
        reason: {
            category: {
                type: String,
                enum: ['Overqualified', 'Underqualified', 'Not a good fit', 'Not interested', 'Not available', 'Other'],
            },
            description: String,
        },
        statusDate: {
            type: Date,
            default: Date.now,
        },
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },

    interview: [
        {
            //Either Employee or HR or Both
            interviewer: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
            ],

            interviewDate: Date,

            interviewType: {
                type: String,
                enum: ['Phone', 'Video', 'In-Person', 'Other'],
            },

            status: {
                type: String,
                enum: ['New', 'Scheduled', 'Completed', 'Cancelled', 'Rescheduled', 'Other'],
                default: 'New',
            },

            link: String,

            address: {
                street: String,
                city: String,
                state: String,
                zip: String,
                country: String,
            },
        },
    ],

    offer: {
        offerDate: Date,

        offerletter: String,

        status: {
            statusType: {
                type: String,
                enum: ['New', 'Viewed', 'Accepted', 'Rejected'],
            },
            statusDate: {
                type: Date,
            },
        },
    },
});

const Application = mongoose.model('Application', applicationSchema);

export default Application;
