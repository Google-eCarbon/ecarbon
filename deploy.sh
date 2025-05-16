#!/bin/bash

# React 앱 빌드
cd frontend/my-dashboard
npm install
npm run build

# 빌드된 파일을 Spring Boot 정적 리소스 디렉토리로 복사
echo "빌드 파일 복사 중..."
mkdir -p ../src/main/resources/static
rm -rf ../src/main/resources/static/*
cp -r dist/* ../src/main/resources/static/

cd ..

# Spring Boot 앱 빌드
./gradlew build

# 배포 (예: JAR 파일 실행)
java -jar build/libs/ecarbon-0.0.1-SNAPSHOT.jar