import mongoose from 'mongoose';

const resumeSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    basicDetail: {
        name: String,
        title: String,
        imageURL: String,
        email: String,
        phone: String,
        location: String,
        websiteUrl: {
            linkedin: String,
            github: String,
            portfolio: String,
        },
    },

    summary: {
        name: {
            type: String,
            default: 'Summary',
        },
        value: [
            {
                type: String,
            },
        ],
    },

    objective: {
        name: {
            type: String,
            default: 'Objective',
        },
        value: [
            {
                type: String,
            },
        ],
    },

    experience: {
        name: {
            type: String,
            default: 'Experience',
        },
        value: [
            {
                company: String,
                location: String,
                title: String,
                date: {
                    from: {
                        type: String,
                    },
                    to: {
                        type: String,
                    },
                },
                description: [
                    {
                        type: String,
                    },
                ],
            },
        ],
    },

    education: {
        name: {
            type: String,
            default: 'Education',
        },
        value: [
            {
                institution: String,
                degree: String,
                date: {
                    from: {
                        type: String,
                    },
                    to: {
                        type: String,
                    },
                },
                description: [
                    {
                        type: String,
                    },
                ],
            },
        ],
    },

    awards: {
        name: {
            type: String,
            default: 'Awards',
        },
        value: [
            {
                name: String,
                from: String,
                date: {
                    type: String,
                },
                description: [
                    {
                        type: String,
                    },
                ],
            },
        ],
    },

    languages: {
        name: {
            type: String,
            default: 'Languages',
        },
        value: [
            {
                name: String,
                level: String,
            },
        ],
    },

    technicalSkills: {
        name: {
            type: String,
            default: 'Technical Skills',
        },
        value: [
            {
                name: String,
                level: String,
            },
        ],
    },

    softSkills: {
        name: {
            type: String,
            default: 'Soft Skills',
        },
        value: [
            {
                name: String,
                level: String,
            },
        ],
    },

    voluntering: {
        name: {
            type: String,
            default: 'Voluntering',
        },
        value: [
            {
                name: String,
                from: String,
                date: {
                    from: {
                        type: String,
                    },
                    to: {
                        type: String,
                    },
                },
                description: [
                    {
                        type: String,
                    },
                ],
            },
        ],
    },

    references: {
        name: {
            type: String,
            default: 'References',
        },
        value: [
            {
                name: String,
                company: String,
                phone: String,
                email: String,
            },
        ],
    },

    template: {
        name: {
            type: String,
            default: 'modern',
        },
        settings: {
            titleColor: String,
            contentColor: String,
            backgroundColor1: String,
            backgroundColor2: String,
            backgroundColor3: String,
        },
        pages: [
            {
                columns: [
                    {
                        list: [
                            {
                                name: String,
                                typeCard: String,
                            },
                        ],
                    },
                ],
            },
        ],
    },
    downloadableLink: {
        type: String,
        default: null, // Initially, no file is uploaded
    },
});

const Resume = mongoose.model('Resume', resumeSchema);

export default Resume;
