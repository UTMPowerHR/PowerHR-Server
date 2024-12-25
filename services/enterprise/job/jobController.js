import { Job, Posting, Application } from '../../../models/enterprise/job/index.js';
import dayjs from 'dayjs';
import cloneDeep from 'lodash/cloneDeep.js';
import ApiError from '../../../util/ApiError.js';

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
            })
            .populate({
                path: 'applicant',
                populate: {
                    path: 'resume', // Populate resume from the Applicant schema
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

    async filterApplications(postingId, bodyRequirements) {
        const posting = await Posting.findById(postingId);

        const listLanguages = posting.languages.map((language) => language.name.toLowerCase());
        const listTechnicalSkills = posting.technicalSkills.map((skill) => skill.name.toLowerCase());
        const listSoftSkills = posting.softSkills.map((skill) => skill.name.toLowerCase());

        // Requirements for the filter
        let requirements;
        if (bodyRequirements !== null) {
            requirements = bodyRequirements;
        } else {
            requirements = {
                qualification: posting.qualification,
                experience: {
                    min: posting.experience.min || 0,
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
            .populate('posting')
            .populate({
                path: 'posting',
                populate: {
                    path: 'job',
                },
            })
            .lean();

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
            // Calculate experience for each applicant
            const experience = application.applicant.resume?.experience?.value?.reduce((prev, current) => {
                const from = dayjs(current.date.from);
                const to = current.date.to !== 'Present' ? dayjs(current.date.to) : dayjs();

                return prev + to.diff(from, 'year');
            }, 0);

            application.applicant.resume.totalExperience = experience;

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

            const education = application.applicant.resume?.education?.value?.reduce((prev, current) => {
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

                application.applicant.resume.highestQualification = education.degree;

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
                const resume = cloneDeep(application.applicant.resume);

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

            const languages = application.applicant.resume?.languages?.value?.map((language) =>
                language.name.toLowerCase(),
            );
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
            const technicalSkills = application.applicant.resume?.technicalSkills?.value?.map((skill) =>
                skill.name.toLowerCase(),
            );
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
            const softSkills = application.applicant.resume?.softSkills?.value?.map((skill) =>
                skill.name.toLowerCase(),
            );
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
            const resume = cloneDeep(application.applicant.resume);

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
                ...applications
                    .map((application) =>
                        application.applicant.resume?.technicalSkills?.value?.map((skill) => skill.name.toLowerCase()),
                    )
                    .flat(),
                ...listTechnicalSkills,
            ]),
        ].filter((skill) => skill !== undefined);

        const softSkillsOptions = [
            ...new Set([
                ...applications
                    .map((application) =>
                        application.applicant.resume?.softSkills?.value?.map((skill) => skill.name.toLowerCase()),
                    )
                    .flat(),
                ...listSoftSkills,
            ]),
        ].filter((skill) => skill !== undefined);

        const languagesOptions = [
            ...new Set([
                ...applications
                    .map((application) =>
                        application.applicant.resume?.languages?.value?.map((language) => language.name.toLowerCase()),
                    )
                    .flat(),
                ...listLanguages,
            ]),
        ].filter((language) => language !== undefined);

        // Maximum experience
        const maxExperience = applications.reduce((prev, current) => {
            const experience = current.applicant.resume?.experience?.value?.reduce((prev, current) => {
                const from = dayjs(current.date.from);
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
}

export default JobController;
