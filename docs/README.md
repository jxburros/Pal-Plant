# Pal-Plant Documentation

Welcome to the Pal-Plant documentation directory. This folder contains comprehensive guides and reference materials for using and developing Pal-Plant.

## 📚 Current Documentation

### [Firebase Configuration Guide](FIREBASE.md)
Complete guide for setting up Firebase Cloud Messaging for push notifications.

**Topics covered:**
- Quick start guide for web, Android, and iOS
- Firebase usage policy (FCM only, local-first architecture)
- Step-by-step configuration instructions
- How push notifications work
- Testing procedures
- Troubleshooting common issues
- Security and privacy details

**When to read:**
- Setting up the app for the first time
- Configuring push notifications
- Understanding Firebase usage scope
- Troubleshooting notification issues

## 📦 Archived Documentation

The [`archive/`](archive/) directory contains historical documentation that provides context about past development work but is no longer actively maintained.

**Contents:**
- `AUDIT_FINAL_REPORT.md` - February 2026 audit results
- `REFACTORING_SUMMARY.md` - Major refactoring work documentation
- `ISSUES_IMPLEMENTATION_SUMMARY.md` - Technical implementation details
- `APP_ANALYSIS.md` - Original application analysis

See [`archive/README.md`](archive/README.md) for more details.

## 🚀 Quick Links

### Getting Started
- [Main README](../README.md) - Project overview and getting started
- [Firebase Setup](FIREBASE.md) - Push notification configuration

### Development
- [Contributing Guide](../CONTRIBUTING.md) - How to contribute
- [Changelog](../CHANGELOG.md) - Recent changes and updates
- [Project Structure](../README.md#-project-structure) - Code organization

### Legal
- [License](../LICENSE) - Apache License 2.0

## 🗂️ Documentation Structure

```
docs/
├── README.md (this file)    # Documentation index
├── FIREBASE.md              # Firebase configuration guide
└── archive/                 # Historical documentation
    ├── README.md            # Archive index
    ├── AUDIT_FINAL_REPORT.md
    ├── REFACTORING_SUMMARY.md
    ├── ISSUES_IMPLEMENTATION_SUMMARY.md
    └── APP_ANALYSIS.md
```

## 🔍 Finding What You Need

### "How do I set up push notifications?"
→ [Firebase Configuration Guide](FIREBASE.md)

### "How do I contribute to the project?"
→ [Contributing Guide](../CONTRIBUTING.md)

### "What's changed recently?"
→ [Changelog](../CHANGELOG.md)

### "What was done in the February 2026 refactoring?"
→ [Archived Refactoring Summary](archive/REFACTORING_SUMMARY.md)

### "Why was a specific architectural decision made?"
→ Check the [Archive](archive/) for historical context

### "How do I use the app?"
→ [Main README](../README.md)

## 💡 Documentation Philosophy

Our documentation follows these principles:

1. **Code is the source of truth** - Documentation describes the code, not aspirations
2. **Accuracy over completeness** - We'd rather have accurate, focused docs than comprehensive but outdated ones
3. **Progressive disclosure** - Start with the essentials, provide depth when needed
4. **Preserve history** - Old docs are archived, not deleted, to maintain context

## 🤝 Contributing to Documentation

Found an error or want to improve the docs? Great! Please:

1. Check that your change reflects the actual code behavior
2. Update cross-references if you move or rename files
3. Follow the existing documentation style
4. Test any code examples you include
5. Submit a Pull Request with your changes

See [Contributing Guide](../CONTRIBUTING.md) for more details.

---

**Last Updated:** 2026-02-17  
**Maintained by:** Pal-Plant contributors
