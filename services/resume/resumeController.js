/* eslint-disable no-unused-vars */
import { Resume } from '../../models/resume/index.js';
import User from '../../models/users/user.js';
import ApiError from '../../util/ApiError.js';
import fetch from 'node-fetch';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

class ResumeController {
    constructor() {}

    /**
     * Create or update a resume.
     * If a resume exists for the user, update it; otherwise, create a new one.
     */
    async createOrUpdateResume(resumeData) {
        try {
            const { user, ...resumeFields } = resumeData;
            // Check if a resume already exists for the user
            const existingResume = await Resume.findOne({ user });
            if (existingResume) {
                // Update the existing resume
                return await Resume.findByIdAndUpdate(existingResume._id, resumeFields, { new: true });
            } else {
                // Create a new resume
                return await Resume.create(resumeData);
            }
        } catch (error) {
            console.error('Error saving resume:', error);
            throw new Error('Failed to save resume');
        }
    }

    /**
     * Get a resume by its ID.
     */
    async getResumeById(resumeId) {
        try {
            const resume = await Resume.findById(resumeId);
            return resume;
        } catch (error) {
            console.error('Error fetching resume by ID:', error);
            throw new Error('Failed to fetch resume');
        }
    }

    /**
     * Get a resume by the user ID.
     */
    async getResumeByUserId(userId) {
        try {
            const resume = await Resume.findOne({ user: userId });
            return resume;
        } catch (error) {
            console.error('Error fetching resume by user ID:', error);
            throw new Error('Failed to fetch resume');
        }
    }

    /**
     * Get all resumes (for admin purposes).
     */
    async getAllResumes() {
        try {
            const resumes = await Resume.find();
            return resumes;
        } catch (error) {
            console.error('Error fetching all resumes:', error);
            throw new Error('Failed to fetch resumes');
        }
    }

    /**
     * Update a resume by its ID.
     */
    async updateResume(resumeData) {
        try {
            const { _id, ...updatedFields } = resumeData;
            const updatedResume = await Resume.findByIdAndUpdate(_id, updatedFields, { new: true });
            return updatedResume;
        } catch (error) {
            console.error('Error updating resume:', error);
            throw new Error('Failed to update resume');
        }
    }

    /**
     * Delete a resume by its ID.
     */
    async deleteResume(resumeId) {
        try {
            const deletedResume = await Resume.findByIdAndDelete(resumeId);
            return deletedResume;
        } catch (error) {
            console.error('Error deleting resume:', error);
            throw new Error('Failed to delete resume');
        }
    }

    /**
     * Generate section content based on type
     */
    generateSectionContent(section, sectionConfig) {
        if (!section || !section.value) return '';
        const { typeCard } = sectionConfig;
        let content = '';

        switch (typeCard) {
            case 'string':
                content = `<div class="section-content">${section.value || ''}</div>`;
                break;

            case 'point':
                if (Array.isArray(section.value)) {
                    content = `
                    <div class="section-content">
                        <ul class="point-list">
                            ${section.value.map((point) => `<li>${point}</li>`).join('')}
                        </ul>
                    </div>
                `;
                }
                break;

            case 'list':
                if (Array.isArray(section.value)) {
                    // Handle both simple arrays and objects with name/level properties
                    const items = section.value
                        .map((item) => {
                            if (typeof item === 'string') {
                                return item;
                            } else if (item && item.name) {
                                return item.name; // Extract just the name, ignore level
                            }
                            return '';
                        })
                        .filter((item) => item); // Remove empty items

                    content = `
                    <div class="section-content">
                        <div class="skill-list">
                            ${items.map((item) => `<span class="skill-item">${item}</span>`).join('')}
                        </div>
                    </div>
                `;
                }
                break;

            case 'score':
                if (Array.isArray(section.value)) {
                    // Handle both simple arrays and objects with name/level properties
                    const items = section.value
                        .map((item) => {
                            if (typeof item === 'string') {
                                return { name: item, level: 'Intermediate' }; // Default level
                            } else if (item && item.name) {
                                return { name: item.name, level: item.level || 'Intermediate' };
                            }
                            return null;
                        })
                        .filter((item) => item);

                    content = `
                    <div class="section-content">
                        ${items
                            .map(
                                (item) => `
                            <div class="score-item">
                                <span class="score-name">${item.name || ''}</span>
                                <div class="score-bar">
                                    <div class="score-fill" style="width: ${this.getScorePercentage(item.level)}%"></div>
                                </div>
                            </div>
                        `,
                            )
                            .join('')}
                    </div>
                `;
                }
                break;

            case 'timeline':
                if (Array.isArray(section.value)) {
                    content = `
                    <div class="section-content">
                        ${section.value
                            .map(
                                (item) => `
                            <div class="timeline-item">
                                <div class="timeline-header">
                                    <h4>${item.company || item.institution || ''}</h4>
                                    <span class="timeline-date">${this.formatDate(item.date)}</span>
                                </div>
                                <div class="timeline-title">${item.title || item.degree || ''}</div>
                                ${item.location ? `<div class="timeline-location">${item.location}</div>` : ''}
                                ${
                                    item.description && Array.isArray(item.description)
                                        ? `
                                    <ul class="timeline-description">
                                        ${item.description.map((desc) => `<li>${desc}</li>`).join('')}
                                    </ul>
                                `
                                        : ''
                                }
                            </div>
                        `,
                            )
                            .join('')}
                    </div>
                `;
                }
                break;

            case 'reference':
                if (Array.isArray(section.value)) {
                    content = `
                    <div class="section-content">
                        ${section.value
                            .map(
                                (ref) => `
                            <div class="reference-item">
                                <div class="reference-name">${ref.name || ''}</div>
                                <div class="reference-company">${ref.company || ''}</div>
                                <div class="reference-contact">${ref.email || ''} ${ref.phone ? `• ${ref.phone}` : ''}</div>
                            </div>
                        `,
                            )
                            .join('')}
                    </div>
                `;
                }
                break;

            default:
                content = `<div class="section-content">${JSON.stringify(section.value)}</div>`;
        }
        return content;
    }

    /**
     * Convert score level to percentage
     */
    getScorePercentage(level) {
        const scoreMap = {
            Beginner: 25,
            Intermediate: 50,
            Advanced: 75,
            Expert: 90,
            Master: 100,
            Mastery: 100,
            Native: 100,
        };
        return scoreMap[level] || 50;
    }

    /**
     * Format date object
     */
    formatDate(dateObj) {
        if (!dateObj) return '';
        const from = dateObj.from || '';
        const to = dateObj.to || 'Present';
        return from && to ? `${from} - ${to}` : '';
    }

    /**
     * Generate Modern template HTML
     */
    generateModernTemplate(resumeData) {
        const settings = resumeData.template?.settings || resumeData.template?.setting || {};
        const titleColor = settings.titleColor || '#000000';
        const contentColor = settings.contentColor || '#000000';
        const backgroundColor1 = settings.backgroundColor1 || '#ffffff';
        const backgroundColor2 = settings.backgroundColor2 || '#f5f5f5';

        // Get sections mapping
        const sectionsMap = {};
        [
            'summary',
            'objective',
            'experience',
            'education',
            'awards',
            'languages',
            'technicalSkills',
            'softSkills',
            'voluntering',
            'references',
        ].forEach((key) => {
            if (resumeData[key]) {
                sectionsMap[key] = resumeData[key];
            }
        });

        // Generate column content
        const generateColumnContent = (columnItems) => {
            return columnItems
                .map((item) => {
                    const section = sectionsMap[item.name];
                    if (!section) return '';

                    return `
                <div class="resume-section">
                    <h3 class="section-title" style="color: ${titleColor};">
                        ${section.name || item.name.charAt(0).toUpperCase() + item.name.slice(1)}
                    </h3>
                    ${this.generateSectionContent(section, item)}
                </div>
            `;
                })
                .join('');
        };

        const leftColumn = resumeData.template?.pages?.[0]?.columns?.[0]?.list || [];
        const rightColumn = resumeData.template?.pages?.[0]?.columns?.[1]?.list || [];

        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Resume - ${resumeData.basicDetail?.name || 'Resume'}</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: Arial, sans-serif;
                    font-size: 12px;
                    line-height: 1.4;
                    color: ${contentColor};
                    background-color: ${backgroundColor1};
                }
                
                .resume-container {
                    width: 8.27in;
                    min-height: 11.69in;
                    margin: 0 auto;
                    background-color: white;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                }
                
                .header {
                    background-color: ${backgroundColor2};
                    padding: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .header-content {
                    flex-grow: 1;
                }
                
                .header h1 {
                    font-size: 28px;
                    font-weight: bold;
                    color: ${titleColor};
                    margin-bottom: 5px;
                }
                
                .header h2 {
                    font-size: 18px;
                    color: ${titleColor};
                    margin-bottom: 10px;
                    font-weight: normal;
                }
                
                .contact-info {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 15px;
                    margin-bottom: 5px;
                }
                
                .contact-info span {
                    color: ${contentColor};
                    font-size: 11px;
                }
                
                .profile-image {
                    width: 90px;
                    height: 90px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 2px solid ${titleColor};
                }
                
                .content-grid {
                    display: grid;
                    grid-template-columns: 1.4fr 1fr;
                    gap: 20px;
                    padding: 20px;
                }
                
                .resume-section {
                    margin-bottom: 25px;
                    break-inside: avoid;
                }
                
                .section-title {
                    font-size: 16px;
                    font-weight: bold;
                    margin-bottom: 12px;
                    color: ${titleColor};
                    border-bottom: 1px solid ${titleColor};
                    padding-bottom: 3px;
                }
                
                .section-content {
                    color: ${contentColor};
                }
                
                .timeline-item {
                    margin-bottom: 15px;
                    break-inside: avoid;
                }
                
                .timeline-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 5px;
                }
                
                .timeline-header h4 {
                    font-size: 13px;
                    font-weight: bold;
                    color: ${titleColor};
                    margin: 0;
                }
                
                .timeline-date {
                    font-size: 10px;
                    color: ${contentColor};
                    font-style: italic;
                    white-space: nowrap;
                }
                
                .timeline-title {
                    font-size: 12px;
                    font-weight: 600;
                    margin-bottom: 3px;
                    color: ${contentColor};
                }
                
                .timeline-location {
                    font-size: 10px;
                    color: ${contentColor};
                    margin-bottom: 5px;
                    font-style: italic;
                }
                
                .timeline-description {
                    list-style-type: disc;
                    padding-left: 15px;
                    margin-top: 5px;
                }
                
                .timeline-description li {
                    margin-bottom: 3px;
                    font-size: 11px;
                }
                
                .point-list {
                    list-style-type: disc;
                    padding-left: 15px;
                }
                
                .point-list li {
                    margin-bottom: 3px;
                    font-size: 11px;
                }
                
                .skill-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                    margin-top: 5px;
                }
                
                .skill-item {
                    background-color: ${titleColor};
                    color: white;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 500;
                    text-align: center;
                    white-space: nowrap;
                    transition: all 0.3s ease;
                }
                
                .skill-item:hover {
                    background-color: ${contentColor};
                    transform: translateY(-1px);
                }
                
                .score-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }
                
                .score-name {
                    font-size: 11px;
                    font-weight: 500;
                    flex: 1;
                }
                
                .score-bar {
                    width: 60px;
                    height: 8px;
                    background-color: #e0e0e0;
                    border-radius: 4px;
                    overflow: hidden;
                    margin-left: 10px;
                }
                
                .score-fill {
                    height: 100%;
                    background-color: ${titleColor};
                    border-radius: 4px;
                }
                
                .reference-item {
                    margin-bottom: 12px;
                }
                
                .reference-name {
                    font-weight: bold;
                    font-size: 12px;
                    color: ${titleColor};
                }
                
                .reference-company {
                    font-size: 11px;
                    color: ${contentColor};
                    margin-bottom: 2px;
                }
                
                .reference-contact {
                    font-size: 10px;
                    color: ${contentColor};
                }
                
                @media print {
                    .resume-container {
                        box-shadow: none;
                    }
                    
                    .skill-item:hover {
                        background-color: ${titleColor};
                        transform: none;
                    }
                }
            </style>
        </head>
        <body>
            <div class="resume-container">
                <div class="header">
                    <div class="header-content">
                        <h1>${resumeData.basicDetail?.name || ''}</h1>
                        <h2>${resumeData.basicDetail?.title || ''}</h2>
                        <div class="contact-info">
                            ${resumeData.basicDetail?.email ? `<span>${resumeData.basicDetail.email}</span>` : ''}
                            ${resumeData.basicDetail?.phone ? `<span>${resumeData.basicDetail.phone}</span>` : ''}
                            ${resumeData.basicDetail?.location ? `<span>${resumeData.basicDetail.location}</span>` : ''}
                        </div>
                        ${resumeData.basicDetail?.websiteUrl?.linkedin ? `<div><span style="font-size: 10px;">${resumeData.basicDetail.websiteUrl.linkedin}</span></div>` : ''}
                    </div>
                    ${resumeData.basicDetail?.imageURL ? `<img src="${resumeData.basicDetail.imageURL}" alt="Profile" class="profile-image" />` : ''}
                </div>
                
                <div class="content-grid">
                    <div class="left-column">
                        ${generateColumnContent(leftColumn)}
                    </div>
                    <div class="right-column">
                        ${generateColumnContent(rightColumn)}
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;
    }

    /**
     * Generate Basic template HTML
     */
    generateBasicTemplate(resumeData) {
        const settings = resumeData.template?.settings || resumeData.template?.setting || {};
        const titleColor = settings.titleColor || '#000000';
        const contentColor = settings.contentColor || '#000000';
        const backgroundColor1 = settings.backgroundColor1 || '#ffffff';

        // Get sections mapping
        const sectionsMap = {};
        [
            'summary',
            'objective',
            'experience',
            'education',
            'awards',
            'languages',
            'technicalSkills',
            'softSkills',
            'voluntering',
            'references',
        ].forEach((key) => {
            if (resumeData[key]) {
                sectionsMap[key] = resumeData[key];
            }
        });

        // Generate single column content
        const generateContent = (items) => {
            return items
                .map((item) => {
                    const section = sectionsMap[item.name];
                    if (!section) return '';

                    return `
                <div class="resume-section">
                    <h3 class="section-title" style="color: ${titleColor};">
                        ${section.name || item.name.charAt(0).toUpperCase() + item.name.slice(1)}
                    </h3>
                    ${this.generateSectionContent(section, item)}
                </div>
            `;
                })
                .join('');
        };

        const allItems = resumeData.template?.pages?.[0]?.columns?.[0]?.list || [];

        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Resume - ${resumeData.basicDetail?.name || 'Resume'}</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: Arial, sans-serif;
                    font-size: 12px;
                    line-height: 1.4;
                    color: ${contentColor};
                    background-color: ${backgroundColor1};
                }
                
                .resume-container {
                    width: 8.27in;
                    min-height: 11.69in;
                    margin: 0 auto;
                    background-color: white;
                    padding: 30px;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                }
                
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid ${titleColor};
                }
                
                .header h1 {
                    font-size: 32px;
                    font-weight: bold;
                    color: ${titleColor};
                    margin-bottom: 8px;
                }
                
                .header h2 {
                    font-size: 18px;
                    color: ${contentColor};
                    margin-bottom: 15px;
                    font-weight: normal;
                }
                
                .contact-info {
                    display: flex;
                    justify-content: center;
                    flex-wrap: wrap;
                    gap: 20px;
                    margin-bottom: 10px;
                }
                
                .contact-info span {
                    color: ${contentColor};
                    font-size: 12px;
                }
                
                .resume-section {
                    margin-bottom: 25px;
                    break-inside: avoid;
                }
                
                .section-title {
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 15px;
                    color: ${titleColor};
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    border-bottom: 2px solid ${titleColor};
                    padding-bottom: 5px;
                }
                
                .section-content {
                    color: ${contentColor};
                    padding-left: 10px;
                }
                
                .timeline-item {
                    margin-bottom: 20px;
                    break-inside: avoid;
                }
                
                .timeline-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 5px;
                }
                
                .timeline-header h4 {
                    font-size: 14px;
                    font-weight: bold;
                    color: ${titleColor};
                    margin: 0;
                }
                
                .timeline-date {
                    font-size: 11px;
                    color: ${contentColor};
                    font-style: italic;
                    white-space: nowrap;
                }
                
                .timeline-title {
                    font-size: 13px;
                    font-weight: 600;
                    margin-bottom: 3px;
                    color: ${contentColor};
                }
                
                .timeline-location {
                    font-size: 11px;
                    color: ${contentColor};
                    margin-bottom: 8px;
                    font-style: italic;
                }
                
                .timeline-description {
                    list-style-type: disc;
                    padding-left: 20px;
                    margin-top: 8px;
                }
                
                .timeline-description li {
                    margin-bottom: 4px;
                    font-size: 12px;
                }
                
                .point-list {
                    list-style-type: disc;
                    padding-left: 20px;
                }
                
                .point-list li {
                    margin-bottom: 4px;
                    font-size: 12px;
                }
                
                .skill-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-top: 5px;
                }
                
                .skill-item {
                    background-color: ${titleColor};
                    color: white;
                    padding: 10px 18px;
                    border-radius: 25px;
                    font-size: 12px;
                    font-weight: 500;
                    text-align: center;
                    white-space: nowrap;
                    transition: all 0.3s ease;
                    border: 2px solid ${titleColor};
                }
                
                .skill-item:hover {
                    background-color: white;
                    color: ${titleColor};
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                }
                
                .score-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }
                
                .score-name {
                    font-size: 12px;
                    font-weight: 500;
                    flex: 1;
                }
                
                .score-bar {
                    width: 80px;
                    height: 10px;
                    background-color: #e0e0e0;
                    border-radius: 5px;
                    overflow: hidden;
                    margin-left: 15px;
                }
                
                .score-fill {
                    height: 100%;
                    background-color: ${titleColor};
                    border-radius: 5px;
                }
                
                .reference-item {
                    margin-bottom: 15px;
                }
                
                .reference-name {
                    font-weight: bold;
                    font-size: 13px;
                    color: ${titleColor};
                }
                
                .reference-company {
                    font-size: 12px;
                    color: ${contentColor};
                    margin-bottom: 3px;
                }
                
                .reference-contact {
                    font-size: 11px;
                    color: ${contentColor};
                }
                
                @media print {
                    .resume-container {
                        box-shadow: none;
                    }
                    
                    .skill-item:hover {
                        background-color: ${titleColor};
                        color: white;
                        transform: none;
                        box-shadow: none;
                    }
                }
            </style>
        </head>
        <body>
            <div class="resume-container">
                <div class="header">
                    <h1>${resumeData.basicDetail?.name || ''}</h1>
                    <h2>${resumeData.basicDetail?.title || ''}</h2>
                    <div class="contact-info">
                        ${resumeData.basicDetail?.email ? `<span>${resumeData.basicDetail.email}</span>` : ''}
                        ${resumeData.basicDetail?.phone ? `<span>${resumeData.basicDetail.phone}</span>` : ''}
                        ${resumeData.basicDetail?.location ? `<span>${resumeData.basicDetail.location}</span>` : ''}
                    </div>
                    ${resumeData.basicDetail?.websiteUrl?.linkedin ? `<div><span style="font-size: 11px;">${resumeData.basicDetail.websiteUrl.linkedin}</span></div>` : ''}
                </div>
                
                <div class="content">
                    ${generateContent(allItems)}
                </div>
            </div>
        </body>
        </html>
    `;
    }

    /**
     * Generate a PDF buffer for a resume using Puppeteer with dynamic templates.
     */
    async generatePDF(resumeData) {
        let browser = null;

        try {
            console.log('Starting PDF generation on Vercel...');

            browser = await puppeteer.launch({
                args: [
                    ...chromium.args,
                    '--hide-scrollbars',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor',
                ],
                defaultViewport: chromium.defaultViewport,
                executablePath: await chromium.executablePath(),
                headless: chromium.headless,
                ignoreHTTPSErrors: true,
            });

            const page = await browser.newPage();

            let htmlContent;
            const templateName = resumeData.template?.name || 'modern';

            if (templateName === 'modern') {
                htmlContent = this.generateModernTemplate(resumeData);
            } else if (templateName === 'basic') {
                htmlContent = this.generateBasicTemplate(resumeData);
            } else {
                htmlContent = this.generateModernTemplate(resumeData);
            }

            await page.setContent(htmlContent, {
                waitUntil: 'networkidle0',
                timeout: 25000,
            });

            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '0.5in',
                    right: '0.5in',
                    bottom: '0.5in',
                    left: '0.5in',
                },
            });

            await browser.close();
            return pdfBuffer;
        } catch (error) {
            console.error('Error generating PDF:', error);

            if (browser) {
                try {
                    await browser.close();
                } catch (closeError) {
                    console.error('Error closing browser:', closeError);
                }
            }

            throw new Error('Failed to generate PDF');
        }
    }

    /**
     * Extract resume data from uploaded PDF
     */
    async extractResume(fileData, userId) {
        try {
            if (!fileData) {
                throw new ApiError(400, 'No file uploaded');
            }
            if (!userId) {
                throw new ApiError(400, 'User ID is required');
            }

            const user = await User.findById(userId);
            if (!user) {
                throw new ApiError(404, 'User not found');
            }

            const chunks = [];
            for await (const chunk of fileData.file) {
                chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);

            const extractedData = await this.processResumePDF(buffer, fileData.filename);
            return {
                success: true,
                extractedData,
                message: 'Resume extracted successfully',
            };
        } catch (error) {
            console.error('Resume extraction error:', error);
            throw new ApiError(500, `Failed to extract resume data: ${error.message}`);
        }
    }

    /**
     * Save extracted resume data to database
     */
    async saveExtractedResume(userId, resumeData, originalFileName) {
        try {
            if (!userId || !resumeData) {
                throw new ApiError(400, 'Missing required data');
            }

            const user = await User.findById(userId);
            if (!user) {
                throw new ApiError(404, 'User not found');
            }

            let resume = await Resume.findOne({ user: userId });
            const resumePayload = {
                user: userId,
                basicDetail: resumeData.basicDetail || {},
                objective: resumeData.objective || {},
                summary: resumeData.summary || {},
                education: resumeData.education || { value: [] },
                experience: resumeData.experience || { value: [] },
                awards: resumeData.awards || { value: [] },
                languages: resumeData.languages || { value: [] },
                technicalSkills: resumeData.technicalSkills || { value: [] },
                softSkills: resumeData.softSkills || { value: [] },
                voluntering: resumeData.voluntering || { value: [] },
                references: resumeData.references || { value: [] },
                template: resumeData.template || this.getDefaultTemplate(),
                originalFileName: originalFileName || 'extracted_resume.pdf',
            };

            if (resume) {
                Object.assign(resume, resumePayload);
                await resume.save();
            } else {
                resume = new Resume(resumePayload);
                await resume.save();
                if (user.__t === 'Applicant') {
                    user.resume = resume._id;
                    await user.save();
                }
            }

            return resume;
        } catch (error) {
            console.error('Save extracted resume error:', error);
            throw new ApiError(500, `Failed to save resume data: ${error.message}`);
        }
    }

    /**
     * Process PDF and extract resume data
     */
    async processResumePDF(pdfBuffer, filename) {
        console.log('Processing PDF:', filename);
        if (process.env.EXTRACTOR_API_KEY && process.env.EXTRACTOR_API_KEY !== 'your_api_key_here') {
            try {
                return await this.extractWithApi(pdfBuffer, filename);
            } catch (error) {
                console.warn('API extraction failed, falling back to basic structure:', error.message);
            }
        }
        return this.createBasicResumeStructure();
    }

    /**
     * Extract resume data using API
     */
    async extractWithApi(pdfBuffer, filename) {
        try {
            const FormData = (await import('form-data')).default;
            const formData = new FormData();
            formData.append('file', pdfBuffer, {
                filename: filename || 'resume.pdf',
                contentType: 'application/pdf',
            });
            formData.append('workspace', 'gPmIAsVr');
            formData.append('document_type', 'CMPtCZMV');
            formData.append('wait', 'true');
            formData.append('compact', 'false');
            formData.append('language', 'en');
            formData.append('reject_duplicates', 'false');

            const response = await fetch('https://api.affinda.com/v3/documents', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${process.env.EXTRACTOR_API_KEY}`,
                    ...formData.getHeaders(),
                },
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const result = await response.json();
            return this.transformApiResponse(result);
        } catch (error) {
            console.error('API extraction error:', error);
            throw error;
        }
    }

    /**
     * Transform API response to our resume schema
     */
    transformApiResponse(apiData) {
        const data = apiData.data || {};
        // console.table(data);
        const basicDetail = this.extractBasicDetails(data);
        const summary = { value: this.extractSummary(data) };
        const objective = { value: this.extractObjective(data || '') };
        if (summary == objective) objective.value = '';
        const education = { value: this.extractEducation(data) };
        const experience = { value: this.extractExperience(data) };

        const { technicalSkills, softSkills } = this.extractAndSegregateSkills(data);
        const languages = { value: this.extractLanguages(data) };

        return {
            basicDetail,
            objective,
            summary,
            education,
            experience,
            technicalSkills: { value: technicalSkills },
            softSkills: { value: softSkills },
            languages,
            awards: { value: [] },
            voluntering: { value: [] },
            references: { value: [] },
            template: this.getDefaultTemplate(),
        };
    }

    /**
     * Extract basic details from API data
     */
    extractBasicDetails(data) {
        //console.log('hehe', data.candidateName, 'HAISS', data.website, 'LAURO', data.workExperience);
        const basicDetail = {
            name: '',
            title: '',
            email: '',
            phone: '',
            location: '',
            websiteUrl: {
                linkedin: '',
                github: '',
                portfolio: '',
            },
        };

        if (data.candidateName && Array.isArray(data.candidateName) && data.candidateName.length > 0) {
            const nameEntry = data.candidateName[0];
            if (nameEntry.parsed) {
                const firstName = nameEntry.parsed.firstName?.raw || '';
                const lastName = nameEntry.parsed.familyName?.raw || '';
                basicDetail.name = `${firstName} ${lastName}`.trim();
            } else {
                basicDetail.name = nameEntry.raw || '';
            }
        }

        if (data.email && Array.isArray(data.email) && data.email.length > 0) {
            basicDetail.email = data.email[0].raw || '';
        }

        if (data.title && Array.isArray(data.title) && data.title.length > 0) {
            basicDetail.title = data.title[0].raw || '';
        }

        if (data.phoneNumber && Array.isArray(data.phoneNumber) && data.phoneNumber.length > 0) {
            basicDetail.phone = data.phoneNumber[0].raw || '';
        }

        if (data.location) {
            basicDetail.location = data.location.raw || data.location.value || '';
        }

        if (data.website || Array.isArray(data.website)) {
            data.website.forEach((site) => {
                const url = site.raw || '';
                if (url.includes('linkedin')) {
                    basicDetail.websiteUrl.linkedin = url;
                } else if (url.includes('github')) {
                    basicDetail.websiteUrl.github = url;
                } else {
                    basicDetail.websiteUrl.portfolio = url;
                }
            });
        }

        return basicDetail;
    }

    /**
     * Extract education data from API response with dynamic date parsing
     */
    extractEducation(data) {
        const educationList = [];
        if (data.education && Array.isArray(data.education)) {
            data.education.forEach((eduEntry) => {
                let institution = '';
                let degree = '';
                let description = [''];

                // Parse institution and degree from raw or parsed fields
                if (eduEntry.parsed) {
                    institution = eduEntry.parsed.educationOrganization?.raw || '';
                    degree = eduEntry.parsed.educationAccreditation?.raw || '';

                    // Handle description (if available)
                    if (eduEntry.parsed.description?.raw) {
                        description = [eduEntry.parsed.description.raw];
                    } else if (typeof eduEntry.parsed.description === 'string') {
                        description = [eduEntry.parsed.description];
                    }
                }

                // Try to extract dates from different formats
                let dateRaw = '';
                if (eduEntry.startDate && eduEntry.endDate) {
                    dateRaw = `${this.formatDate(eduEntry.startDate)} – ${this.formatDate(eduEntry.endDate)}`;
                } else if (eduEntry.startDate) {
                    dateRaw = this.formatDate(eduEntry.startDate);
                } else if (eduEntry.endDate) {
                    dateRaw = `– ${this.formatDate(eduEntry.endDate)}`;
                } else if (eduEntry.parsed?.educationDates?.raw) {
                    dateRaw = eduEntry.parsed.educationDates.raw;
                }

                // Use shared utility to parse date range
                const { start, end } = this.parseDynamicDateRange(dateRaw);

                if (institution || degree) {
                    educationList.push({
                        institution,
                        degree,
                        date: {
                            from: start,
                            to: end || 'Present',
                        },
                        description,
                    });
                }
            });
        }
        return educationList;
    }

    /**
     * Extract work experience from API data with dynamic date parsing
     */
    extractExperience(data) {
        const experienceList = [];
        if (data.workExperience && Array.isArray(data.workExperience)) {
            data.workExperience.forEach((workEntry) => {
                let company = '';
                let jobTitle = '';
                let location = '';
                let startDate = '';
                let endDate = '';
                let descriptions = [];

                if (workEntry.parsed) {
                    company = workEntry.parsed.workExperienceOrganization?.raw || '';
                    jobTitle = workEntry.parsed.workExperienceJobTitle?.raw || '';
                    location = workEntry.parsed.workExperienceLocation?.raw || '';
                    // descriptions = workEntry.parsed.workExperienceDescription?.map((item) => item.raw || '') || [''];
                    const dateRaw = workEntry.parsed.workExperienceDates?.raw || '';
                    if (dateRaw) {
                        const { start, end } = this.parseDynamicDateRange(dateRaw);
                        startDate = start;
                        endDate = end;
                    }
                }

                if (workEntry.parsed?.workExperienceLocation?.raw) {
                    location = workEntry.parsed.workExperienceLocation.raw;
                }

                //                 if (
                //     workEntry.parsed?.workExperienceDescription &&
                //     Array.isArray(workEntry.parsed.workExperienceDescription) &&
                //     workEntry.parsed?.workExperienceDescription.length > 0
                // ) {
                //     descriptions = workEntry.parsed?.workExperienceDescription
                //         .map((item) => item.raw || '')
                //         .join(', ');
                // }

                if (company || jobTitle) {
                    experienceList.push({
                        company,
                        location,
                        title: jobTitle,
                        date: {
                            from: startDate,
                            to: endDate || 'Present',
                        },
                        description: descriptions.length > 0 ? descriptions : [''],
                    });
                }
            });
        }
        return experienceList;
    }

    /**
     * Extract and segregate skills from API data
     */
    extractAndSegregateSkills(data) {
        const technicalSkills = [];
        const softSkills = [];

        if (data.skill && Array.isArray(data.skill)) {
            data.skill.forEach((skillItem) => {
                let skillText = '';
                let confidence = 0.5;

                if (skillItem.raw) {
                    skillText = skillItem.raw;
                } else if (skillItem.value) {
                    skillText = skillItem.value;
                } else if (skillItem.parsed?.skill) {
                    skillText = skillItem.parsed.skill.raw || skillItem.parsed.skill.value || '';
                } else if (typeof skillItem === 'string') {
                    skillText = skillItem;
                }

                if (skillItem.confidence !== undefined) {
                    confidence = skillItem.confidence;
                }

                skillText = skillText.trim().replace(/[,.]$/, '');
                if (skillText && skillText.length > 1) {
                    const skillLevel = this.mapConfidenceToLevel(confidence);

                    if (this.isTechnicalSkill(skillText)) {
                        if (!technicalSkills.find((s) => s.name.toLowerCase() === skillText.toLowerCase())) {
                            technicalSkills.push({ name: skillText, level: skillLevel });
                        }
                    } else if (this.isSoftSkill(skillText)) {
                        if (!softSkills.find((s) => s.name.toLowerCase() === skillText.toLowerCase())) {
                            softSkills.push({ name: skillText, level: skillLevel });
                        }
                    } // else {
                    //     if (!softSkills.find((s) => s.name.toLowerCase() === skillText.toLowerCase())) {
                    //         softSkills.push({ name: skillText, level: skillLevel });
                    //     }
                    // }
                }
            });
        }

        return { technicalSkills, softSkills };
    }

    /**
     * Extract languages from API data with correct name and proficiency
     */
    extractLanguages(data) {
        const languagesList = [];
        if (data.language && Array.isArray(data.language)) {
            data.language.forEach((langItem) => {
                let languageText = '';
                let proficiencyLevel = 'Intermediate';

                // Extract raw text or parsed fields
                if (langItem.raw) {
                    languageText = langItem.raw;
                } else if (langItem.value) {
                    languageText = langItem.value;
                } else if (langItem.parsed) {
                    if (langItem.parsed.language) {
                        languageText = langItem.parsed.language.raw || langItem.parsed.language.value || '';
                    }
                    if (langItem.parsed.proficiency) {
                        proficiencyLevel = this.mapLanguageProficiency(
                            langItem.parsed.proficiency.raw || langItem.parsed.proficiency.value || '',
                        );
                    }
                } else if (typeof langItem === 'string') {
                    languageText = langItem;
                }

                languageText = languageText.trim();

                if (languageText) {
                    // Split by common separators like space, colon, comma, etc.
                    const parts = languageText.split(/[\s:,\-$()]+/);
                    let language = parts[0].trim();

                    // Try to find proficiency in remaining parts
                    for (let i = 1; i < parts.length; i++) {
                        const potentialProficiency = parts[i].trim();
                        if (potentialProficiency) {
                            const mappedLevel = this.mapLanguageProficiency(potentialProficiency);
                            if (mappedLevel !== 'Intermediate') {
                                proficiencyLevel = mappedLevel;
                                break; // Stop at first valid proficiency found
                            }
                        }
                    }

                    language = this.cleanLanguageName(language);

                    if (language && language.length > 1) {
                        // Avoid duplicates
                        if (!languagesList.some((l) => l.name.toLowerCase() === language.toLowerCase())) {
                            languagesList.push({
                                name: language,
                                level: proficiencyLevel,
                            });
                        }
                    }
                }
            });
        }
        return languagesList;
    }

    /**
     * Extract summary from data, avoiding duplicates and noise
     */
    extractSummary(data) {
        const seen = new Set();
        const summaries = [];

        // Helper: Normalize text for comparison
        const normalizeText = (text) =>
            text
                .toLowerCase()
                .replace(/[^\w\s]/g, '')
                .trim();

        if (data.summary) {
            const structuredSummary = data.summary.parsed || data.summary.raw;
            if (structuredSummary) {
                const normalized = normalizeText(structuredSummary);
                if (!seen.has(normalized)) {
                    seen.add(normalized);
                    summaries.push(structuredSummary.trim());
                }
            }
        }

        if (data.rawText) {
            const paragraphs = data.rawText.split('\n').filter((line) => line.trim().length > 0);
            for (const paragraph of paragraphs) {
                const trimmed = paragraph.trim();

                // Skip noisy lines
                if (/^(professional working|proficiency|elementary|native|advanced)/i.test(trimmed)) continue;

                const normalized = normalizeText(trimmed);

                if (!seen.has(normalized) && this.isSummaryLike(trimmed)) {
                    seen.add(normalized);
                    summaries.push(trimmed);
                }
            }
        }

        // Join and return cleaned result
        return summaries.length > 0 ? summaries.join(' ') : 'Please add your professional summary here';
    }

    /**
     * Helper: Check if a paragraph sounds like a summary
     */
    isSummaryLike(text) {
        const summaryKeywords = [
            'summary',
            'profile',
            'career',
            'professional',
            'experienced',
            'seeking',
            'looking',
            'goal',
            'leverage',
            'contributing',
            'dedicated',
        ];
        const lower = text.toLowerCase();
        return summaryKeywords.some((keyword) => lower.includes(keyword));
    }

    /**
     * Extract objective from raw text
     */
    /**
     * Extract objective from structured data or raw text
     */
    extractObjective(data) {
        // First, try using structured objective data
        if (data.objective && typeof data.objective === 'object') {
            // Try parsed field first
            if (data.objective.parsed && typeof data.objective.parsed === 'string' && data.objective.parsed.trim()) {
                return data.objective.parsed.trim();
            }
            if (data.objective.raw && typeof data.objective.raw === 'string' && data.objective.raw.trim()) {
                return data.objective.raw.trim();
            }
        }

        // If no structured objective found, fallback to parsing raw text
        const rawText = data.rawText || '';
        if (typeof rawText === 'string' && rawText.trim()) {
            const objectiveKeywords = [
                'objective',
                'career goal',
                'professional goal',
                'looking to',
                'seeking',
                'aiming to',
                'focused on',
            ];

            // Split into paragraphs
            const paragraphs = rawText.split(/\r?\n/).filter((line) => line.trim().length > 0);

            for (const paragraph of paragraphs) {
                const lowerCaseParagraph = paragraph.toLowerCase();
                if (objectiveKeywords.some((keyword) => lowerCaseParagraph.includes(keyword))) {
                    return paragraph.trim();
                }
            }
        }

        // Default fallback
        return 'Seeking opportunities to leverage my skills and contribute to innovative projects.';
    }

    /**
     * Check if a skill is a technical skill and return normalized name if matched
     */
    isTechnicalSkill(skillName) {
        const technicalKeywords = new Set([
            'javascript',
            'python',
            'java',
            'c++',
            'react',
            'angular',
            'vue',
            'node.js',
            'sql',
            'aws',
            'docker',
            'git',
            'html',
            'css',
            'typescript',
            'kubernetes',
            'graphql',
            'rest',
            'api',
            'express',
            'django',
            'flask',
            'spring',
            'php',
            'ruby',
            '.net',
            'mysql',
            'postgresql',
            'mongodb',
            'firebase',
            'terraform',
            'linux',
            'bash',
            'powershell',
            'agile',
            'webpack',
            'npm',
            'yarn',
            'sass',
            'redux',
            'mobx',
            'jest',
            'mocha',
            'selenium',
            'fastify',
            'jira',
            'docker',
            'jenkins',
            'ci/cd',
            'microservices',
            'serverless',
            'bootstrap',
            'jquery',
            'rxjs',
            'ngrx',
            'ngrx/store',
            'apollo',
            'socket.io',
            'microsoft 365',
            'tableau',
        ]);

        const skillLower = skillName.trim().toLowerCase();
        for (const keyword of technicalKeywords) {
            const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            if (regex.test(skillLower)) {
                // Return properly capitalized name
                return skillLower
                    .split(' ')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
            }
        }
        return null;
    }

    /**
     * Check if a skill is a soft skill and return normalized name if matched
     */
    isSoftSkill(skillName) {
        const softSkillKeywords = new Set([
            'communication',
            'teamwork',
            'leadership',
            'problem-solving',
            'critical thinking',
            'adaptability',
            'creativity',
            'collaboration',
            'time management',
            'conflict resolution',
            'negotiation',
            'emotional intelligence',
            'decision making',
            'organization',
            'project management',
            'planning',
            'attention to detail',
            'multitasking',
            'initiative',
            'work ethic',
            'delegation',
            'persuasion',
            'influence',
            'resilience',
            'flexibility',
            'interpersonal skills',
            'active listening',
            'feedback',
            'self-motivation',
            'goal setting',
            'prioritization',
            'analytical thinking',
            'strategic planning',
            'resourcefulness',
            'presentation skills',
        ]);

        const skillLower = skillName.trim().toLowerCase();
        for (const keyword of softSkillKeywords) {
            const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            if (regex.test(skillLower)) {
                return skillLower
                    .split(' ')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
            }
        }
        return null;
    }

    /**
     * Map confidence score to skill level
     */
    mapConfidenceToLevel(confidence) {
        if (confidence >= 0.9) return 'Expert';
        if (confidence >= 0.8) return 'Advanced';
        if (confidence >= 0.6) return 'Intermediate';
        if (confidence >= 0.4) return 'Elementary';
        return 'Beginner';
    }

    /**
     * Map language proficiency text to standard levels
     */
    mapLanguageProficiency(proficiencyText) {
        const text = proficiencyText.toLowerCase();
        if (text.includes('native') || text.includes('bilingual')) return 'Native';
        if (text.includes('professional working') || text.includes('fluent')) return 'Advanced';
        if (text.includes('intermediate')) return 'Intermediate';
        if (text.includes('elementary') || text.includes('basic')) return 'Elementary';
        return 'Intermediate';
    }

    /**
     * Clean and standardize language names
     */
    cleanLanguageName(languageName) {
        if (!languageName) return '';
        return languageName.replace(/^(language|lang|speaking|fluency)/i, '').trim();
    }

    /**
     * Normalize a date string to a standard format (e.g., "Jan 2020", "Feb 2025")
     */
    normalizeDateString(dateStr) {
        if (!dateStr || dateStr.trim() === '') return '';

        dateStr = dateStr.trim();

        // Match MM/YYYY (e.g., 02/2025)
        const slashFormat = /^(\d{1,2})\/(\d{4})$/;
        if (slashFormat.test(dateStr)) {
            const [, month, year] = dateStr.match(slashFormat);
            const monthName = new Date(`${year}-${month.padStart(2, '0')}-01`).toLocaleString('default', {
                month: 'long',
            });
            return `${monthName} ${year}`;
        }

        // Match short Month YYYY (e.g., "May 2018")
        const shortMonthYearFormat = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{4}$/i;
        if (shortMonthYearFormat.test(dateStr)) {
            const [month, year] = dateStr.split(/\s+/);
            const date = new Date(`${month} 1, ${year}`);
            const monthName = date.toLocaleString('default', { month: 'long' });
            return `${monthName} ${year}`;
        }

        // Match full Month YYYY (e.g., "January 2020")
        const fullMonthFormat =
            /^(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}$/i;
        if (fullMonthFormat.test(dateStr)) {
            return dateStr; // Already correct format
        }

        // Match abbreviated Month YYYY (e.g., "Jun 2020") → expand to full name
        const knownFormat = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})$/i;
        if (knownFormat.test(dateStr)) {
            const [, shortMonth, year] = dateStr.match(knownFormat);
            const date = new Date(`${shortMonth} 1, ${year}`);
            const fullMonth = date.toLocaleString('default', { month: 'long' });
            return `${fullMonth} ${year}`;
        }

        // Fallback: Return original if no match
        return dateStr;
    }

    /**
     * Parse a date range string into normalized start and end dates.
     * Handles formats like:
     * - "May 2018 to July 2024"
     * - "02/2025 - Present"
     * - "May 2019 – June 2020"
     */
    parseDynamicDateRange(dateString) {
        // Normalize whitespace and remove extra spaces
        dateString = dateString.trim().replace(/\s+/g, ' ');

        // Try common separators
        let parts = [];
        if (dateString.includes(' to ')) {
            parts = dateString.split(' to ').map((d) => d.trim());
        } else if (dateString.includes('–')) {
            parts = dateString.split('–').map((d) => d.trim());
        } else if (dateString.includes('-')) {
            parts = dateString.split('-').map((d) => d.trim());
        } else {
            return { start: '', end: '' };
        }

        if (parts.length < 1) return { start: '', end: '' };

        let start = parts[0];
        let end = parts[1] || '';

        // Normalize month/year format (e.g., "02/2025" → "Feb 2025")
        start = this.normalizeDateString(start);
        end = this.normalizeDateString(end);

        return {
            start,
            end: end ? end : 'Present',
        };
    }

    /**
     * Get default template configuration
     */
    getDefaultTemplate() {
        return {
            name: 'modern',
            settings: {
                titleColor: '#2c3e50',
                contentColor: '#34495e',
                backgroundColor1: '#ffffff',
                backgroundColor2: '#f8f9fa',
                backgroundColor3: '#e9ecef',
            },
            pages: [
                {
                    columns: [
                        {
                            list: [
                                { name: 'summary', typeCard: 'point' },
                                { name: 'experience', typeCard: 'timeline' },
                                { name: 'education', typeCard: 'timeline' },
                                { name: 'technicalSkills', typeCard: 'score' },
                            ],
                        },
                    ],
                },
            ],
        };
    }

    /**
     * Create basic resume structure for manual filling
     */
    createBasicResumeStructure() {
        return {
            basicDetail: {
                name: '',
                title: '',
                email: '',
                phone: '',
                location: '',
                websiteUrl: {
                    linkedin: '',
                    github: '',
                    portfolio: '',
                },
            },
            objective: { value: '' },
            summary: { value: 'Please add your professional summary here' },
            education: { value: [] },
            experience: { value: [] },
            technicalSkills: { value: [] },
            softSkills: { value: [] },
            languages: { value: [] },
            awards: { value: [] },
            voluntering: { value: [] },
            references: { value: [] },
        };
    }

    /**
     * Create a new resume for a user
     */
    async createResume(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new ApiError(404, 'User not found');
            }

            const existingResume = await Resume.findOne({ user: userId });
            if (existingResume) {
                return existingResume;
            }

            const resume = new Resume({
                user: userId,
                basicDetail: {
                    name: `${user.firstName} ${user.lastName}`,
                    email: user.email,
                    title: '',
                    phone: '',
                    location: '',
                    websiteUrl: {
                        linkedin: '',
                        github: '',
                        portfolio: '',
                    },
                },
                objective: { value: '' },
                summary: { value: '' },
                education: { value: [] },
                experience: { value: [] },
                awards: { value: [] },
                languages: { value: [] },
                technicalSkills: { value: [] },
                softSkills: { value: [] },
                voluntering: { value: [] },
                references: { value: [] },
                template: this.getDefaultTemplate(),
            });

            await resume.save();

            if (user.__t === 'Applicant') {
                user.resume = resume._id;
                await user.save();
            }

            return resume;
        } catch (error) {
            console.error('Create resume error:', error);
            throw new ApiError(500, `Failed to create resume: ${error.message}`);
        }
    }
}

export default ResumeController;
