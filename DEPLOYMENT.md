# GitHub Pages Deployment Guide

## Quick Deployment

### Option 1: Automatic Deployment (Recommended)
1. Push your code to a GitHub repository
2. Go to repository Settings → Pages
3. Set Source to "GitHub Actions"
4. The workflow will automatically build and deploy on every push to main

### Option 2: Manual Deployment
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## Repository Setup

1. **Create GitHub Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Literature Review Showcase"
   git branch -M main
   git remote add origin https://github.com/yourusername/literature-review-showcase.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**
   - Go to repository Settings
   - Scroll to "Pages" section
   - Set Source to "GitHub Actions"
   - Your site will be available at: `https://yourusername.github.io/literature-review-showcase/`

## Configuration

The application is pre-configured for GitHub Pages deployment:

- **Base URL**: Automatically set to `/literature-review-showcase/` in production
- **Build Output**: Optimized for static hosting
- **Asset Handling**: All assets properly referenced for subdirectory deployment

## Troubleshooting

### Common Issues

1. **404 on GitHub Pages**
   - Ensure the repository name matches the base URL in `vite.config.ts`
   - Check that GitHub Pages is enabled in repository settings

2. **Assets Not Loading**
   - Verify the base URL configuration
   - Check that all assets are in the `public/` directory

3. **Build Failures**
   - Check the Actions tab for build logs
   - Ensure all dependencies are listed in `package.json`

### Data Files

The application expects these files in the `public/` directory:
- `screened-data.xlsx` - Primary dataset (systematically screened papers)
- `raw-data.csv` - Backup dataset (raw search results)

If these files are missing, the application will fall back to sample data for demonstration.

## Performance

The deployed application includes:
- **Code Splitting**: Vendor libraries separated for better caching
- **Asset Optimization**: Images and files optimized for web delivery
- **Lazy Loading**: Components loaded on demand
- **Responsive Design**: Optimized for all device sizes

## Security

- **Client-Side Only**: No server-side processing required
- **Static Assets**: All data served as static files
- **No Authentication**: Public research showcase
- **HTTPS**: Automatically enabled on GitHub Pages

## Monitoring

After deployment, monitor:
- **Load Times**: Should be < 3 seconds on fast connections
- **Mobile Performance**: Test on various devices
- **Data Loading**: Check browser console for any errors
- **Interactive Features**: Verify all visualizations work correctly

## Updates

To update the deployed application:
1. Make changes to your code
2. Commit and push to the main branch
3. GitHub Actions will automatically rebuild and deploy
4. Changes will be live within 2-3 minutes

## Custom Domain (Optional)

To use a custom domain:
1. Add a `CNAME` file to the `public/` directory with your domain
2. Configure DNS settings with your domain provider
3. Update the `cname` field in `.github/workflows/deploy.yml`

## Support

For deployment issues:
1. Check the Actions tab for build logs
2. Review the GitHub Pages documentation
3. Ensure all files are committed and pushed
4. Verify repository settings are correct