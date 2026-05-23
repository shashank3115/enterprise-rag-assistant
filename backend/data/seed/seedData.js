// ============================================
// Seed Script - Creates sample users & data
// Run: npm run seed
// ============================================

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const User = require('../../models/User');
const Document = require('../../models/Document');
const Chunk = require('../../models/Chunk');
const { processRawText } = require('../../services/documentService');

// ---------- Sample Enterprise Datasets ----------

const HR_POLICY = `
COMPANY HR POLICY DOCUMENT - TechCorp Enterprises

1. LEAVE POLICY
Employees are entitled to the following leave types:
- Annual Leave: 20 days per year for all full-time employees
- Sick Leave: 12 days per year with medical certificate required for 3+ consecutive days
- Maternity Leave: 26 weeks for female employees as per company policy
- Paternity Leave: 2 weeks for male employees
- Casual Leave: 7 days per year, non-accumulative
- Bereavement Leave: 5 days for immediate family

Vacation Policy: Employees must submit leave requests at least 2 weeks in advance for planned leave. Unused annual leave can be carried forward up to 5 days maximum. Leave approval is subject to manager discretion and team workload.

2. WORK FROM HOME POLICY
Employees may work from home up to 3 days per week with manager approval. Remote work requests must be submitted via the HR portal. All remote employees must be available during core hours (10 AM - 4 PM). VPN access is mandatory for remote work.

3. EMPLOYEE BENEFITS
- Health Insurance: Comprehensive medical, dental, and vision coverage for employee and dependents
- 401(k) matching: Company matches up to 6% of employee contributions
- Professional Development: $2,500 annual learning budget per employee
- Gym Membership: Monthly reimbursement up to $75
- Commuter Benefits: Pre-tax transit and parking benefits
- Employee Assistance Program (EAP): Free counseling and support services

4. CODE OF CONDUCT
All employees must adhere to professional standards including:
- Maintaining confidentiality of company information
- Respecting diversity and inclusion policies
- Following anti-harassment guidelines
- Reporting conflicts of interest
- Complying with data protection regulations

5. PERFORMANCE REVIEWS
Performance reviews are conducted biannually in June and December. Reviews include self-assessment, manager evaluation, and peer feedback. Rating scale: Exceptional (5), Exceeds Expectations (4), Meets Expectations (3), Needs Improvement (2), Unsatisfactory (1).

6. ONBOARDING PROCESS
New employee onboarding includes:
- IT setup and access provisioning (Day 1)
- HR orientation and benefits enrollment (Day 1-2)
- Department introduction and mentor assignment (Week 1)
- Training plan creation (Week 1)
- 30-day check-in with HR
- 90-day probation review
`;

const FINANCE_REPORT = `
QUARTERLY FINANCIAL REPORT - Q1 2026
TechCorp Enterprises - CONFIDENTIAL

EXECUTIVE SUMMARY:
Total Revenue: $45.2 million (up 12% YoY)
Operating Expenses: $32.8 million
Net Profit: $8.7 million
Profit Margin: 19.2%
Employee Count: 1,247

REVENUE BREAKDOWN BY DEPARTMENT:
- Product Sales: $28.5 million (63% of total)
- Professional Services: $9.8 million (22% of total)
- Subscriptions/SaaS: $5.2 million (12% of total)
- Licensing: $1.7 million (4% of total)

OPERATING EXPENSES:
- Salaries & Benefits: $18.2 million (55% of OpEx)
- Infrastructure & Cloud: $4.1 million (13% of OpEx)
- Marketing & Sales: $3.9 million (12% of OpEx)
- Research & Development: $3.2 million (10% of OpEx)
- General & Administrative: $2.1 million (6% of OpEx)
- Legal & Compliance: $1.3 million (4% of OpEx)

BUDGET ALLOCATIONS FOR Q2 2026:
- Engineering: $8.5 million (new product development)
- Marketing: $4.2 million (brand awareness campaign)
- Sales: $3.8 million (expansion into APAC market)
- HR: $1.2 million (hiring and training)
- IT Infrastructure: $2.3 million (cloud migration phase 2)

CASH FLOW:
Beginning Balance: $12.4 million
Net Cash from Operations: $10.2 million
Capital Expenditures: -$3.8 million
Ending Balance: $18.8 million

PROJECTED ANNUAL REVENUE: $185 million (target 15% growth)

KEY FINANCIAL RISKS:
1. Currency fluctuation in international markets
2. Increased competition in SaaS segment
3. Rising cloud infrastructure costs
4. Regulatory compliance costs in EU market
`;

const SECURITY_AUDIT = `
SECURITY AUDIT LOG - TechCorp Enterprises
Report Period: January 1, 2026 - March 31, 2026

INCIDENT LOG:

INCIDENT-001 | Date: 2026-01-15 | Severity: HIGH
Type: Unauthorized Access Attempt
Description: Multiple failed login attempts detected from IP 192.168.45.201 targeting admin accounts. Brute force attack pattern identified. Account locked after 5 failed attempts.
Resolution: IP blocked at firewall level. Affected accounts required password reset. MFA enforcement expanded to all admin accounts.
Status: RESOLVED

INCIDENT-002 | Date: 2026-02-03 | Severity: MEDIUM
Type: Data Exfiltration Attempt
Description: Unusual data download pattern detected from employee workstation (User: J.Smith, Dept: Engineering). Large file transfers to external cloud storage detected by DLP system.
Resolution: Investigation revealed authorized data backup activity. Updated DLP rules to exclude approved backup services. Employee received security awareness training.
Status: RESOLVED

INCIDENT-003 | Date: 2026-02-18 | Severity: CRITICAL
Type: Phishing Campaign
Description: Targeted phishing emails sent to 47 employees impersonating IT department. 3 employees clicked malicious links. No credentials were compromised due to MFA.
Resolution: Affected workstations quarantined and scanned. Company-wide phishing awareness alert sent. Additional email filtering rules implemented.
Status: RESOLVED

INCIDENT-004 | Date: 2026-03-14 | Severity: HIGH
Type: Security Breach - Third Party
Description: Vendor management platform (VendorHub) reported a data breach affecting partner API keys. TechCorp API keys potentially exposed.
Resolution: All vendor API keys rotated within 2 hours. Access logs reviewed for unauthorized usage. No unauthorized access confirmed. Vendor relationship under review.
Status: RESOLVED

VULNERABILITY ASSESSMENT:
- Total vulnerabilities scanned: 2,847
- Critical: 3 (all patched)
- High: 12 (10 patched, 2 in progress)
- Medium: 45 (38 patched)
- Low: 112 (ongoing remediation)

COMPLIANCE STATUS:
- SOC 2 Type II: Compliant (audit completed Feb 2026)
- GDPR: Compliant with quarterly DPO review
- ISO 27001: Certification renewal in progress
- PCI DSS: Not applicable (no card data processing)

RECOMMENDATIONS:
1. Implement zero-trust network architecture by Q3 2026
2. Expand security awareness training frequency to monthly
3. Deploy advanced endpoint detection and response (EDR) solution4. Conduct red team exercise in Q2 2026
`;

const COMPLIANCE_REPORT = `
COMPLIANCE AND REGULATORY REPORT - TechCorp Enterprises
Annual Review 2026

DATA PROTECTION & PRIVACY:
TechCorp maintains compliance with GDPR, CCPA, and other regional data protection regulations. Our Data Protection Officer (DPO) conducts quarterly reviews of data processing activities.

Key Compliance Metrics:
- Data Subject Access Requests (DSARs) processed: 128 (avg response time: 12 days)
- Data breach notifications: 1 (within 72-hour requirement)
- Privacy Impact Assessments completed: 15
- Third-party data processing agreements: 47 active agreements reviewed

INFORMATION SECURITY:
All systems undergo regular penetration testing and vulnerability assessments. Security patches are applied within SLA requirements:
- Critical patches: Within 24 hours
- High severity: Within 7 days
- Medium severity: Within 30 days

EMPLOYEE TRAINING:
- Security awareness training completion: 97% of employees
- Anti-phishing simulation pass rate: 89%
- GDPR training completion: 100% of employees handling personal data

AUDIT FINDINGS:
Internal Audit identified 3 minor findings:
1. Inconsistent access review schedule for legacy systems (Risk: Low, Remediation: Q2 2026)
2. Missing data classification labels on 12% of shared drives (Risk: Medium, Remediation: Q1 2026)
3. Outdated incident response runbooks for two subsidiary systems (Risk: Low, Remediation: Q2 2026)

REGULATORY CHANGES:
Monitoring upcoming regulations:
- EU AI Act: Impact assessment in progress for AI-powered products
- Digital Services Act: Compliance framework being developed
- Updated SEC cyber disclosure rules: Quarterly reporting process established
`;

const ENGINEERING_DOCS = `
ENGINEERING DEPARTMENT - TECHNICAL DOCUMENTATION
TechCorp Platform Architecture Guide

SYSTEM ARCHITECTURE:
TechCorp's platform follows a microservices architecture deployed on AWS:

Primary Services:
1. API Gateway (Kong) - Handles routing, rate limiting, authentication
2. User Service - Manages user accounts, profiles, and permissions
3. Product Service - Product catalog, inventory, and pricing
4. Order Service - Order processing, fulfillment, and tracking
5. Analytics Service - Real-time analytics and reporting
6. Notification Service - Email, SMS, and push notifications

Infrastructure:
- Container Orchestration: Kubernetes (EKS)
- Database: PostgreSQL (RDS) for relational data, MongoDB Atlas for documents
- Cache: Redis Cluster for session management and frequently accessed data
- Message Queue: Apache Kafka for event streaming
- CDN: CloudFront for static assets
- Monitoring: Prometheus + Grafana for metrics, ELK stack for logging

DEPLOYMENT PROCESS:
1. Feature branch → Pull Request → Code Review (min 2 approvers)
2. Automated CI/CD pipeline (GitHub Actions)
3. Unit tests, integration tests, security scanning
4. Staging deployment with automated regression testing
5. Production deployment via blue-green strategy
6. Automated rollback on health check failure

API STANDARDS:
- RESTful API design with OpenAPI 3.0 documentation
- Authentication: OAuth 2.0 with JWT tokens
- Rate limiting: 100 requests/minute per user, 1000/minute per service
- Response format: JSON with consistent error structure
- Versioning: URL-based (v1, v2) for breaking changes

CODING STANDARDS:
- Language: TypeScript for backend services, React/TypeScript for frontend
- Testing: Minimum 80% code coverage
- Documentation: JSDoc for functions, README for each service
- Security: OWASP Top 10 compliance, regular dependency auditing
`;

// ---------- Sample Users ----------

const SAMPLE_USERS = [
  { name: 'Admin User', email: 'admin@techcorp.com', password: 'admin123', role: 'admin', department: 'admin' },
  { name: 'Sarah Johnson', email: 'hr@techcorp.com', password: 'hr123456', role: 'hr', department: 'hr' },
  { name: 'Mike Chen', email: 'finance@techcorp.com', password: 'fin123456', role: 'finance', department: 'finance' },
  { name: 'Alex Rivera', email: 'engineer@techcorp.com', password: 'eng123456', role: 'engineer', department: 'engineering' },
  { name: 'Jamie Lee', email: 'intern@techcorp.com', password: 'int123456', role: 'intern', department: 'general' },
];

// ---------- Seed Function ----------

const seedDatabase = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rag-enterprise';
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Document.deleteMany({});
    await Chunk.deleteMany({});

    // Create users
    console.log('👥 Creating sample users...');
    const users = [];
    for (const userData of SAMPLE_USERS) {
      const user = await User.create(userData);
      users.push(user);
      console.log(`   Created: ${user.name} (${user.role})`);
    }

    const adminUser = users[0];

    // Create and process documents
    const documents = [
      {
        title: 'HR Policy Document',
        type: 'txt',
        department: 'hr',
        allowedRoles: ['admin', 'hr', 'engineer', 'intern'],
        content: HR_POLICY,
      },
      {
        title: 'Q1 2026 Financial Report',
        type: 'txt',
        department: 'finance',
        allowedRoles: ['admin', 'finance'],
        content: FINANCE_REPORT,
      },
      {
        title: 'Security Audit Log 2026',
        type: 'txt',
        department: 'security',
        allowedRoles: ['admin'],
        content: SECURITY_AUDIT,
      },
      {
        title: 'Compliance Report 2026',
        type: 'txt',
        department: 'security',
        allowedRoles: ['admin', 'hr'],
        content: COMPLIANCE_REPORT,
      },
      {
        title: 'Engineering Architecture Guide',
        type: 'txt',
        department: 'engineering',
        allowedRoles: ['admin', 'engineer'],
        content: ENGINEERING_DOCS,
      },
    ];

    console.log('\n📄 Creating and processing documents...');
    for (const docData of documents) {
      console.log(`   Processing: ${docData.title}...`);
      const doc = await Document.create({
        title: docData.title,
        type: docData.type,
        department: docData.department,
        allowedRoles: docData.allowedRoles,
        uploadedBy: adminUser._id,
        source: 'seed',
        status: 'processing',
      });

      await processRawText(docData.content, doc._id, {
        title: docData.title,
        department: docData.department,
        allowedRoles: docData.allowedRoles,
      });

      console.log(`   ✅ ${docData.title} - processed`);
    }

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📋 Sample Accounts:');
    console.log('─'.repeat(50));
    SAMPLE_USERS.forEach((u) => {
      console.log(`   ${u.role.padEnd(10)} | ${u.email.padEnd(25)} | ${u.password}`);
    });
    console.log('─'.repeat(50));

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedDatabase();
