# HutBite 🍕

> A modern food delivery app with TikTok-style video content and comprehensive ordering system

[![Version](https://img.shields.io/badge/version-1.3.0-blue.svg)](https://github.com/kiandev/hutbite)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.4-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0.7-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue.svg)](https://www.typescriptlang.org/)

## 🚀 Features

### Core Functionality
- **Video-First Feed**: TikTok-style vertical video feed showcasing restaurant content
- **Complete Ordering System**: Full basket, checkout, and payment processing
- **Multi-Restaurant Support**: Switch between different restaurants seamlessly
- **Real-Time Deliverability**: Check delivery areas with postcode validation
- **Store Hours Management**: Dynamic open/closed status with ordering restrictions

### Payment & Orders
- **Stripe Integration**: Secure payment processing with multiple payment methods
- **Order Tracking**: Complete order history and status updates
- **SMS Notifications**: Order confirmations via SMS
- **Phone Verification**: PIN-based phone number verification system
- **Guest & Authenticated Orders**: Support for both user types

### User Experience
- **Postcode Onboarding**: Location-based setup with GPS detection
- **Address Management**: Addressy integration for UK address validation
- **Product Customization**: Complex options and toppings system
- **Basket Management**: Persistent basket with conflict resolution
- **Cross-Platform**: iOS, Android, and Web support

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React Native + Expo Router
- **Language**: TypeScript
- **State Management**: React Context + Zustand
- **Backend**: Supabase (PostgreSQL)
- **Payments**: Stripe
- **Maps**: Google Maps
- **Testing**: Jest + React Native Testing Library

### Key Integrations
- **Supabase**: Database, authentication, real-time subscriptions
- **Stripe**: Payment processing and webhooks
- **TGF API**: Restaurant menu data and order submission
- **HubRise**: Order management and POS integration
- **Addressy**: UK address validation and postcode lookup
- **OpenStreetMap**: Reverse geocoding for location services

## 🛠️ Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI and Expo Go app for quick iteration and testing
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Setup

1. **Clone the repository**
   ```bash
   git clone [https://github.com/kiandev/hutbite.git](https://github.com/kiandev/hutbite.git)
   cd hutbite/HutBite
