const OpenAI = require('openai');
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ Could not connect to MongoDB:', err.message);
    process.exit(1);
  });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ========== Schemas ==========
const jobSchema = new mongoose.Schema({
    title: String, company: String, location: String, salary: String,
    type: { type: String, enum: ['Full Time', 'Part Time', 'Contract', 'Internship'] },
    category: String, description: String, postedDate: { type: Date, default: Date.now }
});
const Job = mongoose.model('Job', jobSchema);

const companySchema = new mongoose.Schema({
    name: String, logo: { type: String, default: 'fas fa-building' }, industry: String,
    location: String, description: String, openJobs: Number, employees: String, featured: Boolean
});
const Company = mongoose.model('Company', companySchema);

const newsSchema = new mongoose.Schema({
    date: Date, title: String, summary: String, link: { type: String, default: '#' }
});
const News = mongoose.model('News', newsSchema);

// ========== API Endpoints ==========
app.get('/api/companies', async (req, res) => {
    try {
        const filter = req.query.featured === 'true' ? { featured: true } : {};
        const companies = await Company.find(filter).sort({ name: 1 });
        res.json(companies);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/news', async (req, res) => {
    try {
        const news = await News.find().sort({ date: -1 }).limit(3);
        res.json(news);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/jobs/featured', async (req, res) => {
    try {
        const jobs = await Job.find().sort({ postedDate: -1 }).limit(3);
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/jobs/:id', async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ error: 'Job not found' });
        res.json(job);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/jobs', async (req, res) => {
    try {
        const { location, type, category, keywords, minSalary, maxSalary, sort, page = 1, limit = 10 } = req.query;
        let filter = {};

        if (location && location !== 'Any Location') filter.location = { $regex: location, $options: 'i' };
        if (type && type !== 'All Types') filter.type = type;
        if (category && category !== 'All Categories') filter.category = category;
        if (keywords) filter.$or = [
            { title: { $regex: keywords, $options: 'i' } },
            { company: { $regex: keywords, $options: 'i' } },
            { description: { $regex: keywords, $options: 'i' } }
        ];

        // Salary filtering (assumes salary stored as "LKR 120,000 - 160,000")
        if (minSalary || maxSalary) {
            filter.$and = [];
            if (minSalary) filter.$and.push({ salary: { $regex: `${minSalary}`, $options: 'i' } });
            if (maxSalary) filter.$and.push({ salary: { $regex: `${maxSalary}`, $options: 'i' } });
        }

        let sortOption = { postedDate: -1 };
        if (sort === 'salary-desc') sortOption = { salary: -1 };
        if (sort === 'salary-asc') sortOption = { salary: 1 };

        const pageNum = parseInt(page), limitNum = parseInt(limit), skip = (pageNum - 1) * limitNum;
        const jobs = await Job.find(filter).sort(sortOption).skip(skip).limit(limitNum);
        const total = await Job.countDocuments(filter);

        res.json({ jobs, currentPage: pageNum, totalPages: Math.ceil(total / limitNum), totalJobs: total });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/chat', express.json(), async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: 'Message required' });
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'You are a helpful assistant for StudentGig, a job portal in Sri Lanka. Answer questions about jobs, companies, career advice. Be friendly and concise.' },
                { role: 'user', content: message }
            ],
            max_tokens: 250,
            temperature: 0.7,
        });
        res.json({ reply: completion.choices[0].message.content });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Failed to get response' });
    }
});

// POST /api/jobs – Create a new job
app.post('/api/jobs', async (req, res) => {
    try {
        const { title, company, location, salary, type, category, description } = req.body;

        // Basic validation
        if (!title || !company || !location || !type || !category || !description) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const newJob = new Job({
            title,
            company,
            location,
            salary: salary || '',      // optional
            type,
            category,
            description,
            postedDate: new Date()
        });

        await newJob.save();
        res.status(201).json({ message: 'Job posted successfully', job: newJob });
    } catch (error) {
        console.error('Error posting job:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));