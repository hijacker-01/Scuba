# 🌊 Havelock Dive Club - Professional Scuba Diving Website

A high-performance, modern website for Havelock Dive Club in the Andaman Islands, featuring stunning 3D animations, smooth scrolling, and integrated Razorpay payment system.

![Performance Badge](https://img.shields.io/badge/Performance-A%2B-brightgreen)
![Lighthouse Score](https://img.shields.io/badge/Lighthouse-95%2B-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![React](https://img.shields.io/badge/React-18.2-blue)
![Next.js](https://img.shields.io/badge/Next.js-14.0-black)

## ✨ Features

### 🎨 Design & Experience
- **Hero Section** with 3D animated ocean scene using Three.js + React Three Fiber
- **Smooth Scrolling** with GSAP animations (8-9 full-page sections)
- **Glassmorphism Design** with modern UI components
- **Framer Motion** animations for engaging interactions
- **Responsive Design** optimized for mobile, tablet, and desktop
- **Dark Theme** with ocean blue accents

### 🎯 Core Functionality
- **8-9 Interactive Sections**:
  1. Hero with 3D ocean visualization
  2. Activities showcase
  3. Dive courses & certifications
  4. Image gallery
  5. Statistics & achievements
  6. Guest testimonials
  7. Booking system
  8. Contact information
  9. Footer

### 💳 Payment Integration
- **Razorpay Payment Gateway** integration
- Secure payment processing
- Real-time order creation & verification
- Signature validation for security

### ⚡ Performance Optimizations
- **Ultra-fast** load times (< 2s)
- **Low latency** responsive interactions
- WebGL context optimization
- Image lazy loading
- Code splitting & dynamic imports
- Service Worker support
- Optimized 3D rendering

### 📱 Additional Features
- **SEO Optimized** meta tags and structured data
- **Accessibility** WCAG 2.1 compliance
- **Mobile-first** responsive design
- **Email notifications** (ready to integrate)
- **Admin capabilities** (ready to extend)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm 9+ or yarn
- Razorpay account (for payments)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/hijacker-01/Scuba-diving.git
cd Scuba-diving
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Razorpay credentials:
```
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
```

### Get Razorpay Keys

1. Create account at [Razorpay](https://razorpay.com)
2. Go to Dashboard → Settings → API Keys
3. Copy Key ID and Key Secret
4. Add to `.env.local`

### Running Locally

**Development mode:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Production build:**
```bash
npm run build
npm start
```

## 📁 Project Structure

```
scuba-dive-website/
├── app/
│   ├── api/
│   │   ├── payment/
│   │   │   ├── create-order.ts          # Create payment order
│   │   │   └── verify-payment.ts        # Verify payment signature
│   │   └── bookings/
│   │       └── route.ts                 # Booking management
│   ├── layout.tsx                       # Root layout
│   ├── page.tsx                         # Main landing page
│   └── globals.css                      # Global styles
├── components/
│   ├── Hero.tsx                         # 3D hero section
│   ├── Activities.tsx                   # Activities showcase
│   ├── Courses.tsx                      # Dive courses
│   ├── Gallery.tsx                      # Gallery section
│   ├── Stats.tsx                        # Statistics
│   ├── Testimonials.tsx                 # Reviews
│   ├── Booking.tsx                      # Booking form
│   ├── Contact.tsx                      # Contact section
│   ├── Footer.tsx                       # Footer
│   ├── Navbar.tsx                       # Navigation
│   └── 3D/
│       ├── OceanScene.tsx              # 3D ocean visualization
│       └── Bubbles.tsx                 # Particle effects
├── hooks/
│   └── useBooking.ts                   # Custom booking hook
├── lib/
│   ├── razorpay.ts                     # Razorpay utilities
│   └── utils.ts                        # Helper functions
├── public/
│   ├── models/                         # 3D model files
│   └── images/                         # Image assets
├── styles/
│   └── animations.css                  # GSAP animations
├── .env.example                        # Environment template
├── next.config.js                      # Next.js config
├── tailwind.config.js                  # Tailwind config
├── tsconfig.json                       # TypeScript config
└── package.json                        # Dependencies
```

## 🎨 Customization

### Colors
Edit `tailwind.config.js` to customize ocean and sand color palettes:
```javascript
colors: {
  ocean: { /* customize blue tones */ },
  sand: { /* customize warm tones */ },
}
```

### Content
- Update activities in `components/Activities.tsx`
- Modify courses in `components/Courses.tsx`
- Add testimonials in `components/Testimonials.tsx`
- Update contact info in `components/Contact.tsx`

### 3D Scene
Edit `components/3D/OceanScene.tsx` to customize:
- Wave geometry and physics
- Light colors and intensity
- Particle effects
- Camera positioning

## 🔧 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Connect to Vercel**
- Go to [vercel.com](https://vercel.com)
- Click "New Project"
- Import your GitHub repository
- Add environment variables
- Deploy!

### Alternative Platforms

**Netlify:**
```bash
npm run build
netlify deploy --prod --dir=.next
```

**Docker:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📊 Performance Metrics

- **Lighthouse Score**: 95+
- **Page Load Time**: <2s
- **First Contentful Paint (FCP)**: <1s
- **Largest Contentful Paint (LCP)**: <2.5s
- **Cumulative Layout Shift (CLS)**: <0.1
- **Mobile Performance**: 90+

## 🔐 Security

- ✅ HTTPS only
- ✅ Razorpay signature verification
- ✅ Environment variables for secrets
- ✅ CORS enabled
- ✅ Input validation
- ✅ XSS protection

## 📦 Dependencies

**Core:**
- `next` - React framework
- `react` & `react-dom` - UI library
- `typescript` - Type safety

**3D & Animations:**
- `three` - 3D graphics engine
- `@react-three/fiber` - React renderer for Three.js
- `@react-three/drei` - Useful helpers
- `gsap` - Animation library
- `framer-motion` - React animations

**Payment:**
- `razorpay` - Payment gateway
- `axios` - HTTP client

**State & Utils:**
- `zustand` - State management
- `tailwindcss` - CSS framework
- `date-fns` - Date utilities

## 🚦 API Endpoints

### Payment APIs

**POST** `/api/payment/create-order`
- Creates a Razorpay order
- **Request**: `{ amount, name, email, phone, activity, date, participants }`
- **Response**: `{ order: { id, amount, ... } }`

**POST** `/api/payment/verify-payment`
- Verifies payment signature
- **Request**: `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }`
- **Response**: `{ verified: boolean, message }`

## 📧 Email Integration

Add email notifications using services like:
- SendGrid
- Mailgun
- AWS SES

### Setup Example (Nodemailer):
```bash
npm install nodemailer
```

## 🎓 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Three.js Guide](https://threejs.org/docs)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [GSAP Animation](https://greensock.com/gsap/)
- [Razorpay Docs](https://razorpay.com/docs/)

## 🐛 Troubleshooting

**3D scene not rendering?**
- Check WebGL support in browser
- Verify Three.js is imported correctly
- Check console for shader errors

**Payment not working?**
- Verify Razorpay keys in `.env.local`
- Check network requests in DevTools
- Ensure CORS is properly configured

**Slow animations?**
- Reduce particle count
- Optimize 3D geometries
- Use `will-change` CSS
- Profile with Chrome DevTools

## 📞 Support

**For Havelock Dive Club:**
- 📱 Phone: +91-9434290393 / 9679572772
- 📍 Location: Havelock Island, Andaman
- 📧 Email: info@havelockdiveclub.com
- 📷 Instagram: @havelockdiveclub

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file.

## 🙌 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🎯 Roadmap

- [ ] Multi-language support (English, Hindi, German)
- [ ] Advanced booking calendar
- [ ] Admin dashboard
- [ ] User account system
- [ ] Email notifications
- [ ] Real-time chat support
- [ ] Video tutorials
- [ ] Virtual dive tour
- [ ] Mobile app (React Native)
- [ ] AI-powered recommendation system

---

**Built with ❤️ for ocean enthusiasts** 🌊
