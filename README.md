# Literature Review Showcase

An interactive web-based dashboard that transforms a comprehensive PhD-level literature review into compelling visualizations. This system showcases research data on AI Security Economics and Game Theory, demonstrating systematic screening methodology and research rigor.

## 🚀 Quick Start

### Windows (Easiest)
1. Double-click `run.bat` to start the development server
2. Open your browser to `http://localhost:5173`

### Manual Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎯 Features

- **📊 Interactive Overview**: Animated metrics and quality indicators
- **📈 Timeline Visualization**: 35-year research evolution with D3.js
- **🔗 Topic Network**: Research theme relationships with React Flow
- **👥 Author Network**: Collaboration graph of 1,400+ researchers
- **🔍 Research Gap Analysis**: AI-powered opportunity identification
- **🔎 Advanced Search**: Multi-criteria filtering with export
- **📱 Responsive Design**: Works on desktop, tablet, and mobile

## 🧪 Testing

### Automated Testing
```bash
# Run all tests
npm run test

# Or use the batch file
test.bat
```

### Manual Testing
- Open browser console and run: `runLiteratureReviewTests()`
- Check all navigation tabs work correctly
- Test responsive design on different screen sizes
- Verify search and filtering functionality

## 📁 Project Structure

```
literature-review-showcase/
├── src/
│   ├── components/          # React components
│   ├── data/               # Data loading and processing
│   ├── utils/              # Analysis utilities
│   ├── services/           # External API services
│   ├── types/              # TypeScript definitions
│   └── tests/              # Test suites
├── public/                 # Static assets
├── run.bat                 # Windows quick start
├── test.bat               # Windows testing
└── PRODUCTION_CHECKLIST.md # Deployment guide
```

## 🎓 Academic Purpose

This application demonstrates:
- **Research Methodology**: Systematic literature review process
- **Technical Skills**: Modern web development with React/TypeScript
- **Data Analysis**: Text mining and network analysis
- **Visualization**: Interactive charts and responsive design
- **Academic Rigor**: Quality metrics and gap analysis

## 🔧 Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Visualizations**: D3.js + Recharts + React Flow
- **APIs**: Semantic Scholar + OpenAlex
- **Build**: Vite with ESLint

## 📊 Data

The application loads a comprehensive research dataset:
- **🎯 PRIMARY**: `public/screened-data.xlsx` (Systematically screened papers)
- **📋 Backup**: `public/raw-data.csv` (Raw literature search results)

This demonstrates complete systematic review methodology from initial search to final curated papers, showcasing PhD-level research rigor and comprehensive coverage of AI Security Economics and Game Theory literature.

## 🚀 Deployment

### Quick Deploy (Recommended)
1. Run `npm run build`
2. Upload `dist/` folder to any static hosting service
3. Popular options: Vercel, Netlify, GitHub Pages

### Production Checklist
See `PRODUCTION_CHECKLIST.md` for comprehensive deployment guide.

## 🐛 Known Issues

- Some TypeScript warnings (non-blocking)
- External API rate limits (graceful fallbacks implemented)
- Large datasets may take a moment to load initially

## 📞 Support

For issues or questions:
1. Check `PRODUCTION_CHECKLIST.md` for common solutions
2. Review browser console for error messages
3. Ensure all dependencies are installed with `npm install`

## 🎉 Demo Ready

The application is ready for:
- PhD application demonstrations
- Academic presentations
- Research showcase events
- Portfolio demonstrations

**Live Demo**: Deploy to see the full interactive experience showcasing systematic literature review methodology and technical implementation skills.