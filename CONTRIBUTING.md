# 🙌 Contributing to Greenee

First off, thanks for taking the time to contribute to **Greenee**!  
We appreciate your interest in building a more sustainable web.

---

## 🧾 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Commit Message Convention](#commit-message-convention)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Issue Reporting](#issue-reporting)

---

## 📜 Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before participating.

---

## 🚀 How to Contribute

There are several ways you can help:

- 🐛 **Report bugs**  
- ✨ **Suggest new features**  
- 🛠️ **Fix issues** (check [Issues](https://github.com/greenee/web-carbon-platform/issues))  
- 📚 **Improve documentation**  
- 🌱 **Enhance sustainability logic or AI evaluation**

---

## ⚙️ Development Setup

1. **Clone the repo**
    ```bash
    git clone https://github.com/greenee/web-carbon-platform.git
    cd web-carbon-platform
    ```

2. **Start the backend**
    - FastAPI
      ```bash
      cd backend/fastapi
      pip install -r requirements.txt
      uvicorn main:app --reload
      ```
    - Spring Boot
      ```bash
      cd backend/spring
      ./gradlew bootRun
      ```

3. **Start the frontend**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

---

## 📝 Commit Message Convention

We follow the conventional commit format:
### Allowed types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code formatting, no logic change
- `refactor`: Code restructuring
- `test`: Adding or fixing tests
- `chore`: Other changes (e.g. build scripts)

## ✅ Pull Request Guidelines

- Make sure your branch is up to date with `main`
- Write a clear and concise title for the pull request
- Describe the key changes in detail in the PR description
- At least one approved review is required before merging
- CI tests must pass

---

## 🐞 Issue Reporting

If you found a bug or have a suggestion:

- Use the [issue tracker](https://github.com/Google-eCarbon/ecarbon/issues)
- Include steps to reproduce the issue, expected behavior, and actual behavior
- Screenshots or logs are very helpful

---

## 💚 Thank You!

Your contribution helps build a more sustainable web.  
We’re excited to have you on board 💪🌱

— Team Greenee


