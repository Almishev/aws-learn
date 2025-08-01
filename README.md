# Radio Playlist Management System

Автоматизирана система за управление на плейлист за онлайн радио на DJ Boyko.

## 🎯 Функционалности

- **Добавяне на песни** - чрез публичен API
- **Автоматично планиране** - песни се пускат в зададеното време
- **Email известия** - DJ Boyko получава известия когато трябва да пусне песен
- **Съхранение на cover images** - в AWS S3
- **Бързо търсене** - по име на песен и изпълнител

## 🏗️ Архитектура

- **API Gateway** - публичен интерфейс
- **Lambda Functions** - бизнес логика
- **DynamoDB** - съхранение на данни
- **S3** - съхранение на cover images
- **SNS** - известия
- **EventBridge** - планиране

## 🚀 Инсталация и настройка

### 1. Клониране на проекта
```bash
git clone <repository-url>
cd aws
npm install
```

### 2. Настройка на environment variables
```bash
# Копирай шаблона
cp env.example .env

# Попълни AWS credentials
AWS_REGION=eu-central-1
AWS_ACCOUNT_ID=your-account-id
CDK_DEFAULT_ACCOUNT=your-account-id
CDK_DEFAULT_REGION=eu-central-1
```

### 3. Компилиране и тестване
```bash
npm run build
npm test
```

### 4. Деплойване
```bash
npx cdk synth
npx cdk deploy
```

## 📋 Полезни команди

* `npm run build`   - компилира TypeScript
* `npm run watch`   - следи за промени и компилира
* `npm run test`    - изпълнява unit тестове
* `npx cdk synth`  - генерира CloudFormation template
* `npx cdk diff`   - сравнява с текущото състояние
* `npx cdk deploy` - деплойва в AWS

## 💰 Очаквани разходи

За 3,000,000 заявки/месец:
- **DynamoDB**: ~$50-100/месец
- **Lambda**: ~$20-30/месец  
- **API Gateway**: ~$10-20/месец
- **S3**: ~$5-10/месец
- **SNS**: ~$1-2/месец
- **Общо**: ~$86-162/месец

## 🧪 Тестване

След деплойване, тествай с:

```bash
# Добавяне на песен
curl -X POST https://your-api-url/prod/songs \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Never Gonna Give You Up",
    "artist": "Rick Astley",
    "status": "scheduled",
    "playAt": "2025-07-15T16:00:00Z",
    "coverimage": "https://example.com/cover.jpg"
  }'
```
