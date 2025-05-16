# 🌱 Greenee

> Greenee is a platform that measures website carbon footprints and evaluates compliance with W3C's Web Sustainability Guidelines (WSG), helping create a more sustainable web ecosystem.

![Greenee Preview](docs/demo.gif)

## 🌍 Why It Matters

The digital carbon footprint is a growing environmental concern, with websites contributing significantly to global CO₂ emissions. Every byte transferred, every image loaded, and every server request adds to this environmental impact. Greenee addresses this challenge by:

- Measuring and visualizing website carbon emissions
- Providing actionable insights for optimization
- Converting images to efficient WebP format
- Building a community of eco-conscious developers

## 🚀 Features

- 🔍 Real-time website carbon footprint analysis
- 🧠 Gemini API-based WSG evaluation (93 criteria)
- 🖼️ Image optimization audit with visual markup
- 🏆 Public leaderboard and achievement badges
- 🌐 WebP automatic conversion service (UseWebP)
- 📊 Comprehensive sustainability reports
- 🤝 Community contribution system

## 🔧 Tech Stack

### Frontend
- React
- TypeScript
- TailwindCSS
- Vite

### Backend
- FastAPI
- Java Spring Boot
- JWT Authentication
- OAuth2.0

### Infrastructure
- Google Cloud Platform
- Firebase
- BigQuery
- Cloud Storage

### AI/ML
- Google Gemini API
- TensorFlow Lite

## ⚙️ Installation & Setup

1. Clone the repository:
```bash
git clone https://github.com/greenee/web-carbon-platform.git
cd greenee
```

2. Backend setup:
```bash
# FastAPI
cd backend/fastapi
pip install -r requirements.txt
uvicorn main:app --reload

# Spring Boot
cd backend/spring
./gradlew bootRun
```

3. Frontend setup:
```bash
cd frontend/my-dashboard
npm install
npm run dev
```

## 🧪 How It Works

![Architecture Diagram](docs/architecture.png)

Greenee operates through a three-layer architecture:
1. **Measurement Layer**: Captures website metrics and resource usage
2. **Analysis Layer**: Processes data through sustainability models
3. **Optimization Layer**: Provides recommendations and automatic optimizations

## 📊 Sustainability Evaluation Logic

Our evaluation process combines multiple approaches:
1. **Resource Analysis**: Using Lighthouse to measure webpage resources
2. **Carbon Calculation**: Applying the Sustainable Web Design Model
3. **Guidelines Check**: Evaluating against W3C's WSG using Gemini API
4. **Optimization Detection**: Identifying improvement opportunities

## 📁 Project Structure

```
├── backend/
│   ├── fastapi/        # Python backend services
│   └── spring/         # Java Spring services
├── frontend/
│   ├── src/
│   └── public/
├── utils/              # Shared utilities
└── docs/              # Documentation
```
## UseWebP Software(Git)

https://github.com/dongkyu20/img2webp_proxy

## 🙋 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Commit Convention
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation
- **style**: Formatting
- **refactor**: Code restructuring
- **test**: Testing
- **chore**: Maintenance

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📬 Contact

Team Greenee
- Website: https://greenee.kr
- Email: contact@greenee.kr
- GitHub: [@greenee](https://github.com/greenee)

---


## ✨ Live Demo

Visit our live demo at [https://greenee.kr](https://greenee.kr)
