# Radio Playlist Management System

Автоматизирана система за управление на плейлист за онлайн радио на DJ Boyko.

## 🎯 Функционалности

- **Добавяне на песни** - чрез публичен API с JSON формат
- **Автоматично планиране** - песни се пускат в зададеното време
- **Email известия** - DJ Boyko получава известия когато трябва да пусне песен
- **Съхранение на cover images** - в AWS S3
- **Бързо търсене** - по име на изпълнител

## 🏗️ Архитектура

### **Диаграма на системата:**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │───▶│  Lambda (Add)   │───▶│   DynamoDB      │
│   (Public API)  │    │  (Add Songs)    │    │   (Songs Table) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │      S3        │    │   EventBridge   │
                       │ (Cover Images) │    │   (Scheduler)   │
                       └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │  Lambda (Play)  │
                                              │ (Process Songs) │
                                              └─────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │      SNS        │
                                              │ (Notifications) │
                                              └─────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │   DJ Boyko      │
                                              │   (Email)       │
                                              └─────────────────┘
```

### **AWS Услуги и техният избор:**

#### **1. API Gateway**
- **Защо:** Публичен интерфейс за добавяне на песни
- **Предимства:** Автоматично HTTPS, rate limiting, monitoring
- **Алтернатива:** Application Load Balancer (по-сложно)

#### **2. Lambda Functions**
- **Защо:** Serverless бизнес логика
- **Предимства:** Плащаш само за използване, автоматично scaling
- **Алтернатива:** ECS/Fargate (по-сложно управление)

#### **3. DynamoDB**
- **Защо:** NoSQL за бързо търсене и планиране
- **Предимства:** PAY_PER_REQUEST, автоматично scaling
- **Алтернатива:** RDS PostgreSQL (по-скъпо за този случай)

#### **4. S3**
- **Защо:** Съхранение на cover images
- **Предимства:** Най-евтиното storage, CDN интеграция
- **Алтернатива:** EFS (по-скъпо за статични файлове)

#### **5. SNS**
- **Защо:** Email известия за DJ Boyko
- **Предимства:** Просто, надеждно, автоматично retry
- **Алтернатива:** SES (по-сложно за този случай)

#### **6. EventBridge**
- **Защо:** Планиране на изпълнение на песни
- **Предимства:** Cron-like scheduling, serverless
- **Алтернатива:** CloudWatch Events (старо име за същото)

## 🚀 Инсталация и настройка

### **1. Клониране на проекта**
```bash
git clone <repository-url>
cd aws
npm install
```

### **2. Компилиране и тестване**
```bash
npm run build
npm test
```

### **3. Деплойване**
```bash
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

### **Изчисления за 3,000,000 заявки/месец:**

#### **DynamoDB (PAY_PER_REQUEST):**
- **Read/Write Units:** ~100,000/месец
- **GSI Queries:** ~50,000/месец
- **Разходи:** ~$50-100/месец

#### **Lambda Functions (ARM64):**
- **AddSong:** ~1,000,000 изпълнения
- **PlaySong:** ~43,200 изпълнения (на всяка минута)
- **Memory:** 128MB, 1 секунда средно
- **Разходи:** ~$20-30/месец

#### **API Gateway:**
- **Requests:** ~1,000,000/месец
- **Data Transfer:** ~10GB/месец
- **Разходи:** ~$10-20/месец

#### **S3 (Cover Images):**
- **Storage:** ~100GB (50,000 песни × 2MB)
- **Requests:** ~100,000/месец
- **Разходи:** ~$5-10/месец

#### **SNS:**
- **Notifications:** ~43,200/месец
- **Разходи:** ~$1-2/месец

#### **EventBridge:**
- **Rules:** 1 правило
- **Triggers:** ~43,200/месец
- **Разходи:** ~$1-2/месец

### **Общо:** ~$87-164/месец

## 🧪 Тестване

### **След деплойване, тествай с:**

#### **1. Добавяне на песен:**
```bash
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

#### **2. Проверка на DynamoDB:**
- Отиди в AWS Console → DynamoDB
- Намери таблица `radio-songs`
- Провери дали песента е добавена

#### **3. Проверка на S3:**
- Отиди в AWS Console → S3
- Намери bucket `radio-cover-images`
- Провери дали cover image е качен

#### **4. Проверка на известия:**
- Провери email на DJ Boyko
- Трябва да получи известие когато времето настъпи

## 🔧 Алтернативни подходи

### **1. Монолитна архитектура:**
- **Плюсове:** По-просто за малки проекти
- **Минусове:** Трудно scaling, единична точка на неуспех
- **Защо не избрахме:** Не е подходящо за radio система

### **2. Микросервизи:**
- **Плюсове:** Независимо развитие, scaling
- **Минусове:** Сложност, network overhead
- **Защо не избрахме:** Overkill за този проект

### **3. Container-based:**
- **Плюсове:** Пълна контрола, portability
- **Минусове:** Управление на инфраструктура
- **Защо не избрахме:** Serverless е по-евтино

### **4. Database:**
- **RDS PostgreSQL:** По-скъпо, по-сложно за търсене
- **MongoDB:** По-скъпо, няма нужда от сложни queries
- **Защо избрахме DynamoDB:** Най-евтино за този случай

## 📊 Мониторинг и логове

### **CloudWatch Logs:**
- Lambda функциите автоматично логват
- API Gateway логове за debugging
- SNS delivery status

### **Метрики:**
- DynamoDB: Read/Write capacity
- Lambda: Duration, errors, invocations
- API Gateway: Request count, latency

## 🔒 Security

### **IAM Permissions:**
- Минимални права за всяка Lambda
- S3 bucket policies
- DynamoDB table policies

### **Network Security:**
- HTTPS навсякъде
- VPC isolation (ако е нужно)
- API Gateway rate limiting

## 🚀 CI/CD Pipeline

### **GitHub Actions:**
- Автоматично тестване при push
- Автоматично деплойване в main branch
- Type checking и linting

### **Deployment Process:**
1. Code push в main branch
2. GitHub Actions се стартира
3. Тестове се изпълняват
4. CDK синтезира template
5. Деплойване в AWS
6. Outputs се показват

## 📈 Scaling

### **Автоматично Scaling:**
- Lambda: Автоматично до 1000 concurrent executions
- DynamoDB: PAY_PER_REQUEST автоматично scaling
- API Gateway: Автоматично до 10,000 RPS

### **Manual Scaling:**
- Увеличаване на Lambda memory
- Добавяне на DynamoDB capacity
- Настройка на API Gateway throttling
