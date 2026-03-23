// ==================== Global Functions ====================
function comingSoon() { alert('This feature is coming soon!'); }



document.addEventListener('click', function(e) {
    // Intercept only buttons that are not meant to navigate (e.g., bookmark, coming soon).
    // .btn-apply is now excluded – it will work as a normal link.
    if (e.target.matches('.btn-save, .read-more, .btn-link, .company-card-enhanced .btn-outline, .coming-soon')) {
        e.preventDefault();
        comingSoon();
    }
});

// ==================== Job Loading with Sorting ====================
let currentSort = 'recent';
let currentFilters = {};

async function loadJobs(page = 1) {
    try {
        const params = new URLSearchParams({ page, ...currentFilters });
        if (currentSort === 'salary-desc') params.append('sort', 'salary-desc');
        if (currentSort === 'salary-asc') params.append('sort', 'salary-asc');
        
        const response = await fetch(`/api/jobs?${params.toString()}`);
        const data = await response.json();

        const container = document.getElementById('job-grid-container');
        if (!container) return;
        container.innerHTML = '';
        data.jobs.forEach(job => container.appendChild(createJobCard(job)));

        const jobCount = document.getElementById('job-count');
        if (jobCount) jobCount.textContent = data.totalJobs;

        renderPagination(data.currentPage, data.totalPages);
    } catch (error) {
        console.error('Error loading jobs:', error);
    }
}

function createJobCard(job) {
    const card = document.createElement('div');
    card.className = 'job-card';
    card.innerHTML = `
        <div class="job-card-header">
            <div class="company-logo"><i class="fas fa-building"></i></div>
            <div><h3>${escapeHtml(job.title)}</h3><div class="company-name">${escapeHtml(job.company)}</div></div>
            <span class="job-type ${job.type.toLowerCase().replace(' ', '-')}">${job.type}</span>
        </div>
        <div class="job-details">
            <div class="location"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(job.location)}</div>
            <div class="salary">${escapeHtml(job.salary)}</div>
            <div class="posted-date"><i class="far fa-clock"></i> ${timeAgo(job.postedDate)}</div>
        </div>
        <p>${escapeHtml(job.description)}</p>
        <div class="job-footer">
            <a href="apply.html?id=${job._id}" class="btn-apply">Apply Now</a>
            <button class="btn-save"><i class="far fa-bookmark"></i></button>
        </div>
    `;
    return card;
}

function timeAgo(dateString) {
    const posted = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((now - posted) / (1000 * 60 * 60 * 24));
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
}

function renderPagination(currentPage, totalPages) {
    const paginationDiv = document.getElementById('pagination');
    if (!paginationDiv) return;
    let html = '';
    for (let i = 1; i <= totalPages; i++) {
        html += `<a href="#" class="${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</a>`;
    }
    paginationDiv.innerHTML = html;
    paginationDiv.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            loadJobs(e.target.dataset.page);
        });
    });
}

// ==================== Filter Handling ====================
const filterForm = document.getElementById('filter-form');
if (filterForm) {
    filterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const location = document.getElementById('filter-location').value;
        const type = document.getElementById('filter-type').value;
        const category = document.getElementById('filter-category').value;
        const minSalary = document.getElementById('filter-min-salary').value;
        const maxSalary = document.getElementById('filter-max-salary').value;

        currentFilters = {};
        if (location && location !== 'Any Location') currentFilters.location = location;
        if (type && type !== 'All Types') currentFilters.type = type;
        if (category && category !== 'All Categories') currentFilters.category = category;
        if (minSalary) currentFilters.minSalary = minSalary;
        if (maxSalary) currentFilters.maxSalary = maxSalary;
        currentFilters.page = 1;
        loadJobs(1);
    });
}

// ==================== Sort Handling ====================
const sortSelect = document.getElementById('sort-select');
if (sortSelect) {
    sortSelect.addEventListener('change', () => {
        currentSort = sortSelect.value;
        loadJobs(1);
    });
}

// ==================== Search Handling ====================
const searchBtn = document.getElementById('search-btn');
if (searchBtn) {
    searchBtn.addEventListener('click', async () => {
        const keywords = document.getElementById('search-keywords').value;
        const location = document.getElementById('search-location').value;
        currentFilters = {};
        if (keywords) currentFilters.keywords = keywords;
        if (location) currentFilters.location = location;
        loadJobs(1);
    });
}

// ==================== Initial Load ====================
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('job-grid-container')) loadJobs();
});

// ==================== Homepage Dynamic Sections ====================
async function loadFeaturedJobs() {
    const container = document.querySelector('.featured-jobs');
    if (!container) return;
    try {
        const res = await fetch('/api/jobs/featured');
        const jobs = await res.json();
        container.innerHTML = '';
        jobs.forEach(job => container.appendChild(createJobCard(job)));
    } catch (err) { console.error(err); }
}

async function loadHomeCompanies() {
    const container = document.querySelector('.company-grid-home');
    if (!container) return;
    try {
        const res = await fetch('/api/companies?featured=true');
        const companies = await res.json();
        container.innerHTML = '';
        companies.forEach(company => {
            const card = document.createElement('div');
            card.className = 'company-card-home';
            card.innerHTML = `
                <div class="company-logo-home"><i class="${company.logo}"></i></div>
                <h3>${escapeHtml(company.name)}</h3>
                <p class="industry">${escapeHtml(company.industry)}</p>
                <p class="location"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(company.location)}</p>
                <a href="#" class="btn-link">View Jobs →</a>
            `;
            container.appendChild(card);
        });
    } catch (err) { console.error(err); }
}

async function loadNews() {
    const container = document.querySelector('.news-grid');
    if (!container) return;
    try {
        const res = await fetch('/api/news');
        const news = await res.json();
        container.innerHTML = '';
        news.forEach(item => {
            const card = document.createElement('div');
            card.className = 'news-card';
            card.innerHTML = `
                <div class="news-date">${formatDate(item.date)}</div>
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.summary)}</p>
                <a href="${item.link}" class="read-more">Read More →</a>
            `;
            container.appendChild(card);
        });
    } catch (err) { console.error(err); }
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

async function loadAllCompanies() {
    const container = document.getElementById('company-grid-container');
    if (!container) return;
    try {
        const res = await fetch('/api/companies');
        const companies = await res.json();
        container.innerHTML = '';
        companies.forEach(company => {
            const card = document.createElement('div');
            card.className = 'company-card-enhanced';
            card.innerHTML = `
                ${company.featured ? '<div class="company-badge">Featured</div>' : ''}
                <div class="company-logo-wrapper"><div class="company-logo-circle"><i class="${company.logo}"></i></div></div>
                <h3>${escapeHtml(company.name)}</h3>
                <div class="company-meta"><span><i class="fas fa-briefcase"></i> ${escapeHtml(company.industry)}</span><span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(company.location)}</span></div>
                <div class="company-description">${escapeHtml(company.description)}</div>
                <div class="company-stats-mini"><div><span>${company.openJobs}</span> open jobs</div><div><span>${company.employees}</span> employees</div></div>
                <a href="#" class="btn-outline">View Profile →</a>
            `;
            container.appendChild(card);
        });
    } catch (err) { console.error(err); }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Additional initializations
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.featured-jobs')) {
        loadFeaturedJobs();
        loadHomeCompanies();
        loadNews();
    }
    if (document.getElementById('company-grid-container')) loadAllCompanies();

    // Newsletter forms
    document.querySelectorAll('.newsletter-form').forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Thanks for subscribing! You will receive updates soon.');
            form.reset();
        });
    });
    document.getElementById('contactForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Your message has been sent. We will get back to you soon!');
        e.target.reset();
    });
    document.getElementById('postJobForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Collect form data
    const jobData = {
        title: document.getElementById('job-title').value.trim(),
        company: document.getElementById('company-name').value.trim(),
        location: document.getElementById('location').value.trim(),
        salary: document.getElementById('salary').value.trim(),
        type: document.getElementById('job-type').value,
        category: document.getElementById('category').value,
        description: document.getElementById('job-description').value.trim()
    };

    // Basic frontend validation
    if (!jobData.title || !jobData.company || !jobData.location || !jobData.type || !jobData.category || !jobData.description) {
        alert('Please fill in all required fields.');
        return;
    }

    try {
        const response = await fetch('/api/jobs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(jobData)
        });

        if (response.ok) {
            const result = await response.json();
            alert('Job posted successfully!');
            // Reset the form
            e.target.reset();
            // Optionally redirect to jobs page
            setTimeout(() => {
                window.location.href = 'jobs.html';
            }, 1500);
        } else {
            const error = await response.json();
            alert('Error posting job: ' + (error.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Network error:', error);
        alert('Failed to connect to server. Please try again later.');
    }
});
});

// Apply page specific
if (window.location.pathname.includes('apply.html')) {
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('id');
    if (jobId) {
        fetch(`/api/jobs/${jobId}`).then(res => res.json()).then(job => {
            const summary = document.getElementById('jobSummary');
            if (summary) summary.innerHTML = `
                <h2>Job Details</h2>
                <div class="job-title">${escapeHtml(job.title)}</div>
                <div class="company-name">${escapeHtml(job.company)}</div>
                <div class="job-details">
                    <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(job.location)}</span>
                    <span><i class="fas fa-money-bill-wave"></i> ${escapeHtml(job.salary)}</span>
                    <span><i class="fas fa-briefcase"></i> ${job.type}</span>
                </div>
                <div class="job-description"><strong>Job Description:</strong><p>${escapeHtml(job.description)}</p></div>
            `;
        }).catch(console.error);
    }
    document.getElementById('applicationForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const file = document.getElementById('resume').files[0];
        if (!file) { alert('Please upload your resume.'); return; }
        document.getElementById('successMessage').style.display = 'block';
        setTimeout(() => window.location.href = 'jobs.html', 2000);
    });
}
window.handleFileUpload = function(input) {
    const file = input.files[0];
    const fileNameSpan = document.getElementById('fileName');
    if (file) {
        if (file.size > 5 * 1024 * 1024) { alert('File size must be less than 5MB'); input.value = ''; fileNameSpan.textContent = ''; return; }
        const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!validTypes.includes(file.type)) { alert('Please upload PDF, DOC, or DOCX files only'); input.value = ''; fileNameSpan.textContent = ''; return; }
        fileNameSpan.textContent = `Selected: ${file.name}`;
    } else fileNameSpan.textContent = '';
};

// Courses page dynamic content
if (window.location.pathname.includes('courses.html')) {
    const platforms = [
        { name: "Coursera", icon: "fas fa-graduation-cap", desc: "World-class courses from top universities & companies.", courses: "7,000+", learners: "100M+" },
        { name: "Udemy", icon: "fas fa-chalkboard-user", desc: "Affordable courses on tech, business, and personal growth.", courses: "200,000+", learners: "62M+" },
        { name: "edX", icon: "fas fa-landmark", desc: "High-quality programs from Harvard, MIT, and more.", courses: "3,500+", learners: "40M+" },
        { name: "LinkedIn Learning", icon: "fab fa-linkedin", desc: "Professional skills & career-focused video courses.", courses: "16,000+", learners: "20M+" }
    ];
    const platformGrid = document.getElementById('platformGrid');
    if (platformGrid) {
        platforms.forEach(p => {
            platformGrid.innerHTML += `
                <div class="platform-card">
                    <div class="platform-logo"><i class="${p.icon}" style="font-size:58px;"></i></div>
                    <h3>${p.name}</h3>
                    <p>${p.desc}</p>
                    <div class="platform-stats"><span><i class="fas fa-book-open"></i> ${p.courses} courses</span><span><i class="fas fa-users"></i> ${p.learners}</span></div>
                    <a href="#" class="btn-platform">Explore →</a>
                </div>
            `;
        });
    }
    const coursesCatalog = [
        { title: "Google Data Analytics", provider: "Coursera", rating: 4.8, price: "Free enrollment", level: "Beginner", hours: "180h", icon: "fas fa-chart-simple" },
        { title: "The Complete Web Dev Bootcamp", provider: "Udemy", rating: 4.7, price: "$49.99", level: "All Levels", hours: "62h", icon: "fas fa-code" },
        { title: "CS50's Introduction to CS", provider: "edX (Harvard)", rating: 4.9, price: "Free audit", level: "Beginner", hours: "11 weeks", icon: "fas fa-laptop-code" },
        { title: "Machine Learning Specialization", provider: "Coursera (Stanford)", rating: 4.9, price: "$49/mo", level: "Advanced", hours: "3 months", icon: "fas fa-brain" }
    ];
    const courseGrid = document.getElementById('courseGrid');
    function renderCourses(arr) {
        if (!courseGrid) return;
        courseGrid.innerHTML = '';
        arr.forEach(c => {
            let stars = '';
            for (let i = 0; i < Math.floor(c.rating); i++) stars += '<i class="fas fa-star"></i>';
            if (c.rating % 1 >= 0.5) stars += '<i class="fas fa-star-half-alt"></i>';
            courseGrid.innerHTML += `
                <div class="course-card">
                    <div class="course-img"><i class="${c.icon}" style="font-size:48px;"></i></div>
                    <div class="course-info">
                        <h3>${c.title}</h3>
                        <div class="course-meta"><span><i class="fas fa-building"></i> ${c.provider}</span><span><i class="far fa-clock"></i> ${c.hours}</span></div>
                        <div class="rating">${stars} <span style="color:#555;">(${c.rating})</span></div>
                        <div class="course-price">${c.price}</div>
                        <div class="course-footer"><span style="background:#eef2ff; padding:4px 12px; border-radius:20px; font-size:12px;">${c.level}</span><a href="#" class="btn-apply">Enroll →</a></div>
                    </div>
                </div>
            `;
        });
    }
    renderCourses(coursesCatalog);
    const searchInput = document.getElementById('courseSearch');
    const searchBtn = document.getElementById('courseSearchBtn');
    const filterCourses = () => {
        const q = searchInput.value.toLowerCase();
        if (!q) renderCourses(coursesCatalog);
        else renderCourses(coursesCatalog.filter(c => c.title.toLowerCase().includes(q) || c.provider.toLowerCase().includes(q) || c.level.toLowerCase().includes(q)));
    };
    if (searchBtn) searchBtn.addEventListener('click', filterCourses);
    if (searchInput) searchInput.addEventListener('keyup', e => { if (e.key === 'Enter') filterCourses(); });
}

// Animation and typing effect for hero (keep original functionality)
setTimeout(() => {
  if(document.getElementById('fadeIcon')) document.getElementById('fadeIcon').style.opacity = '1';
  if(document.getElementById('fadeIcon')) document.getElementById('fadeIcon').style.transform = 'translateY(0)';
  if(document.getElementById('slideLeft')) document.getElementById('slideLeft').style.opacity = '1';
  if(document.getElementById('slideLeft')) document.getElementById('slideLeft').style.transform = 'translateX(0)';
  if(document.getElementById('slideRight')) document.getElementById('slideRight').style.opacity = '1';
  if(document.getElementById('slideRight')) document.getElementById('slideRight').style.transform = 'translateX(0)';
  if(document.getElementById('fadeUp')) document.getElementById('fadeUp').style.opacity = '1';
  if(document.getElementById('featuresGrid')) { document.getElementById('featuresGrid').style.opacity = '1'; document.getElementById('featuresGrid').style.transform = 'translateY(0)'; }
  if(document.getElementById('statsSection')) { document.getElementById('statsSection').style.opacity = '1'; document.getElementById('statsSection').style.transform = 'translateY(0)'; }
}, 100);
const text = "Sri Lanka's Premier Student Job Portal";
const typingElement = document.getElementById('typingText');
if(typingElement) {
  let i = 0;
  setTimeout(() => {
    typingElement.style.width = '0';
    const typingInterval = setInterval(() => {
      if(i < text.length) { typingElement.style.width = (i+1)*12+'px'; typingElement.textContent = text.substring(0,i+1); i++; } else clearInterval(typingInterval);
    }, 100);
  }, 500);
}