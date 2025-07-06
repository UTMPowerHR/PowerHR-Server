import { Job, Posting, Application } from '../../../models/enterprise/job/index.js';
import { Resume } from '../../../models/resume/index.js';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import cloneDeep from 'lodash/cloneDeep.js';
import ApiError from '../../../util/ApiError.js';

dayjs.extend(customParseFormat);
class JobController {
    constructor(enterpriseFacade) {
        this.enterpriseFacade = enterpriseFacade;
    }

    async createPosting(data) {
        const { create, companyId, userId } = data;

        const job = await Job.create({
            title: create.title,
            employmentType: create.category,
            company: companyId,
            environment: create.environment,
            industry: create.industry,
        });

        const posting = await Posting.create({
            job: job._id,
            createdBy: userId,
            description: create.description,
            quota: create.quota,
            tags: create.tags,
            salaryRange: {
                min: create.salaryRange[0],
                max: create.salaryRange[1],
            },
            qualification: create.qualification,
            experience: {
                min: create.experience[0],
                max: create.experience[1],
            },
            languages: create.languages,
            technicalSkills: create.technicalSkills,
            softSkills: create.softSkills,
            gender: create.gender,
        });

        return posting;
    }

    async updatePosting(postingId, data) {
        const { create, jobId } = data;

        await Job.findByIdAndUpdate(jobId, {
            title: create.title,
            employmentType: create.category,
            environment: create.environment,
            industry: create.industry,
        });

        await Posting.findByIdAndUpdate(postingId, {
            description: create.description,
            quota: create.quota,
            tags: create.tags,
            salaryRange: {
                min: create.salaryRange[0],
                max: create.salaryRange[1],
            },
            qualification: create.qualification,
            experience: {
                min: create.experience[0],
                max: create.experience[1],
            },
            languages: create.languages,
            technicalSkills: create.technicalSkills,
            softSkills: create.softSkills,
            gender: create.gender,
        });

        return true;
    }

    async getPosting(postingId) {
        const posting = await Posting.findById(postingId).populate('job');

        return posting;
    }

    async getPostings(companyId) {
        const postings = await Posting.find({ job: { $in: await Job.find({ company: companyId }) } }).populate('job');

        // Calculate number of applications for each posting
        const applications = await Application.aggregate([
            { $match: { posting: { $in: postings.map((posting) => posting._id) } } },
            {
                $group: {
                    _id: '$posting',
                    count: { $sum: 1 },
                },
            },
        ]);

        const postingList = postings.map((posting) => {
            const application = applications.find((application) => application._id.equals(posting._id));

            return {
                ...posting._doc,
                applications: application ? application.count : 0,
            };
        });

        return postingList;
    }

    async getAllPostings() {
        const postings = await Posting.find({})
            .populate('job')
            .populate({
                path: 'job',
                populate: {
                    path: 'company',
                },
            });

        //Arrange postings by company

        const companies = [];

        postings.forEach((posting) => {
            const company = companies.find((company) => company._id === posting.job.company._id);

            if (company) {
                company.postings.push(posting);
            } else {
                companies.push({
                    _id: posting.job.company._id,
                    name: posting.job.company.name,
                    postings: [posting],
                });
            }
        });

        return companies;
    }

    async createApplication(postingId, applicantId) {
        const application = await Application.create({
            posting: postingId,
            applicant: applicantId,
        });

        //Update applicant's application list
        await this.enterpriseFacade.findByIdAndUpdateApplicant(applicantId, {
            $push: { appliedJobs: application._id },
        });

        return application;
    }

    async getApplicationsByPosting(postingId) {
        const applications = await Application.find({ posting: postingId })
            .populate('applicant')
            .populate('posting')
            .populate({
                path: 'applicant',
                populate: {
                    path: 'resume',
                },
            })
            .populate({
                path: 'posting',
                populate: {
                    path: 'job',
                    populate: {
                        path: 'company',
                    },
                },
            })
            .lean();

        const filteredApplications = applications.map((application) => {
            return {
                _id: application._id,
                applicant: {
                    _id: application.applicant._id,
                    firstName: application.applicant.firstName,
                    lastName: application.applicant.lastName,
                    email: application.applicant.email,
                    resume: application.applicant.resume,
                },
                posting: {
                    ...application.posting,
                    job: {
                        ...application.posting.job,
                        company: {
                            address: application.posting.job.company.address,
                            name: application.posting.job.company.name,
                            _id: application.posting.job.company._id,
                            email: application.posting.job.company.email,
                            phone: application.posting.job.company.phone,
                        },
                    },
                },
                status: application.status,
                createdAt: application.createdAt,
                updatedAt: application.updatedAt,
            };
        });

        //Rearrange applications by posting
        const postings = [];

        filteredApplications.forEach((application) => {
            const posting = postings.find((posting) => posting.posting._id === application.posting._id);

            if (posting) {
                posting.applications.push({
                    _id: application._id,
                    applicant: application.applicant,
                    status: application.status,
                    createdAt: application.createdAt,
                    updatedAt: application.updatedAt,
                });
            }

            if (!posting) {
                postings.push({
                    posting: application.posting,
                    applications: [
                        {
                            _id: application._id,
                            applicant: application.applicant,
                            status: application.status,
                            createdAt: application.createdAt,
                            updatedAt: application.updatedAt,
                        },
                    ],
                });
            }
        });

        return postings;
    }

    async getAllApplication(companyId, status) {
        const filter = [];

        if (status) {
            if (status === 'Completed')
                filter['status.statusType'] = { $in: ['Accepted', 'Rejected', 'Withdrawn', 'Closed'] };
            else filter['status.statusType'] = status;
        }

        const applications = await Application.find({
            posting: { $in: await Posting.find({ job: { $in: await Job.find({ company: companyId }) } }) },
            ...filter,
        })
            .populate('applicant')
            .populate({
                path: 'applicant',
                populate: {
                    path: 'resume',
                },
            })
            .populate('posting')
            .populate({
                path: 'posting',
                populate: {
                    path: 'job',
                    populate: {
                        path: 'company',
                    },
                },
            })
            .lean();

        const filteredApplications = applications.map((application) => {
            return {
                _id: application._id,
                applicant: {
                    _id: application.applicant._id,
                    firstName: application.applicant.firstName,
                    lastName: application.applicant.lastName,
                    email: application.applicant.email,
                    gender: application.applicant.gender,
                    resume: application.applicant.resume,
                },
                posting: {
                    ...application.posting,
                    job: {
                        ...application.posting.job,
                        company: {
                            address: application.posting.job.company.address,
                            name: application.posting.job.company.name,
                            _id: application.posting.job.company._id,
                            email: application.posting.job.company.email,
                            phone: application.posting.job.company.phone,
                        },
                    },
                },
                status: application.status,
                createdAt: application.createdAt,
                updatedAt: application.updatedAt,
            };
        });

        //Rearrange applications by posting
        const postings = [];

        filteredApplications.forEach((application) => {
            const posting = postings.find((posting) => posting.posting._id === application.posting._id);

            if (posting) {
                posting.applications.push({
                    _id: application._id,
                    applicant: application.applicant,
                    status: application.status,
                    createdAt: application.createdAt,
                    updatedAt: application.updatedAt,
                });
            }

            if (!posting) {
                postings.push({
                    posting: application.posting,
                    applications: [
                        {
                            _id: application._id,
                            applicant: application.applicant,
                            status: application.status,
                            createdAt: application.createdAt,
                            updatedAt: application.updatedAt,
                        },
                    ],
                });
            }
        });

        return postings;
    }

    async getListIdApplications(userId) {
        const postings = await Application.find({ applicant: userId }).select('posting');

        return postings;
    }

    async getApplicationsByApplicant(applicantId) {
        //populate posting and posting.job
        const applications = await Application.find({ applicant: applicantId })
            .populate('posting')
            .populate({
                path: 'posting',
                populate: {
                    path: 'job',
                },
            })
            .populate({
                path: 'posting',
                populate: {
                    path: 'job',
                    populate: {
                        path: 'company',
                    },
                },
            });

        return applications;
    }

    async updateApplication(applicationId, data) {
        const updatedApplication = await Application.findByIdAndUpdate(applicationId, { $set: data }, { new: true });

        if (!updatedApplication) {
            return new ApiError(404, 'Application not found');
        }

        return updatedApplication;
    }

    async analyticOptionsApplications(companyId, status) {
        const filter = [];

        if (status) {
            if (status === 'Completed')
                filter['status.statusType'] = { $in: ['Accepted', 'Rejected', 'Withdrawn', 'Closed'] };
            else filter['status.statusType'] = status;
        }

        const applications = await Application.find({
            posting: { $in: await Posting.find({ job: { $in: await Job.find({ company: companyId }) } }) },
            ...filter,
        })
            .populate('applicant')
            .populate({
                path: 'applicant',
                populate: {
                    path: 'resume',
                },
            })
            .populate('posting')
            .populate({
                path: 'posting',
                populate: {
                    path: 'job',
                    populate: {
                        path: 'company',
                    },
                },
            })
            .lean();

        const temp = [];

        applications.forEach((application) => {
            // Extract relevant data from the response
            const createdAt = {
                year: dayjs(application.createdAt).year().toString(),
                month: dayjs(application.createdAt).month(),
            };
            const employmentType = application.posting.job.employmentType;
            const jobTitle = application.posting.job.title;
            const jobId = application.posting._id;
            const education = application.applicant.resume?.education?.value?.reduce((prev, current) => {
                if (!prev || !prev.date || !prev.date.end) return current;
                if (!current || !current.date || !current.date.end) return prev;

                return prev.date.end > current.date.end ? prev : current;
            }, null);

            const statusType = application.status.statusType;

            temp.push({
                createdAt,
                employmentType,
                jobTitle,
                jobId,
                education,
                statusType,
            });
        });

        const uniqueYears = [...new Set(temp.map((item) => item.createdAt.year))];
        const uniqueEmploymentTypes = [...new Set(temp.map((item) => item.employmentType))];
        const uniqueJobTitles = [...new Set(temp.map((item) => item.jobId))];

        const options = {
            years: uniqueYears,
            employmentTypes: uniqueEmploymentTypes,
            jobTitles: uniqueJobTitles.map((jobId) => {
                const job = temp.find((item) => item.jobId === jobId);
                return {
                    id: jobId,
                    jobTitle: job.jobTitle,
                };
            }),
        };

        return options;
    }

    async analyticCompletedApplications(companyId, years, employmentTypes, jobTitles, status) {
        const filter = [];

        if (status) {
            if (status === 'Completed')
                filter['status.statusType'] = { $in: ['Accepted', 'Rejected', 'Withdrawn', 'Closed'] };
            else filter['status.statusType'] = status;
        }

        const applications = await Application.find({
            posting: { $in: await Posting.find({ job: { $in: await Job.find({ company: companyId }) } }) },
            ...filter,
        })
            .populate('applicant')
            .populate({
                path: 'applicant',
                populate: {
                    path: 'resume',
                },
            })
            .populate('posting')
            .populate({
                path: 'posting',
                populate: {
                    path: 'job',
                    populate: {
                        path: 'company',
                    },
                },
            })
            .lean();

        const temp = [];

        applications.forEach((application) => {
            // Extract relevant data from the response
            const createdAt = {
                year: dayjs(application.createdAt).year().toString(),
                month: dayjs(application.createdAt).month(),
            };
            const employmentType = application.posting.job.employmentType;
            const jobTitle = application.posting.job.title;
            const jobId = application.posting._id;
            const education = application.applicant.resume?.education?.value?.reduce((prev, current) => {
                if (!prev || !prev.date || !prev.date.end) return current;
                if (!current || !current.date || !current.date.end) return prev;

                return prev.date.end > current.date.end ? prev : current;
            }, null);
            const statusType = application.status.statusType;

            temp.push({
                createdAt,
                employmentType,
                jobTitle,
                jobId,
                education,
                statusType,
            });
        });

        const count = Array(12).fill(0);

        temp.forEach((application) => {
            if (years.includes(application.createdAt.year)) {
                if (employmentTypes.includes(application.employmentType)) {
                    if (jobTitles.map((job) => job.id.toString()).includes(application.jobId.toString())) {
                        count[application.createdAt.month] += 1;
                    }
                }
            }
        });

        const series = count.map((item, index) => {
            return {
                month: dayjs().month(index).format('MMMM'),
                value: item,
            };
        });

        return series;
    }

    async populateResumeForApplications() {
        try {
            // Fetch all applications
            const applications = await Application.find().populate('applicant');

            for (const application of applications) {
                // Find the resume for the applicant
                const applicantData = await application.findById(application.applicant);
                if (applicantData && applicantData.resume) {
                    // Update the application with the resume reference
                    application.resume = applicantData.resume;
                    await application.save();
                }
            }

            console.log('Applications updated with resume references.');
        } catch (error) {
            console.error('Error populating resume for applications:', error);
            throw new ApiError(500, 'Failed to populate resume for applications');
        }
    }

    async filterApplications(postingId, bodyRequirements) {
        const posting = await Posting.findById(postingId);

        const listLanguages = posting.languages.map((language) => language.name.toLowerCase()) || [];
        console.log('help', listLanguages);
        const listTechnicalSkills = posting.technicalSkills.map((skill) => skill.name.toLowerCase()) || [];
        console.log('help', listTechnicalSkills);
        const listSoftSkills = posting.softSkills.map((skill) => skill.name.toLowerCase()) || [];
        console.log('help2', listSoftSkills);
        const experience = posting.experience;

        // Validate and sanitize requirements
        const safeRequirements = {
            ...bodyRequirements,
            languages: Array.isArray(bodyRequirements?.languages) ? bodyRequirements.languages : listLanguages,
            technicalSkills: Array.isArray(bodyRequirements?.technicalSkills)
                ? bodyRequirements.technicalSkills
                : listTechnicalSkills,
            softSkills: Array.isArray(bodyRequirements?.softSkills) ? bodyRequirements.softSkills : listSoftSkills,
        };

        // Requirements for the filter
        let requirements;
        if (safeRequirements && typeof safeRequirements === 'object' && Object.keys(safeRequirements).length > 0) {
            requirements = {
                ...safeRequirements,
                languages: Array.isArray(safeRequirements.languages) ? safeRequirements.languages : [],
                technicalSkills: Array.isArray(safeRequirements.technicalSkills)
                    ? safeRequirements.technicalSkills
                    : [],
                softSkills: Array.isArray(safeRequirements.softSkills) ? safeRequirements.softSkills : [],
            };
            // console.log('requirements123', requirements);
        } else {
            requirements = {
                qualification: posting.qualification,
                experience: {
                    min: experience.min || 0,
                    max: posting.experience.max || 0,
                },
                languages: listLanguages,
                technicalSkills: listTechnicalSkills,
                softSkills: listSoftSkills,
                gender: posting.gender,
                rejectedApplications: [],
                date: {
                    year: null,
                    month: null,
                },
            };
        }

        // Get all applications for the posting
        const applications = await Application.find({
            posting: postingId,
            'status.statusType': 'New',
        })
            .populate('applicant')
            .populate({
                path: 'applicant',
                populate: {
                    path: 'resume',
                },
            })
            .populate('resume') // Populate the resume field explicitly
            .populate('posting')
            .populate({
                path: 'posting',
                populate: {
                    path: 'job',
                },
            })
            .lean();

        for (const application of applications) {
            console.log('application123', application);
            if (application.resume) {
                console.log('application1234', application.resume);
                const resumeData = await Resume.findById(application.resume).lean();
                application.resume = resumeData; // Replace resume ObjectId with actual resume data
            }
        }
        // Qualification order
        const qualificationOrder = [
            ['SPM'],
            ['STPM', 'A-Level', 'Matriculation', 'Diploma'],
            ['Degree', 'Bachelor'],
            ['Master'],
            ['PhD'],
        ];

        // Filter applications
        const overqualified = [];
        const underqualified = [];
        const qualified = [];
        const rejected = [];
        const probable = [];

        applications.forEach((application) => {
            console.log('application123456', application.resume);
            // Calculate experience for each applicant
            const experience = application.resume?.experience?.value?.reduce((total, current) => {
                const parseDate = (str) => {
                    if (!str || typeof str !== 'string') return null;
                    str = str.trim();
                    const formats = ['YYYY-MM-DD', 'YYYY-MM', 'MMM YYYY', 'MMMM YYYY', 'YYYY'];
                    for (const fmt of formats) {
                        const parsed = dayjs(str, fmt, true);
                        if (parsed.isValid()) return parsed;
                    }
                    const fallback = dayjs(str);
                    return fallback.isValid() ? fallback : null;
                };

                const from = parseDate(current.date.from);
                const to = current.date.to === 'Present' ? dayjs() : parseDate(current.date.to);

                if (!from || !to || !from.isValid() || !to.isValid()) return total;

                return total + to.diff(from, 'year', false); // use float years
            }, 0);

            application.resume.totalExperience = parseFloat(experience.toFixed(1));
            console.log('experience123', application.resume.totalExperience);

            // score for each requirement
            // -1 = not qualified
            // 0 = qualified
            // 1 = overqualified
            const scoreRequirements = {
                qualification: 0,
                experience: 0,
                gender: 0,
                languages: 0,
                technicalSkills: 0,
                softSkills: 0,
            };

            // Filter experience
            if (experience < requirements.experience.min) {
                scoreRequirements.experience = -1;
            } else if (experience > requirements.experience.max) {
                scoreRequirements.experience = 1;
            }

            // Filter education
            //Get highest qualification education

            const education = application.resume?.education?.value?.reduce((prev, current) => {
                const to = current.date.to !== 'Present' ? dayjs(current.date.to) : dayjs();

                if (prev === null) return current;

                const prevTo = prev.date.to !== 'Present' ? dayjs(prev.date.to) : dayjs();
                return to.diff(prevTo, 'year') > 0 ? current : prev;
            }, null);

            if (education) {
                //Find keyword qualificationOrder in education.degree
                // Like Bachelor of Science (Hons) in Computer Science means Bachelor
                const lowercasedDegree = education.degree.toLowerCase();

                const qualification = qualificationOrder.findIndex((qualifications) =>
                    qualifications.some((qualification) => lowercasedDegree.includes(qualification.toLowerCase())),
                );

                application.resume.highestQualification = education.degree;

                const requirementsQualification = qualificationOrder.findIndex((qualifications) =>
                    qualifications.some((qualification) => requirements.qualification.includes(qualification)),
                );

                if (qualification < requirementsQualification) {
                    scoreRequirements.qualification = -1;
                } else if (qualification > requirementsQualification) {
                    scoreRequirements.qualification = 1;
                }
            } else {
                scoreRequirements.qualification = -1;
            }

            if (requirements.rejectedApplications.includes(application._id.toString())) {
                const resume = cloneDeep(application.resume);

                // Remove template
                delete resume.template;

                const obj = {
                    _id: application._id,
                    applicant: {
                        _id: application.applicant._id,
                        resume,
                        gender: application.applicant.gender,
                    },
                    createdAt: application.createdAt,
                };
                rejected.push(obj);
                return;
            }

            // Filter gender
            if (requirements.gender === 'All') scoreRequirements.gender = 0;
            else if (application.applicant.gender === requirements.gender) scoreRequirements.gender = 0;
            else scoreRequirements.gender = -1;

            // Filter languages
            // just check if applicant has the language in the requirements
            const languages = application.resume?.languages?.value?.map((lang) => lang.name.toLowerCase()) || [];
            console.log('languages123', languages);
            const total = requirements.languages.length;
            let check = 0;

            if (requirements.languages.length > 0) {
                requirements.languages.forEach((language) => {
                    if (languages.includes(language)) {
                        check += 1;
                    }
                });

                if (check === total) {
                    scoreRequirements.languages = 0;
                } else if (check < total) {
                    scoreRequirements.languages = -1;
                } else {
                    scoreRequirements.languages = 1;
                }
            } else {
                scoreRequirements.languages = 0;
            }

            // Filter technical skills
            // just check if applicant has the skill in the requirements
            const technicalSkills =
                application.resume?.technicalSkills?.value?.map((skill) => skill.name.toLowerCase()) || [];
            const totalSkills = requirements.technicalSkills.length;
            let checkSkills = 0;

            if (requirements.technicalSkills.length > 0) {
                requirements.technicalSkills.forEach((skill) => {
                    if (technicalSkills.includes(skill)) {
                        checkSkills += 1;
                    }
                });

                if (checkSkills === totalSkills) {
                    scoreRequirements.technicalSkills = 0;
                } else if (checkSkills < totalSkills) {
                    scoreRequirements.technicalSkills = -1;
                } else {
                    scoreRequirements.technicalSkills = 1;
                }
            } else {
                scoreRequirements.technicalSkills = 0;
            }

            // Filter soft skills
            // just check if applicant has the skill in the requirements
            const softSkills = application.resume?.softSkills?.value?.map((skill) => skill.name.toLowerCase()) || [];
            const totalSoftSkills = requirements.softSkills.length;
            let checkSoftSkills = 0;

            if (requirements.softSkills.length > 0) {
                requirements.softSkills.forEach((skill) => {
                    if (softSkills.includes(skill)) {
                        checkSoftSkills += 1;
                    }
                });

                if (checkSoftSkills === totalSoftSkills) {
                    scoreRequirements.softSkills = 0;
                } else if (checkSoftSkills < totalSoftSkills) {
                    scoreRequirements.softSkills = -1;
                } else {
                    scoreRequirements.softSkills = 1;
                }
            } else {
                scoreRequirements.softSkills = 0;
            }

            // If total score is 0, applicant is qualified
            // If total score is less than 0, applicant is underqualified
            // If total score is more than 0, applicant is overqualified
            const resume = cloneDeep(application.resume);

            // Remove template
            delete resume.template;

            const obj = {
                _id: application._id,
                applicant: {
                    _id: application.applicant._id,
                    resume,
                    gender: application.applicant.gender,
                },
                createdAt: application.createdAt,
            };

            const applicationYear = dayjs(application.createdAt).year();
            const applicationMonth = dayjs(application.createdAt).month();

            if (requirements.date.year && requirements.date.month) {
                if (applicationYear < requirements.date.year) {
                    underqualified.push(obj);
                } else if (applicationYear === requirements.date.year) {
                    if (applicationMonth < requirements.date.month) {
                        underqualified.push(obj);
                    } else {
                        //Order check qualification, experience, gender, languages, technical skills, soft skills

                        if (scoreRequirements.qualification === -1) underqualified.push(obj);
                        else if (scoreRequirements.qualification === 1) overqualified.push(obj);
                        else if (scoreRequirements.experience === -1) underqualified.push(obj);
                        else if (scoreRequirements.experience === 1) overqualified.push(obj);
                        else if (scoreRequirements.gender === -1) underqualified.push(obj);
                        else if (scoreRequirements.languages === -1) underqualified.push(obj);
                        else if (scoreRequirements.languages === 1) overqualified.push(obj);
                        else if (scoreRequirements.technicalSkills === -1) underqualified.push(obj);
                        else if (scoreRequirements.technicalSkills === 1) overqualified.push(obj);
                        else if (scoreRequirements.softSkills === -1) underqualified.push(obj);
                        else if (scoreRequirements.softSkills === 1) overqualified.push(obj);
                        else qualified.push(obj);
                    }
                } else {
                    if (scoreRequirements.qualification === -1) underqualified.push(obj);
                    else if (scoreRequirements.qualification === 1) overqualified.push(obj);
                    else if (scoreRequirements.experience === -1) underqualified.push(obj);
                    else if (scoreRequirements.experience === 1) overqualified.push(obj);
                    else if (scoreRequirements.gender === -1) underqualified.push(obj);
                    else if (scoreRequirements.languages === -1) underqualified.push(obj);
                    else if (scoreRequirements.languages === 1) overqualified.push(obj);
                    else if (scoreRequirements.technicalSkills === -1) underqualified.push(obj);
                    else if (scoreRequirements.technicalSkills === 1) overqualified.push(obj);
                    else if (scoreRequirements.softSkills === -1) underqualified.push(obj);
                    else if (scoreRequirements.softSkills === 1) overqualified.push(obj);
                    else qualified.push(obj);
                }
            } else {
                if (scoreRequirements.qualification === -1) underqualified.push(obj);
                else if (scoreRequirements.qualification === 1) overqualified.push(obj);
                else if (scoreRequirements.experience === -1) underqualified.push(obj);
                else if (scoreRequirements.experience === 1) overqualified.push(obj);
                else if (scoreRequirements.gender === -1) underqualified.push(obj);
                else if (scoreRequirements.languages === -1) underqualified.push(obj);
                else if (scoreRequirements.languages === 1) overqualified.push(obj);
                else if (scoreRequirements.technicalSkills === -1) underqualified.push(obj);
                else if (scoreRequirements.technicalSkills === 1) overqualified.push(obj);
                else if (scoreRequirements.softSkills === -1) underqualified.push(obj);
                else if (scoreRequirements.softSkills === 1) overqualified.push(obj);
                else qualified.push(obj);
            }
        });

        // probables
        if (qualified.length + underqualified.length + overqualified.length === 1) {
            probable.push(...qualified, ...underqualified, ...overqualified);
        }

        // Options
        const technicalSkillsOptions = [
            ...new Set([
                ...applications.flatMap((application) =>
                    application.resume?.technicalSkills?.value?.map((skill) => skill.name.toLowerCase()),
                ),
                ...listTechnicalSkills,
            ]),
        ].filter((skill) => skill !== undefined);

        const softSkillsOptions = [
            ...new Set([
                ...applications.flatMap((application) =>
                    application.resume?.softSkills?.value?.map((skill) => skill.name.toLowerCase()),
                ),
                ...listSoftSkills,
            ]),
        ].filter((skill) => skill !== undefined);

        const languagesOptions = [
            ...new Set([
                ...applications.flatMap((application) =>
                    application.resume?.languages?.value?.map((language) => language.name.toLowerCase()),
                ),
                ...listLanguages,
            ]),
        ].filter((language) => language !== undefined);

        // Maximum experience
        const maxExperience = applications.reduce((prev, current) => {
            const experience = current.applicant.resume?.experience?.value?.reduce((prev, current) => {
                const from = dayjs(current.date.from);
                console.log('adila', from);
                const to = current.date.to !== 'Present' ? dayjs(current.date.to) : dayjs();

                return prev + to.diff(from, 'year');
            }, 0);

            return experience > prev ? experience : prev;
        }, 0);

        // Minimum experience
        const minExperience = applications.reduce((prev, current) => {
            const experience = current.applicant.resume?.experience?.value?.reduce((prev, current) => {
                const from = dayjs(current.date.from);
                const to = current.date.to !== 'Present' ? dayjs(current.date.to) : dayjs();

                return prev + to.diff(from, 'year');
            }, 0);

            return experience < prev ? experience : prev;
        }, 0);

        const options = {
            technicalSkills: technicalSkillsOptions,
            softSkills: softSkillsOptions,
            languages: languagesOptions,
            experience: {
                min: minExperience,
                max: maxExperience,
            },
        };

        return { overqualified, underqualified, qualified, rejected, probable, requirements, options };
    }

    async getPostingListByCompanyId(companyId) {
        const postings = await Posting.find({ job: { $in: await Job.find({ company: companyId }) } }).populate('job');

        const postingList = postings.map((posting) => {
            return {
                _id: posting._id,
                title: posting.job.title,
            };
        });

        return postingList;
    }

    async scheduleInterview(applicationId, interviewData, scheduledBy) {
        try {
            const application = await Application.findById(applicationId)
                .populate('applicant')
                .populate('posting')
                .populate({
                    path: 'posting',
                    populate: {
                        path: 'job',
                        populate: {
                            path: 'company',
                        },
                    },
                });

            if (!application) {
                throw new ApiError(404, 'Application not found');
            }

            // Create interview object
            const interview = {
                interviewDate: new Date(interviewData.interviewDate),
                interviewType: interviewData.interviewType === 'online' ? 'Video' : 'In-Person',
                status: 'Scheduled',
                scheduledBy: scheduledBy,
                additionalNotes: interviewData.additionalNotes || '',
            };

            // Add type-specific data
            if (interviewData.interviewType === 'online') {
                interview.link = interviewData.meetLink;
            } else {
                interview.address = {
                    street: interviewData.address,
                    city: '',
                    state: '',
                    zip: '',
                    country: '',
                };
            }

            // Add interview to application
            application.interview.push(interview);

            // Update application status to 'Interviewed'
            application.status.statusType = 'Interviewed';
            application.status.statusDate = new Date();

            await application.save();

            // Send email notification - with better error handling
            try {
                console.log('Attempting to send interview email...');
                await this.sendInterviewEmail(application, interview);
                console.log('Interview email sent successfully!');
            } catch (emailError) {
                console.error('Failed to send interview email:', emailError);
                // Don't throw the error - just log it and continue
                // The interview is still scheduled successfully
            }

            return application;
        } catch (error) {
            console.error('Error scheduling interview:', error);
            throw new ApiError(500, 'Failed to schedule interview');
        }
    }

    async sendInterviewEmail(application, interview) {
        const Email = (await import('../../../util/Email.js')).default;

        const applicantEmail = application.applicant.email;
        const applicantName = `${application.applicant.firstName} ${application.applicant.lastName}`;
        const jobTitle = application.posting.job.title;
        const companyName = application.posting.job.company.name;
        const interviewDate = dayjs(interview.interviewDate).format('MMMM D, YYYY [at] h:mm A');

        let subject, htmlContent;

        if (interview.interviewType === 'Video') {
            subject = `🎯 Interview Scheduled - ${jobTitle} Position at ${companyName}`;
            htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #2c3e50; margin: 0;">Interview Invitation</h2>
          </div>
          
          <p>Dear <strong>${applicantName}</strong>,</p>
          
          <p>We are pleased to inform you that your application for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong> has been reviewed, and we would like to invite you for an online interview.</p>
          
          <div style="background-color: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #1976d2; margin-top: 0;">📅 Interview Details</h3>
              <ul style="list-style: none; padding: 0;">
                  <li style="margin: 8px 0;"><strong>📅 Date & Time:</strong> ${interviewDate}</li>
                  <li style="margin: 8px 0;"><strong>💻 Type:</strong> Online Interview (Video Call)</li>
                  <li style="margin: 8px 0;"><strong>🔗 Meeting Link:</strong> <a href="${interview.link}" style="color: #1976d2;">${interview.link}</a></li>
              </ul>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4 style="color: #856404; margin-top: 0;">⚠️ Important Reminders</h4>
              <ul>
                  <li>Please ensure you have a stable internet connection</li>
                  <li>Test your camera and microphone before the interview</li>
                  <li>Join the meeting a few minutes early to avoid technical issues</li>
                  <li>Have a copy of your resume ready for reference</li>
              </ul>
          </div>
          
          ${
              interview.additionalNotes
                  ? `
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4 style="color: #495057; margin-top: 0;">📝 Additional Notes</h4>
              <p style="margin: 0;">${interview.additionalNotes}</p>
          </div>
          `
                  : ''
          }
          
          <p>If you need to reschedule or have any questions, please contact us as soon as possible.</p>
          
          <p>We look forward to speaking with you!</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
              <p style="margin: 0;"><strong>Best regards,</strong><br>
              ${companyName} Hiring Team</p>
          </div>
      </div>
      `;
        } else {
            subject = `🏢 Interview Scheduled - ${jobTitle} Position at ${companyName}`;
            htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #2c3e50; margin: 0;">Interview Invitation</h2>
          </div>
          
          <p>Dear <strong>${applicantName}</strong>,</p>
          
          <p>We are pleased to inform you that your application for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong> has been reviewed, and we would like to invite you for an in-person interview.</p>
          
          <div style="background-color: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #1976d2; margin-top: 0;">📅 Interview Details</h3>
              <ul style="list-style: none; padding: 0;">
                  <li style="margin: 8px 0;"><strong>📅 Date & Time:</strong> ${interviewDate}</li>
                  <li style="margin: 8px 0;"><strong>🏢 Type:</strong> In-Person Interview</li>
                  <li style="margin: 8px 0;"><strong>📍 Location:</strong> ${interview.address.street}</li>
              </ul>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4 style="color: #856404; margin-top: 0;">⚠️ Important Reminders</h4>
              <ul>
                  <li>Please arrive 10-15 minutes early</li>
                  <li>Bring a copy of your resume and any relevant documents</li>
                  <li>If you have difficulty finding our location, please contact us</li>
                  <li>Dress professionally for the interview</li>
              </ul>
          </div>
          
          ${
              interview.additionalNotes
                  ? `
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4 style="color: #495057; margin-top: 0;">📝 Additional Notes</h4>
              <p style="margin: 0;">${interview.additionalNotes}</p>
          </div>
          `
                  : ''
          }
          
          <p>If you need to reschedule or have any questions, please contact us as soon as possible.</p>
          
          <p>We look forward to meeting you!</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
              <p style="margin: 0;"><strong>Best regards,</strong><br>
              ${companyName} Hiring Team</p>
          </div>
      </div>
      `;
        }

        console.log(`Sending email to: ${applicantEmail}`);
        console.log(`Subject: ${subject}`);

        await Email.sendHtmlEmail(applicantEmail, subject, htmlContent);
    }
}

export default JobController;
