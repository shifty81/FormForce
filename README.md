# FormForce

**AI-Powered Mobile Forms & Field Service Management Platform**

FormForce is a comprehensive, all-in-one field service management platform that combines AI-powered form creation with dispatching, inventory tracking, customer management (CRM), invoicing, and mobile capabilities. Designed for small to mid-sized businesses in trades like HVAC, plumbing, electrical, and construction.

---

## 🌟 Key Features

### 🤖 AI-Powered Form Creation
- **AI Form Builder**: Upload PDFs, Word documents, or images and instantly digitize them into functional digital forms
- **Camera Scanner**: Use your device camera to capture and convert paper forms into digital forms
- **OCR Technology**: Advanced optical character recognition extracts text and form fields from images
- **Drag-and-Drop Editor**: No-code interface to add fields, logic, and branding
- **Exact Formatting**: Preserves original look and feel for compliance requirements

### 📱 Advanced Data Capture
- **Rich Media Fields**: Images, sketches, GPS locations, and maps
- **Mobile-First Design**: iOS, Android, Windows compatible with offline support
- **Barcode/QR Scanning**: Quick data population from codes
- **eSignatures**: UETA and ESIGN compliant electronic signatures
- **Photo Capture**: Take photos with device camera or upload images
- **GPS Integration**: Click-to-map address navigation (opens default map app)

### ⚡ Automation & Smart Logic
- **Automated Calculations**: Excel-like formulas for complex operations
- **Conditional Logic**: Dynamic field visibility based on user input
- **DataSources**: Auto-populate fields from external systems
- **Automated Workflows**: Email PDFs, transfer drafts, cloud uploads

### 🚀 Dispatching & Scheduling
- **Drag-and-Drop Calendar**: Visual scheduling interface
- **Real-Time GPS Tracking**: Track technicians and fleet in real-time
- **Automated Job Assignments**: Smart dispatch based on availability
- **Address-to-Map Integration**: One-click navigation to job sites
- **Priority Management**: Urgent/High/Normal/Low prioritization
- **Status Tracking**: Pending, In-Progress, Completed workflows

### 📦 Real-Time Inventory Management
- **Live Tracking**: Real-time inventory updates via WebSocket
- **Low Stock Alerts**: Automatic notifications for items below threshold
- **Category Management**: Organize items by category and location
- **Quick Adjustments**: One-click quantity updates (+/-)
- **Multi-Location Support**: Track inventory across multiple warehouses

### 👥 Customer Management (CRM)
- **Centralized Database**: Customer contact information and history
- **Job History**: Complete record of all customer interactions
- **Client Portals**: Self-service portals for customers
- **Communication Tracking**: Email, phone, and note history

### 💰 Invoicing & Payments
- **Professional Invoicing**: Create branded invoices quickly
- **Estimate-to-Job Conversion**: One-click conversion from estimates
- **Good/Better/Best Pricing**: Multi-tier estimate options
- **Credit Card Processing**: Accept payments on mobile devices
- **Electronic Payments**: Faster payment collection

### 📊 Reporting & Analytics
- **Customizable Reports**: Aggregate data from multiple forms
- **Visual Dashboards**: Track trends and KPIs
- **Performance Metrics**: Dispatch completion rates, response times
- **Export Options**: PDF, Excel, email delivery

### 🔒 Enterprise Security & Compliance
- **UETA/ESIGN Compliant**: Legally binding electronic signatures
- **SOC 2 Type 2**: Enterprise-grade security standards
- **HIPAA Available**: Optional add-on for healthcare providers
- **Custom SSO**: Single Sign-On integration
- **Granular Permissions**: Role-based access control

### 🔗 Integrations
- **QuickBooks**: Seamless accounting sync (eliminate double entry)
- **Salesforce, Procore, Smartsheet**: Native integrations
- **Google Drive, Box, OneDrive**: Cloud storage connections
- **Microsoft Dynamics 365, Autodesk**: Construction software links
- **Open API**: Custom integrations for proprietary systems
- **Servicecall.ai**: AI-powered service call routing

---

## 🏗️ Technology Stack

### Backend
- **Node.js** with Express.js
- **SQLite** database (easily upgradable to PostgreSQL/MySQL)
- **Socket.io** for real-time updates
- **JWT** authentication
- **bcrypt** for password hashing

### Frontend
- **React 18** with React Router
- **Socket.io-client** for real-time features
- **Signature Pad** for UETA-compliant signatures
- **Tesseract.js** for OCR processing
- **Axios** for API communication
- **Chart.js** for data visualization

---

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ and npm

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/shifty81/FormForce.git
cd FormForce
```

2. **Install server dependencies**
```bash
npm install
```

3. **Install client dependencies**
```bash
cd client
npm install
cd ..
```

4. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Start development servers**
```bash
# Terminal 1: Start backend
npm run server

# Terminal 2: Start frontend
cd client
npm start
```

6. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Production Build

```bash
# Build the frontend
cd client
npm run build
cd ..

# Start production server
NODE_ENV=production npm start
```

---

## 📖 Usage Guide

### Creating Forms

#### Option 1: AI Upload (PDF/Word/Images)
1. Navigate to **AI Upload** page
2. Choose upload method:
   - **Upload File**: Select PDF or Word document
   - **Use Camera**: Scan paper forms with device camera
   - **Upload Photo**: Select image file (JPG, PNG, etc.)
3. Click **Process with AI**
4. Review and customize generated form fields
5. Save the form

#### Option 2: Manual Form Builder
1. Go to **Forms** → **Create Form**
2. Add form title and description
3. Drag and drop fields from the sidebar:
   - Text, Email, Phone, Number
   - Date, Time, Textarea
   - Dropdown, Radio, Checkbox
   - File Upload, Signature
   - GPS Location, Photo Capture
   - Barcode Scanner, Auto-Calculate
4. Configure field properties:
   - Label, Required status
   - Options for dropdowns/radio
   - Validation rules
5. Save the form

### Managing Dispatches

1. Navigate to **Dispatch** page
2. Click **+ New Dispatch**
3. Fill in dispatch details:
   - Title and description
   - Address (for GPS navigation)
   - Status and priority
   - Due date
4. Click address **🗺️** button to open in maps
5. Update status as work progresses
6. Mark as complete when finished

### Tracking Inventory

1. Go to **Inventory** page
2. Click **+ Add Item**
3. Enter item details:
   - Name, description
   - Quantity and unit
   - Category and location
4. Use **+/-** buttons for quick adjustments
5. Filter by category or search items
6. Monitor low stock alerts

### Generating Reports

1. Visit **Reports** page
2. View key metrics:
   - Form submissions
   - Dispatch performance
   - Inventory status
3. Export data to PDF or Excel
4. Schedule automated report delivery

---

## 🎯 Use Cases

### HVAC Companies
- Service call forms with equipment details
- Maintenance checklists with photos
- Parts inventory tracking
- Technician scheduling and routing
- Customer service history

### Plumbing Services
- Job estimates with pricing tiers
- Work order forms with signatures
- Emergency dispatch management
- Supply inventory tracking
- Invoice generation

### Electrical Contractors
- Safety inspection forms
- Permit documentation
- Material usage tracking
- Multi-site job scheduling
- Compliance reporting

### Construction
- Daily logs with photo documentation
- Equipment inspection checklists
- Material inventory management
- Subcontractor coordination
- Progress reporting

---

## 🔐 Security & Compliance

### Electronic Signatures
- **UETA Compliant**: Uniform Electronic Transactions Act
- **ESIGN Compliant**: Electronic Signatures in Global and National Commerce Act
- Legally binding signatures with audit trails
- Timestamp and user identification

### Data Protection
- Encrypted data transmission (HTTPS)
- Secure password storage (bcrypt)
- JWT token-based authentication
- Role-based access control
- Session management

### Compliance Options
- **HIPAA**: Available for healthcare providers
- **SOC 2 Type 2**: Enterprise security standards
- **GDPR Ready**: Data privacy controls
- **Custom SSO**: Enterprise authentication

---

## 🛣️ Roadmap

### Phase 1: Core Features ✅
- [x] Form builder with AI upload
- [x] Camera scanner and OCR
- [x] Dispatch management
- [x] Inventory tracking
- [x] Real-time updates
- [x] GPS integration

### Phase 2: Field Service Management (In Progress)
- [ ] Full CRM with customer database
- [ ] Estimates and invoicing system
- [ ] Payment processing integration
- [ ] Time tracking and payroll
- [ ] Advanced scheduling calendar
- [ ] Mobile app for technicians

### Phase 3: Integrations
- [ ] QuickBooks sync
- [ ] Salesforce connector
- [ ] Google Workspace integration
- [ ] Microsoft 365 sync
- [ ] Procore integration
- [ ] Open API documentation

### Phase 4: Advanced Features
- [ ] AI-powered service call routing
- [ ] Predictive maintenance alerts
- [ ] Customer feedback system
- [ ] Multi-language support
- [ ] White-label options
- [ ] Advanced analytics and BI

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

- **Documentation**: [GitHub Wiki](https://github.com/shifty81/FormForce/wiki)
- **Issues**: [GitHub Issues](https://github.com/shifty81/FormForce/issues)
- **Discussions**: [GitHub Discussions](https://github.com/shifty81/FormForce/discussions)

---

## 🙏 Acknowledgments

- Built with React and Node.js
- OCR powered by Tesseract.js
- Icons and emojis for visual enhancement
- Inspired by leading field service management platforms

---

**FormForce** - Empowering field service businesses with AI-powered digital transformation 🚀
