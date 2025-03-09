import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import fetchRepoDetails from '../utils/fetchRepoDetails.js';
import dotenv from 'dotenv';

dotenv.config();

const JSON_FILE = path.join(process.cwd(), 'data/community_projects.json');
const LATEST_PROJECT_FILE = path.join(process.cwd(), 'data/latest_project.txt');
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

// Ensure JSON file exists
const ensureFileExists = () => {
    if (!fs.existsSync(JSON_FILE)) fs.writeFileSync(JSON_FILE, '[]');
    if (!fs.existsSync(LATEST_PROJECT_FILE)) fs.writeFileSync(LATEST_PROJECT_FILE, '');
};

// Load existing projects
const loadProjects = () => {
    ensureFileExists();
    return JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
};

// Save projects
const saveProjects = (projects, latestProject) => {
    ensureFileExists();
    fs.writeFileSync(JSON_FILE, JSON.stringify(projects, null, 2));
    fs.writeFileSync(LATEST_PROJECT_FILE, latestProject);
};

// Verify GitHub Webhook Signature
const verifySignature = (req) => {
    const signature = req.headers['x-hub-signature-256'];
    if (!signature) return false;

    const payload = JSON.stringify(req.body);
    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    hmac.update(payload);
    const calculatedSignature = `sha256=${hmac.digest('hex')}`;

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(calculatedSignature));
};

// Handle Webhook
export const handleWebhook = async (req, res) => {
    if (!verifySignature(req)) {
        return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.headers['x-github-event'];
    const payload = req.body;

    if (event === 'repository' || event === 'push') {
        const { name, owner, html_url, description, topics } = payload.repository;

        if ((description && description.toLowerCase().includes('soplang')) ||
            (topics && topics.includes('soplang'))) {

            let projects = loadProjects();
            if (!projects.some(p => p.url === html_url)) {
                const repoDetails = await fetchRepoDetails(owner.login, name);
                if (repoDetails) {
                    projects.push(repoDetails);
                    saveProjects(projects, name);
                }
            }
        }
    }

    res.status(200).json({ message: 'Webhook received' });
};
